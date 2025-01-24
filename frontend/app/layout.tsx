import type { Metadata } from "next";
import "./globals.css";
import NavBarWrapper from "@/components/NavBarWrapper";


export const metadata: Metadata = {
  title: "Amry Pharmacy Inventory Management System",
  description: "An Inventory Management System created for Amry Pharmacy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className="antialiased">
        {/* Wrap everything in NavBarWrapper */}
        <NavBarWrapper>
          {/* Render children here */}
          {children}
        </NavBarWrapper>
      </body>
    </html>

  );
}
