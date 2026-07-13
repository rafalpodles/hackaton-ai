import type { Metadata } from "next";
import { Space_Grotesk, Manrope, Chakra_Petch, JetBrains_Mono } from "next/font/google";
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

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-chakra-petch",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
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
        className={`${spaceGrotesk.variable} ${manrope.variable} ${chakraPetch.variable} ${jetbrainsMono.variable} font-space-grotesk bg-ink text-on-surface antialiased`}
      >
        <GeocitiesProvider>
          {children}
          <GeocitiesExtras />
        </GeocitiesProvider>
      </body>
    </html>
  );
}
