import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Media Kit Management",
  description: "Professional Visual Asset Management Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
