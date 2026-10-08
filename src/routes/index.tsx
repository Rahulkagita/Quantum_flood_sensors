import { createFileRoute } from "@tanstack/react-router";
import { OverviewScreen } from "./overview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quantum Flood Response Command Center — Overview" },
      {
        name: "description",
        content: "UC-067 Command Center Overview map and disaster-response status.",
      },
    ],
  }),
  component: OverviewScreen,
});
