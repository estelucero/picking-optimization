import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Picking Optimization - Admin",
  description:
    "Herramienta de simulación logística para analizar el impacto de operarios en el tiempo de ejecución",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/box.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/box.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className="font-sans antialiased">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-64">
            <TopHeader />
            <main className="mt-20 bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-80px)]">
              {children}
            </main>
          </div>
        </div>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
