"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, Currency } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface UIState {
  theme: Theme;
  currency: Currency;
  sidebarCollapsed: boolean;
  setTheme: (t: Theme) => void;
  setCurrency: (c: Currency) => void;
  toggleSidebar: () => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      theme: "blush",
      currency: "USD",
      sidebarCollapsed: false,
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },
      setCurrency: (currency) => {
        set({ currency });
        // Persist to Supabase so it survives across devices/browsers
        try {
          const supabase = createClient();
          supabase.auth.updateUser({ data: { currency } }).catch(() => {});
        } catch {}
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "ll_ui" }
  )
);
