"""
Unit and integration tests for Phase 1:
- Verifies NetCDF rainfall dataset reader
- Verifies GeoTIFF population sampler
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.data.nc_reader import RainfallDatasetReader
from app.data.population_sampler import PopulationSampler

def test_rainfall_reader():
    print("--- Testing RainfallDatasetReader ---")
    reader = RainfallDatasetReader()
    years = reader.list_available_years()
    print(f"Available years: {years}")
    assert len(years) > 0, "No rainfall years found"
    assert 2024 in years, "Year 2024 missing from rainfall dataset"

    meta = reader.read_grid_metadata(2024)
    print(f"Grid metadata (2024): {meta}")
    assert meta["num_timesteps"] in [365, 366]
    assert 66.0 <= meta["lon_min"] <= 67.0
    assert 6.0 <= meta["lat_min"] <= 7.0

    # Sample rainfall for Vijayawada (lon=80.648, lat=16.506)
    series = reader.sample_rainfall_for_point(80.648, 16.506, year=2024)
    print(f"Rainfall series sample (Vijayawada): {series[:5]} (len={len(series)})")
    assert len(series) > 0
    assert all(v >= 0.0 for v in series)

    # Average rainfall across Krishna and Godavari
    avg_k = reader.get_basin_average_rainfall("krishna", 2024, day_idx=205)
    avg_g = reader.get_basin_average_rainfall("godavari", 2024, day_idx=205)
    print(f"Spatial mean rainfall day 205 - Krishna: {avg_k:.2f} mm, Godavari: {avg_g:.2f} mm")
    print("Rainfall reader tests PASSED.")

def test_population_sampler():
    print("\n--- Testing PopulationSampler ---")
    sampler = PopulationSampler()
    meta = sampler.get_metadata()
    print(f"GeoTIFF metadata: {meta}")
    assert meta["file_exists"], "Population GeoTIFF file does not exist"
    assert meta["width"] == 35075
    assert meta["height"] == 34497

    # Sample population exposure around candidate C-31 (River Island near Vijayawada)
    c31_pop = sampler.sample_population_exposure(80.70, 16.40, radius_km=5.0)
    print(f"Sampled population exposure for C-31 (5km radius): {c31_pop}")
    assert c31_pop > 10000, f"Expected substantial population exposure, got {c31_pop}"

    # Sample population exposure around rural candidate
    rural_pop = sampler.sample_population_exposure(80.88, 15.86, radius_km=5.0)
    print(f"Sampled population exposure for C-35 (coastal outlet): {rural_pop}")
    assert rural_pop > 0

    print("Population sampler tests PASSED.")

if __name__ == "__main__":
    test_rainfall_reader()
    test_population_sampler()
    print("\nALL PHASE 1 DATA TESTS PASSED SUCCESSFULLY!")
