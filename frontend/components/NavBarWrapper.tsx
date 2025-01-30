"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";

// Define the props type
interface NavBarWrapperProps {
  children: ReactNode;
}

export default function NavBarWrapper({ children }: NavBarWrapperProps) {
  const pathname = usePathname();

  // Define routes where the NavBar should not appear
  const hideNavBarRoutes = ["/login", "/register"];
  const shouldHideNavBar = hideNavBarRoutes.includes(pathname);

  return (
    <div className={`flex min-h-screen ${shouldHideNavBar ? "" : "ml-64"}`}>
      {!shouldHideNavBar && <NavBar />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
