import os
from pathlib import Path
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Flood Sensor Placement Intelligence API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_RAW_DIR: Path = BASE_DIR / "data" / "raw"
    RAINFALL_DIR: Path = DATA_RAW_DIR / "rainfall"
    GEOSPATIAL_DIR: Path = DATA_RAW_DIR / "geospatial"
    POPULATION_TIF: Path = GEOSPATIAL_DIR / "ind_ppp_2020_UNadj_constrained.tif"

    # Supported basins bounding boxes: [min_lon, min_lat, max_lon, max_lat]
    BASIN_BOUNDS: dict = {
        "krishna": [79.5, 15.5, 81.5, 17.2],
        "godavari": [80.5, 16.0, 82.8, 18.2],
    }

settings = Settings()
