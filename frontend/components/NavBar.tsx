import {
  NavigationMenu,
  navigationMenuTriggerStyle,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { getSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [session, updateSession] = useState(null);
  const fetchSession = async () => {
    const _session = await getSession();
    console.log(_session);
    updateSession(_session);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 h-full w-64 bg-[#F4F5FC]">
        <div className="flex flex-col justify-center items-center m-8 mb-2">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="alt"
              width={100}
              height={100}
              unoptimized
            />
          </Link>
          <h1 className="mt-4 text-lg font-semibold text-[#303086]">
            Amry Pharmacy
          </h1>
          <h2 onClick={signOut}>
            Hello, {session?.user?.username} {session?.user.role_id}
          </h2>
        </div>
        <NavigationMenu>
          <NavigationMenuList className="flex flex-col p-4 space-y-2 items-stretch ">
            <NavigationMenuItem>
              <Link href="/dashboard" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/product-list" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Inventory
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/pos" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Sales Orders
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/suppliers" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Suppliers
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/purchase-orders" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Purchase Orders
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/stock-transfer" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Stock Transfer
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="">
              <Link href="/user-list" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  List of Users
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </>
  );
}
