"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  ArrowLeftRight,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  ReceiptText,
  Boxes,
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Session } from "@/app/lib/types/session";

export default function NavBar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [session, updateSession] = useState<Session | null>(null);
  const fetchSession = async () => {
    const _session: Session | null = await getSession();
    updateSession(_session);
  };

  useEffect(() => {
    fetchSession();
  }, []);
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/product-list", label: "Inventory", icon: Package },
    { href: "/pos", label: "Point of Sale System", icon: ShoppingCart },
    { href: "/transactions", label: "Transaction History", icon: ReceiptText },
    { href: "/stock-out-history", label: "Stock Transactions", icon: Boxes },
    { href: "/suppliers", label: "Suppliers", icon: Truck },
    { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
    { href: "/stock-transfer", label: "Stock Transfer", icon: ArrowLeftRight },
    { href: "/user-list", label: "List of Users", icon: Users },
    // StockOutHistory
  ];

  const handleSignOut = async () => {
    await signOut({
      redirect: true,
      callbackUrl: "/", // Explicitly redirect to the login page
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col justify-center items-center p-6 pb-2">
        {/* {session?.user?.role_name !== "admin" && ( */}
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="Amry Pharmacy Logo"
            width={80}
            height={80}
            unoptimized
            className="rounded-full"
          />
        </Link>
        {/* )} */}
        <h1 className="mt-3 text-lg font-bold text-[#303086]">Amry Pharmacy</h1>
        <div className="mt-2 text-center">
          <p className="text-sm font-medium">
            Hello, {session?.user?.username || "Loading..."}
            {session?.user?.location_id}
          </p>
          <p className="text-xs text-muted-foreground">
            {session?.user?.role_name}
          </p>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex-1 overflow-auto px-3 py-2">
        <NavigationMenu orientation="vertical" className="w-full max-w-none">
          <NavigationMenuList className="flex flex-col space-y-1 items-stretch w-full">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href} className="w-full">
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-[#303086]/10 hover:text-[#303086]",
                      "focus:bg-[#303086]/10 focus:text-[#303086] focus:outline-none"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-[#303086] hover:bg-[#303086]/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed top-0 left-0 h-full w-64 bg-[#F4F5FC] border-r shadow-sm hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Trigger */}
      <div className="fixed top-4 left-4 md:hidden z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[#F4F5FC]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
