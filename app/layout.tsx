import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata = {
  title: "Loob",
  description: "Loob - Powered by seks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
