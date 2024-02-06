import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata = {
  title: "Loob",
  description: "Loob - Powered by seks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
