import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simplotel — AI Hotel Guest Assistant",
  description: "Instantly answer guest questions about room availability, amenities, dining, and policies with Simplotel's AI-powered hotel assistant.",
  keywords: ["Simplotel", "hotel guest assistant", "AI", "room availability", "hotel technology"],
  themeColor: "#F1592A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-[family-name:var(--font-poppins)]">
        {children}
      </body>
    </html>
  );
}
