import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoundexAI - Investor-Ready Starts Here",
  description: "AI-powered platform connecting founders and investors. Build investor-ready startups with comprehensive business planning, task management, and investor matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} w-full `}>
        <AuthProvider>
          <MobileMenuProvider>
            <Header />
            {children}
          </MobileMenuProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}