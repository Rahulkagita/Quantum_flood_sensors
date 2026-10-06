import type { Basin } from "@/lib/flood-intelligence";

/**
 * Alert domain. Mock only — shaped for a future GET /api/alerts and
 * POST /api/alerts/subscriptions. No email or WhatsApp delivery happens in the frontend.
 */
export type AlertLevel = "watch" | "warning" | "critical";
export type AlertChannel = "dashboard" | "email" | "whatsapp";

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  area: string;
  issuedAt: string;
  source: string;
}

export interface AlertChannelState { channel: AlertChannel; label: string; enabled: boolean; connected: boolean; }

export interface AlertService {
  list(basinId: Basin["id"]): Alert[];
  channels(): AlertChannelState[];
}

const alerts: Record<Basin["id"], Alert[]> = {
  krishna: [
    { id: "AL-KR-0412", level: "critical", title: "Prakasam Barrage inflow above danger mark", area: "Vijayawada urban reach", issuedAt: "18:42 IST", source: "Gauge KR-PK-018" },
    { id: "AL-KR-0409", level: "warning", title: "Low-lying wards likely inundated within 12 h", area: "Krishna Lanka · Ranigarithota", issuedAt: "17:55 IST", source: "Forecast model" },
    { id: "AL-KR-0401", level: "watch", title: "Sustained rainfall over upper catchment", area: "Nandigama · Jaggayyapeta", issuedAt: "16:20 IST", source: "Rain gauges" },
  ],
  godavari: [
    { id: "AL-GD-0218", level: "critical", title: "Dowleswaram discharge rising past second warning", area: "Rajamahendravaram", issuedAt: "18:30 IST", source: "Gauge GD-DW-042" },
    { id: "AL-GD-0214", level: "warning", title: "Embankment stress expected in Konaseema", area: "Kothapeta · Amalapuram", issuedAt: "17:10 IST", source: "Forecast model" },
    { id: "AL-GD-0207", level: "watch", title: "Upstream inflow from Bhadrachalam increasing", area: "Polavaram reach", issuedAt: "15:45 IST", source: "CWC feed (mock)" },
  ],
};

export const mockAlertService: AlertService = {
  list: (basinId) => alerts[basinId],
  channels: () => [
    { channel: "dashboard", label: "Dashboard", enabled: true, connected: true },
    { channel: "email", label: "Email", enabled: false, connected: false },
    { channel: "whatsapp", label: "WhatsApp", enabled: false, connected: false },
  ],
};
