"use client";

import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

// Define form validation schema
const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  contact: z.string().regex(/^\d{10}$/, { message: "Contact must be a valid 10-digit number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function Register({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      address: "",
      contact: "",
      email: "",
      password: "",
    },
  });

  // Handle form submission
  const handleRegister = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/pharmacy/users/", values);
      console.log("User registered successfully:", response.data);

      // Check if this is a user registration or admin adding a user
      if (pathname === "/register") {
        router.push("/"); // Redirect to login page after registration
      } else if (onClose) {
        onClose(); // Close the modal in admin panel
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
        {/* First Name */}
        <FormField control={form.control} name="first_name" render={({ field }) => (
          <FormItem>
            <FormLabel>First Name:</FormLabel>
            <FormControl>
              <Input placeholder="Enter your first name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Last Name */}
        <FormField control={form.control} name="last_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name:</FormLabel>
            <FormControl>
              <Input placeholder="Enter your last name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Address */}
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Address:</FormLabel>
            <FormControl>
              <Input placeholder="Enter your address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Contact */}
        <FormField control={form.control} name="contact" render={({ field }) => (
          <FormItem>
            <FormLabel>Contact:</FormLabel>
            <FormControl>
              <Input type="tel" placeholder="Enter your contact number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Email */}
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email:</FormLabel>
            <FormControl>
              <Input type="email" placeholder="Enter your email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Password */}
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password:</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Enter your password" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  );
}
