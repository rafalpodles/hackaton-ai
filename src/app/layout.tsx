import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { GeocitiesProvider } from "@/components/geocities/geocities-provider";
import GeocitiesExtras from "@/components/geocities/geocities-extras";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Spyrosoft AI Hackathon",
  description: "Przeglądaj i głosuj na projekty hackathonowe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable} font-manrope bg-[#0e0e13] text-[#f8f5fd] antialiased`}
      >
        <GeocitiesProvider>
          {children}
          <GeocitiesExtras />
        </GeocitiesProvider>
      </body>
    </html>
  );
}
