import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Microfyxd OS',
  description: 'Microfyxd OS — holographic presence interface for the autonomous agent system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}