import { createFileRoute } from "@tanstack/react-router";
import { AlertsScreen } from "./alerts";

export const Route = createFileRoute("/response")({
  head: () => ({
    meta: [
      { title: "Disaster Response & Alerts — PRAVAAH" },
      {
        name: "description",
        content: "Operational flood warning thresholds and emergency response dispatch readiness.",
      },
    ],
  }),
  component: AlertsScreen,
});
