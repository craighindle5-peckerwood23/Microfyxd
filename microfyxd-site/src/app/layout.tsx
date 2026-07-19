import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Microfyxd Cockpit",
  description: "Autonomous agent cockpit — goals, tasks, ECU telemetry, and agent loop state",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
