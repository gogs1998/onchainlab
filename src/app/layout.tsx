import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Nav from "@/components/Nav";
import DataProvider from "@/components/DataProvider";
import ChatPanel from "@/components/ChatPanel";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "OnChainLab — Bitcoin On-Chain Analytics",
  description:
    "Open-source Bitcoin on-chain analytics. 136 metrics. 17 years of data. Zero cost.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-[family-name:var(--font-sans)] antialiased">
        <Nav />
        <DataProvider>
          <main>{children}</main>
          <ChatPanel />
        </DataProvider>
      </body>
    </html>
  );
}
