# DATA AUDIT REPORT — UC-067 BACKEND DATASETS

## 1. Executive Summary

This audit documents the authoritative physical and geospatial datasets present under `backend/data/raw/`. No external or synthetic datasets have been added.

## 2. Dataset Inventory

### Dataset A: IMD High-Resolution Gridded Daily Rainfall NetCDF Series

- **Filenames:**
  - `backend/data/raw/rainfall/RF25_ind1981_rfp25.nc` (365 daily timesteps)
  - `backend/data/raw/rainfall/RF25_ind1986_rfp25.nc` (365 daily timesteps)
  - `backend/data/raw/rainfall/RF25_ind2022_rfp25.nc` (365 daily timesteps)
  - `backend/data/raw/rainfall/RF25_ind2023_rfp25.nc` (365 daily timesteps)
  - `backend/data/raw/rainfall/RF25_ind2024_rfp25.nc` (366 daily timesteps)
  - `backend/data/raw/rainfall/RF25_ind2025_rfp25.nc` (365 daily timesteps)
- **Variables:**
  - `LONGITUDE` (1D double array, $135$ points, $66.5^\circ$E to $100.0^\circ$E, resolution $0.25^\circ \approx 27\text{ km}$)
  - `LATITUDE` (1D double array, $129$ points, $6.5^\circ$N to $38.5^\circ$N, resolution $0.25^\circ \approx 27\text{ km}$)
  - `TIME` (1D double array, daily Julian days)
  - `RAINFALL` (3D float array `[TIME, LATITUDE, LONGITUDE]`, units: $\text{mm/day}$)
- **Geographic Coverage:** Entire Indian subcontinent (Krishna & Godavari basins fall in $79.5^\circ\text{E} - 82.8^\circ\text{E}$, $15.5^\circ\text{N} - 18.2^\circ\text{N}$).
- **Missing Value Handling:** Missing/ocean points encode as $-999.0$. Masked to $0.0\text{ mm}$ during spatial extraction.
- **Forecasting Suitability:** **HIGH**. Provides continuous multi-day temporal sequences of precipitation ($R_{t-3}, R_{t-2}, R_{t-1}$) to predict future heavy rainfall probability $P(R_{t+1} \ge 35\text{ mm})$ or 3-day accumulated surge risk.

### Dataset B: WorldPop 2020 High-Resolution Population GeoTIFF

- **Filename:** `backend/data/raw/geospatial/ind_ppp_2020_UNadj_constrained.tif` (488 MB)
- **Spatial Resolution:** $0.00083333^\circ \approx 100\text{ meters}$ per pixel ($35,075 \times 34,497$ grid).
- **Coordinate System:** WGS84 (`EPSG:4326`).
- **Variables:** Unadjusted human population counts per $100\text{m} \times 100\text{m}$ cell (`float32`).
- **Missing Values:** NaN / 0 for unpopulated or water bodies.
- **Forecasting Suitability:** **STATIC GEOSPATIAL FEATURE**. Provides high-resolution population density $P_i$ to weight spatial flood response demand.

---

## 3. Data Capabilities & Limitations

1. **Supported:**
   - Extreme precipitation forecasting (3-day surge prediction).
   - Historical anomaly tracking vs baselines (1981, 1986 vs 2022-2025).
   - High-resolution spatial demographic exposure weighting.
2. **Not Supported / Unavailable:**
   - **Live River-Level Gauge Data:** No live telemetry gauge dataset exists in raw files. River levels must NOT be fabricated.
