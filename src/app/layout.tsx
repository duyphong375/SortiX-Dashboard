import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "SortiX",
  description:
    "Hệ thống điều khiển và giám sát thời gian thực băng tải phân loại thông minh SortiX (ESP32-C5, Camera AI YOLOv8, MQTT, Telegram và Email)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#070b14" />
      </head>
      <body className={`${inter.className} min-h-screen bg-[#070b14] text-slate-100 antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <DashboardLayout>{children}</DashboardLayout>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
