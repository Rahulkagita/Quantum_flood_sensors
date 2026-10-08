import { createFileRoute } from "@tanstack/react-router";
import { ResponseNetworkScreen } from "./response-network";

export const Route = createFileRoute("/network-optimization")({
  head: () => ({
    meta: [
      { title: "Network Optimization — PRAVAAH" },
      {
        name: "description",
        content: "Optimized sensor and relay infrastructure topology map for flood response.",
      },
    ],
  }),
  component: ResponseNetworkScreen,
});
