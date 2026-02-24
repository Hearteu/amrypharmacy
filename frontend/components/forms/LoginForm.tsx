"use client";

import service from "@/app/lib/services/session";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Use Next.js router for redirects
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define validation schema
const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export default function LoginForm() {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState("");
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Submitting", values);

      const res = await service.login(values);
      console.log("res", res);

      const session = await getSession();
      const userRole = session?.user?.role_name?.toLowerCase();

      // Redirect based on user role
      if (userRole && ["cashier", "pharmacist"].includes(userRole)) {
        router.push("/pos"); // Redirect cashiers and pharmacists to POS
      } else {
        router.push("/dashboard"); // Redirect other roles to dashboard
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An error occurred during login");
      }
      console.error(error);
    }
  };

  return (
    <div className="bg-[#2B2F88]">
      <div className="flex flex-col items-center justify-center mx-auto w-5/12 min-h-screen">
        <div className="bg-white p-8 flex flex-col items-center rounded-xl">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/logo.png`}
            alt="alt"
            width={150}
            height={150}
            unoptimized
            className="pb-8"
          />
          <h1 className="text-center mb-4 font-bold">
            Amry Pharmacy Inventory Management System
          </h1>
          <p className="text-center mb-4">Log In</p>

          {errorMessage && <p className="text-red-500">{errorMessage}</p>}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 w-full"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4">
                <Button type="submit">Log In</Button>
              </div>
            </form>
          </Form>

          {/* Demo credentials banner */}
          <div className="mt-6 w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 text-center mb-2">
              🔑 Demo Account (Read-Only)
            </p>
            <div className="text-sm text-blue-700 text-center space-y-1">
              <p>Username: <span className="font-mono font-bold">demo</span></p>
              <p>Password: <span className="font-mono font-bold">demo123</span></p>
            </div>
            <p className="text-xs text-blue-500 text-center mt-2">
              You can browse all features but cannot modify data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
