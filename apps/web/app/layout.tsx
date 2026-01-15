
import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { Provider } from "./provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MantlePay",
  description: "Compliance-ready payment Infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
