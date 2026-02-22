import "./globals.css";
import Navbar from "./navbar/page";
import Sidebar from "@/components/sidebar";
import { AppProvider } from "@/lib/AppContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Navbar />
          <Sidebar />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
