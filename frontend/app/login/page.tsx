"use client";

import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation"; // Use Next.js router for redirects
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

// Define validation schema
const formSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function Login() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: any) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/pharmacy/login/", values);
      const { access, refresh } = response.data;

      // Store tokens in local storage
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      router.push("/"); // Redirect on successful login
    } catch (error) {
      setErrorMessage("Invalid username or password.");
      console.log(error)
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mx-auto w-5/12 min-h-screen">
      <h1 className="text-center mb-4">Amry Pharmacy Inventory Management System</h1>
      <p className="text-center mb-4">Log In</p>
      
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <FormField control={form.control} name="username" render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid gap-4">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
