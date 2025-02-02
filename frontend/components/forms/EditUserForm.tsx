"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Interfaces
interface User {
  user_id: number;
  username: string;
  person_id: number;
  role_id: number | null;
}

interface Person {
  person_id: number;
  first_name: string | null;
  last_name: string | null;
  address: string;
  contact: string | null;
  email: string | null;
}

interface Role {
  role_id: number;
  role_name: string;
}

interface MergedData {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  address: string;
  contact: string | null;
  email: string | null;
  role_name: string | null;
}

// Define form validation schema
const formSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters." }),
  contact: z
    .string()
    .regex(/^\d{10}$/, { message: "Contact must be a valid 10-digit number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().optional(), // Password is optional for editing
});

export default function EditUserForm({ user_id }: { user_id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const [userRes, personsRes, rolesRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/pharmacy/users/${user_id}/`),
          fetch("http://127.0.0.1:8000/pharmacy/persons/"),
          fetch("http://127.0.0.1:8000/pharmacy/roles/"),
        ]);

        if (!userRes.ok || !personsRes.ok || !rolesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const userData: User = await userRes.json();
        const personsData: Person[] = await personsRes.json();
        const rolesData: Role[] = await rolesRes.json();

        const person = personsData.find(
          (p) => p.person_id === userData.person_id
        );
        const role = rolesData.find((r) => r.role_id === userData.role_id);

        const mergedData: MergedData = {
          user_id: userData.user_id,
          username: userData.username,
          first_name: person?.first_name || "",
          last_name: person?.last_name || "",
          address: person?.address || "",
          contact: person?.contact || "",
          email: person?.email || "",
          role_name: role?.role_name || "",
        };

        form.reset({
          first_name: mergedData.first_name ?? undefined,
          last_name: mergedData.last_name ?? undefined,
          address: mergedData.address ?? undefined,
          contact: mergedData.contact ?? undefined,
          email: mergedData.email ?? undefined,
          password: "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [user_id]);

  // Handle form submission
  const handleEdit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await axios.put(
        `http://127.0.0.1:8000/pharmacy/users/update/${user_id}/`,
        values
      );
      console.log("User updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <Dialog onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (open) getData(); // Fetch user data only when dialog opens
      }}>
      <DialogTrigger asChild>
        <Button>Edit User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User</DialogTitle>
          <DialogDescription>
            Modify user details. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name:</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name:</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address:</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact:</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter contact number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email:</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
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
                  <FormLabel>New Password (optional):</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
