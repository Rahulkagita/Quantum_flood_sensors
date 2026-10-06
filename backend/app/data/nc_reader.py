"""
NetCDF Rainfall dataset reader using scipy.io.netcdf.
Parses IMD (India Meteorological Department) 0.25x0.25 gridded rainfall data.
"""
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import scipy.io
from app.config import settings

class RainfallDatasetReader:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.RAINFALL_DIR
        self._cache: Dict[str, dict] = {}

    def list_available_years(self) -> List[int]:
        years = []
        for file in self.data_dir.glob("RF25_ind*_rfp25.nc"):
            try:
                # filename format: RF25_ind{year}_rfp25.nc
                stem = file.stem
                part = stem.split("_")[1].replace("ind", "")
                years.append(int(part))
            except Exception:
                continue
        return sorted(years)

    def get_dataset_file(self, year: int) -> Path:
        p = self.data_dir / f"RF25_ind{year}_rfp25.nc"
        if not p.exists():
            raise FileNotFoundError(f"Rainfall file for year {year} not found at {p}")
        return p

    def read_grid_metadata(self, year: int = 2024) -> dict:
        file_path = self.get_dataset_file(year)
        with scipy.io.netcdf_file(str(file_path), "r", mmap=False) as nc:
            lons = nc.variables["LONGITUDE"][:].copy()
            lats = nc.variables["LATITUDE"][:].copy()
            times = nc.variables["TIME"][:].copy()
            return {
                "year": year,
                "num_timesteps": len(times),
                "lon_min": float(lons.min()),
                "lon_max": float(lons.max()),
                "lon_step": float(lons[1] - lons[0]) if len(lons) > 1 else 0.25,
                "lat_min": float(lats.min()),
                "lat_max": float(lats.max()),
                "lat_step": float(lats[1] - lats[0]) if len(lats) > 1 else 0.25,
            }

    def sample_rainfall_for_point(
        self,
        lon: float,
        lat: float,
        year: int = 2024,
        day_indices: Optional[List[int]] = None
    ) -> List[float]:
        """
        Samples rainfall (mm) at a given (lon, lat) for specific days (or last 17 observations).
        """
        file_path = self.get_dataset_file(year)
        with scipy.io.netcdf_file(str(file_path), "r", mmap=False) as nc:
            lons = nc.variables["LONGITUDE"][:]
            lats = nc.variables["LATITUDE"][:]
            
            # Find nearest grid index
            lon_idx = int(np.argmin(np.abs(lons - lon)))
            lat_idx = int(np.argmin(np.abs(lats - lat)))

            var = nc.variables["RAINFALL"]
            total_days = var.shape[0]

            if day_indices is None:
                # Default to peak monsoon sequence (e.g. days 200 to 216 ~ July/August)
                day_indices = list(range(200, min(total_days, 217)))

            values = []
            for d in day_indices:
                if 0 <= d < total_days:
                    v = float(var[d, lat_idx, lon_idx])
                    # IMD uses -999.0 for missing / ocean points
                    values.append(max(0.0, v) if v > -900 else 0.0)
                else:
                    values.append(0.0)

            return values

    def get_basin_average_rainfall(
        self,
        basin_id: str,
        year: int = 2024,
        day_idx: int = 205
    ) -> float:
        """
        Computes spatial mean rainfall over a basin bounding box for a given day.
        """
        bounds = settings.BASIN_BOUNDS.get(basin_id, [80.0, 15.5, 82.0, 17.5])
        min_lon, min_lat, max_lon, max_lat = bounds

        file_path = self.get_dataset_file(year)
        with scipy.io.netcdf_file(str(file_path), "r", mmap=False) as nc:
            lons = nc.variables["LONGITUDE"][:]
            lats = nc.variables["LATITUDE"][:]

            lon_mask = (lons >= min_lon) & (lons <= max_lon)
            lat_mask = (lats >= min_lat) & (lats <= max_lat)

            sub_grid = nc.variables["RAINFALL"][day_idx, lat_mask, :][:, lon_mask]
            valid = sub_grid[sub_grid > -900]
            if len(valid) == 0:
                return 0.0
            return float(np.mean(valid))
