import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IndicatorParams } from "../types";
import { defaultIndicatorParams } from "../lib/indicators";

interface SettingsState {
  params: IndicatorParams;
  theme: "light" | "dark";
  updateParams: (patch: Partial<IndicatorParams>) => void;
  resetParams: () => void;
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      params: defaultIndicatorParams,
      theme: "light",
      updateParams: (patch) =>
        set((s) => ({ params: { ...s.params, ...patch } })),
      resetParams: () => set({ params: defaultIndicatorParams }),
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
            document.body.classList.toggle("dark", next === "dark");
          }
          return { theme: next };
        }),
      setTheme: (t) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", t === "dark");
          document.body.classList.toggle("dark", t === "dark");
        }
        set({ theme: t });
      },
    }),
    {
      name: "kafala-settings",
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", state.theme === "dark");
          document.body.classList.toggle("dark", state.theme === "dark");
        }
      },
    }
  )
);
