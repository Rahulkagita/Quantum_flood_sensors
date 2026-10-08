import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "fi-theme";

/** Runs before paint (inlined in <head>) so the persisted theme never flashes. */
export const themeBootScript = `(function(){try{var p=localStorage.getItem("${STORAGE_KEY}")||"light";var d=p==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (value: ThemePreference) => void;
}
const ThemeContext = createContext<ThemeContextValue>({
  preference: "light",
  resolved: "light",
  setPreference: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>("light");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (stored === "dark" || stored === "light" || stored === "system") setPref(stored);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next: ResolvedTheme =
        preference === "system" ? (media.matches ? "dark" : "light") : preference;
      const root = document.documentElement;
      root.classList.add("theme-transition");
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
      window.setTimeout(() => root.classList.remove("theme-transition"), 250);
      setResolved(next);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  const setPreference = useCallback((value: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, value);
    setPref(value);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
