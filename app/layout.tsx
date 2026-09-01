import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import { TrialBanner } from "@/components/TrialBanner";
import QueryProvider from "@/components/providers/QueryProvider";
import GlobalNotificationListener from "@/components/GlobalNotificationListener";

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
      <body className="w-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <MobileMenuProvider>
                  <TrialBanner />
                  <Header />
                  {children}
                  <Toaster richColors theme="dark" position="top-right" />
                  <GlobalNotificationListener />
                </MobileMenuProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}