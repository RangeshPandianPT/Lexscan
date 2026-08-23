import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { LiveFeedTicker } from "@/components/LiveFeedTicker";
import { ThemeProvider } from "@/components/ThemeProvider";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-code",
  display: "swap",
});

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
    <html
      lang="en"
      className={`dark ${firaSans.variable} ${firaCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("lexscan-theme");if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light");}else{document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased selection:bg-teal-500/30 selection:text-teal-300">
        <ThemeProvider>
          <div className="ambient-mesh-bg" />
          <div className="app-shell relative z-10">
            <Sidebar />
            <div className="app-main">
              {children}
            </div>
          </div>
          <LiveFeedTicker />
        </ThemeProvider>
      </body>
    </html>
  );
}
