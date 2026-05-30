import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { dataMode } from "@/lib/data";

export const metadata: Metadata = {
  title: "IRO — Onword",
  description: "Onword internal ops dashboard (Projects + Tasks)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const mode = dataMode();
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar mode={mode} />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
