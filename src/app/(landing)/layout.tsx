import { GarageBackground } from "@/components/landing/garage/garage-background";
import { BootOverlay } from "@/components/landing/garage/boot-overlay";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <GarageBackground />
      <BootOverlay />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
