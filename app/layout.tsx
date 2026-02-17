import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoundexAI - Investor-Ready Starts Here",
  description:
    "AI-powered platform connecting founders and investors. Build investor-ready startups with comprehensive business planning, task management, and investor matching.",
  icons: {
    icon: "/foundex.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.className} w-full `}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MobileMenuProvider>
              <Header />
              {children}
            </MobileMenuProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
