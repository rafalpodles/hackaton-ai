"use client";

import { createContext, useContext } from "react";
import type { Hackathon, HackathonParticipant } from "@/lib/types";

interface HackathonContextValue {
  hackathon: Hackathon;
  participant: HackathonParticipant | null;
}

export const HackathonContext = createContext<HackathonContextValue | null>(null);

export function useHackathon() {
  const ctx = useContext(HackathonContext);
  if (!ctx) throw new Error("useHackathon must be used within HackathonContext.Provider");
  return ctx;
}
