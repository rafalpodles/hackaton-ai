"use client";

import { createContext } from "react";
import type { Hackathon, HackathonParticipant } from "@/lib/types";

interface HackathonContextValue {
  hackathon: Hackathon;
  participant: HackathonParticipant | null;
}

export const HackathonContext = createContext<HackathonContextValue | null>(null);
