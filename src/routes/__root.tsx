import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider, themeBootScript } from "../lib/theme";
import { BasinProvider } from "../lib/basin-context";
import { HeaderNav } from "../components/HeaderNav";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100 font-mono">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-7xl font-bold text-cyan-400">404</h1>
        <h2 className="text-xl font-semibold uppercase">Command Center Route Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested disaster response route does not exist.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded bg-cyan-950 border border-cyan-500/40 px-4 py-2 text-xs font-bold text-cyan-300 transition-colors hover:bg-cyan-900"
          >
            RETURN TO COMMAND CENTER OVERVIEW
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100 font-mono">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold tracking-tight text-amber-400">
          COMMAND CENTER APPLICATION ERROR
        </h1>
        <p className="text-xs text-slate-400">
          An unexpected error occurred while loading this view.
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded bg-cyan-950 border border-cyan-500/40 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900"
          >
            RETRY COMPONENT
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            RELOAD HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PRAVAAH — Flood Intelligence & Response Optimization (UC-067)" },
      {
        name: "description",
        content:
          "PRAVAAH: Flood Intelligence & Response Optimization for Krishna–Godavari Basin (UC-067).",
      },
      { name: "author", content: "PRAVAAH Intelligence Team" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <HeadContent />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] min-h-screen antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BasinProvider>
          <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans">
            <HeaderNav />
            <main className="flex-1 w-full bg-[var(--background)]">
              <Outlet />
            </main>
          </div>
        </BasinProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
