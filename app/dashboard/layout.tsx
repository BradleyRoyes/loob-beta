import { GeistSans } from "geist/font/sans";
import Footer from "../../components/Footer";
import ThemeButton from "../../components/ThemeButton";

export const metadata = {
  title: "Loob",
  description: "Loob - Powered by seks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <header className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-gray-900">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Loob</h1>
            <span className="ml-2 text-sm font-normal text-gray-500">at CIC</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeButton />
            <button className="px-4 py-2 rounded-md bg-blue-500 text-white">
              Back Stage
            </button>
          </div>
        </header>
        <main className="min-h-screen bg-gray-50 dark:bg-gray-800">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
