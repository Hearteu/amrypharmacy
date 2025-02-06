"use client";

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
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";



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
  password: z.string().optional(),
  role: z.string().optional(),
});

interface EditUserFormProps {
  user_id: number;
}

export default function EditUserForm({ user_id }: EditUserFormProps) {
  const [userData, setUserData] = useState<any>(null);
  const [personData, setPersonData] = useState<any>(null);
  const [roleData, setRoleData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      address: "",
      contact: "",
      email: "",
      password: "",
      role: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_BASE_URL = "http://127.0.0.1:8000/pharmacy";

        // Step 1: Fetch user data
        const userResponse = await axios.get(
          `${API_BASE_URL}/users/${user_id}/`
        );
        const userArray = userResponse.data;

        console.log("Full User Response:", userArray);

        // ✅ Ensure we get the first object if API returns an array
        const user = Array.isArray(userArray) ? userArray[0] : userArray;

        // ✅ Log again to check if person_id exists
        console.log("Processed User Object:", user);

        if (!user.person_id) {
          console.warn("No person_id found in user data!");
        }

        setUserData(user);

        // Step 2: Fetch person data ONLY IF person_id exists
        if (user.person_id) {
          const personResponse = await axios.get(
            `${API_BASE_URL}/persons/${user.person_id}/`
          );
          if (Array.isArray(personResponse.data) && personResponse.data.length > 0) {
            setPersonData(personResponse.data[0]); // ✅ Extract first object
          } else {
            console.warn("Unexpected personData format:", personResponse.data);
          }
        }

        // Step 3: Fetch role data ONLY IF role_id exists
        if (user.role_id) {
          const roleResponse = await axios.get(
            `${API_BASE_URL}/roles/${user.role_id}/`
          );
          if (Array.isArray(roleResponse.data) && roleResponse.data.length > 0) {
            setRoleData(roleResponse.data[0]); // ✅ Extract first object
          } else {
            console.warn("Unexpected roleData format:", roleResponse.data);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (user_id) {
      fetchData();
    }
  }, [user_id]);

  const onSubmit = (data: any) => {
    console.log("Form Submitted:", data);
  };

  useEffect(() => {
    if (personData ) {
      console.log("Raw Person Data:", personData); // 🔍 Logs current form values before reset

      form.reset({
        first_name: personData.first_name || "",
        last_name: personData.last_name || "",
        address: personData.address || "",
        contact: personData.contact || "",
        email: personData.email || "",
        password: "", // Always keep empty for security
        role: roleData?.role_name || "",
      });
      console.log("After reset:", personData.first_name); // 🔍 Logs current form values before reset

    }
  }, [personData, roleData, form]);
  // if (loading) return <p>Loading...</p>;

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name:</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input type="tel" {...field} />
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
                  <Input type="email" {...field} />
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
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role:</FormLabel>
                <FormControl>
                  <Input type="role" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit">Sumbit</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
