import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { LiveFeedTicker } from "@/components/LiveFeedTicker";

export const metadata: Metadata = {
  title: "LexScan — Legal Compliance Intelligence Dashboard",
  description:
    "LexScan monitors e-commerce product listings for compliance with Legal Metrology (Packaged Commodities) Rules, 2011.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="app-main">
            {children}
          </div>
        </div>
        <LiveFeedTicker />
      </body>
    </html>
  );
}
