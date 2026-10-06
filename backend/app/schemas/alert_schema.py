from typing import List, Optional
from pydantic import BaseModel, Field

class FloodAlert(BaseModel):
    id: str = Field(..., description="Unique alert identifier")
    basin_id: str = Field(..., description="Basin identifier (krishna | godavari)")
    level: str = Field(..., description="Alert level (INFO | WATCH | WARNING | CRITICAL)")
    risk_score: int = Field(..., description="Flood risk score (0-100)")
    title: str = Field(..., description="Alert title")
    reason: str = Field(..., description="Explicit human-readable reason for the alert")
    source: str = Field(..., description="Authoritative data source")
    timestamp: str = Field(..., description="ISO 8601 evaluation timestamp")

class AlertChannelState(BaseModel):
    channel: str = Field(..., description="Channel name (dashboard | email | whatsapp)")
    label: str = Field(..., description="Display label")
    enabled: bool = Field(..., description="Whether channel is enabled")
    connected: bool = Field(..., description="Whether backend delivery integration is connected")

class AlertResponse(BaseModel):
    basin_id: str = Field(..., description="Basin identifier")
    alerts: List[FloodAlert] = Field(..., description="List of active rule-based alerts")
    channels: List[AlertChannelState] = Field(..., description="Available alert channels status")
