import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useBasin } from "../lib/basin-context";
import { fetchAlerts, AlertResponseData } from "../lib/api-client";
import { Bell, ShieldAlert, Mail, MessageSquare, Monitor, CheckCircle2, XCircle, Info } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [{ title: "Alerts — Quantum Flood Response Command Center" }]
  }),
  component: AlertsScreen,
});

export function AlertsScreen() {
  const { basinId } = useBasin();
  const [alertData, setAlertData] = useState<AlertResponseData | null>(null);

  useEffect(() => {
    fetchAlerts(basinId).then(setAlertData);
  }, [basinId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> RULE-BASED FLOOD ALERT DISPATCH CENTER
            </h1>
            <span className="badge-state" data-state="LIVE">DETERMINISTIC RULES</span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Automated Flood Warning Thresholds derived from IMD Precipitation & WorldPop Exposure Data
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Alerts List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> ACTIVE DISASTER ALERTS ({alertData?.alerts.length ?? 0})
          </h2>

          <div className="space-y-3">
            {alertData?.alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900/90 border border-slate-800 rounded p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{alert.id}</span>
                  <span className="badge-risk" data-risk={alert.level}>
                    {alert.level} ({alert.risk_score}/100)
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100">{alert.title}</h3>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {alert.reason}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>Source: <b className="text-slate-400">{alert.source}</b></span>
                  <span>Evaluated: {new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Channels Status Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded p-5 space-y-4 h-fit">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" /> ALERT DELIVERY CHANNELS
          </h2>

          <div className="space-y-3 text-xs">
            {/* Dashboard HUD */}
            <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-cyan-400" /> Command Center HUD
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Real-time operational HUD alerts rendered on map & sidebar.
              </p>
            </div>

            {/* SDMA Email */}
            <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" /> SDMA Email Dispatch
                </span>
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> NOT CONNECTED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                SMTP email delivery service is currently not connected.
              </p>
            </div>

            {/* WhatsApp Broadcast */}
            <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-500" /> WhatsApp Emergency
                </span>
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> NOT CONNECTED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Twilio WhatsApp API integration is currently not connected.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-slate-500 flex items-start gap-2 font-sans">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Alert channels reflect actual backend capabilities. Delivery services (Email/WhatsApp) will be connected when backend integration is completed.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
