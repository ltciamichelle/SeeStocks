import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SeeStocks - Stock Market Tracker & Analytics",
  description:
    "Track real-time and delayed market quotes, manage user watchlists with Clerk authentication and MongoDB Atlas, search symbols, and view historical stock trends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body
          className={`${inter.variable} font-sans antialiased bg-[#f1f3f7] text-slate-900 min-h-screen selection:bg-[#ccff00] selection:text-black`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
