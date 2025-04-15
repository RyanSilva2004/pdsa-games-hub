import type React from "react";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { MainNav } from "@/shared/components/main-nav";
import { ModeToggle } from "@/shared/components/mode-toggle";
import "./globals.css";
import { CommonProvider } from "@/context/Common";

export const metadata = {
  title: "PDSA Games Hub",
  description:
    "A collection of games implementing various algorithms and data structures",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          <CommonProvider>
            <div className="flex flex-col min-h-screen">
              <header className="border-b">
                <div className="container flex h-16 items-center px-4">
                  <div className="mr-4 font-bold text-lg">PDSA Games</div>
                  <MainNav />
                  <div className="ml-auto flex items-center space-x-4">
                    <ModeToggle />
                  </div>
                </div>
              </header>
              {children}
            </div>
          </CommonProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
