import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stadium AI Co-Pilot - FIFA World Cup 2026 Operations",
  description: "Dynamic AI Co-Pilot reasoning layer for crowd control, staff dispatching, incident classification, and wayfinding support during FIFA World Cup 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 w-full max-w-[96%] mx-auto px-4 sm:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto bg-muted/30">
          <p>© 2026 FIFA World Cup Stadium Operations Center. All Rights Reserved. Built with Next.js & FastAPI.</p>
        </footer>
      </body>
    </html>
  );
}
