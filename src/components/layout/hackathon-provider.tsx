"use client";

import { HackathonContext } from "@/lib/hackathon-context";
import type { Hackathon, HackathonParticipant } from "@/lib/types";

export function HackathonProvider({
  hackathon,
  participant,
  children,
}: {
  hackathon: Hackathon;
  participant: HackathonParticipant | null;
  children: React.ReactNode;
}) {
  return (
    <HackathonContext.Provider value={{ hackathon, participant }}>
      {children}
    </HackathonContext.Provider>
  );
}
