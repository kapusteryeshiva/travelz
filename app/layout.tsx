import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Where We've Been",
  description: "A shared map of everywhere your friend group has traveled."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}