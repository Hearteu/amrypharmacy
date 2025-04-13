"use client";

import { useRouter, usePathname } from "next/navigation";
import axios, { AxiosResponse } from "axios";
import { z } from "zod";
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
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  UserFormSchema,
  useUserForm,
} from "@/app/lib/services/schemas/personSchema";
import { useEffect, useState } from "react";
import { Roles } from "@/app/lib/types/persons";
import { getRoleData } from "@/app/lib/services/Persons";
import { fetchUserLocations } from "@/app/lib/services/location";
import { Location } from "@/app/lib/types/location";

interface RegisterFormProps {
  onSuccess: (data: AxiosResponse) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { form } = useUserForm(null);

  const [open, setOpen] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);

  const [locationData, setLocationData] = useState<Location[]>([]);
  const [roles, setRoles] = useState<Roles[]>([]);

  const refreshData = async () => {
    try {
      const roles = await getRoleData();
      setRoles(roles);
      const location = await fetchUserLocations();
      setLocationData(location);
    } catch (error) {
      console.error("Error fetching data", error);
      setRoles([]);
      setLocationData([]);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle form submission
  const handleRegister = async (values: z.infer<typeof UserFormSchema>) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/pharmacy/users/",
        values
      );
      console.log("User registered successfully:", response.data);

      // Check if this is a user registration or admin adding a user
      if (pathname === "/register") {
        router.push("/dashboard");
      } // Redirect to login page after registration
      else if (onSuccess) {
        onSuccess(response.data); // Close the modal in admin panel
        // window.location.reload();
      }
    } catch (error) {
      console.error("Registration failed:", error);
      console.log(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
        {/* First Name */}
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name:</FormLabel>
              <FormControl>
                <Input placeholder="Enter your first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name:</FormLabel>
              <FormControl>
                <Input placeholder="Enter your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address:</FormLabel>
              <FormControl>
                <Input placeholder="Enter your address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact */}
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact:</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter your contact number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email:</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password:</FormLabel>
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

        <FormField
          control={form.control}
          name="role_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Role:</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {
                        roles.find(
                          (role) => role.role_id.toString() == field.value
                        )?.role_name
                      }
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search role..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No roles found.</CommandEmpty>
                      <CommandGroup>
                        {roles.map((role) => (
                          <CommandItem
                            key={role.role_id}
                            value={role.role_name}
                            onSelect={() => {
                              console.log(
                                "✅ Role Selected:",
                                role.role_name,
                                " (ID:",
                                role.role_id,
                                ")"
                              );
                              field.onChange(role.role_id.toString());
                              setOpen(false);
                              console.log(
                                "🔄 Updated Form Value:",
                                form.getValues("role_id")
                              );
                            }}
                          >
                            {role.role_name}
                            <Check
                              className={cn(
                                "ml-auto",
                                role.role_name === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Location:</FormLabel>
              <Popover open={openLocation} onOpenChange={setOpenLocation}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {
                        locationData.find(
                          (location) =>
                            location.location_id.toString() == field.value
                        )?.location
                      }
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search role..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No roles found.</CommandEmpty>
                      <CommandGroup>
                        {locationData.map((location) => (
                          <CommandItem
                            key={location.location_id}
                            value={location.location}
                            onSelect={() => {
                              console.log(
                                "✅ Location Selected:",
                                location.location,
                                " (ID:",
                                location.location_id,
                                ")"
                              );
                              field.onChange(location.location_id.toString());
                              setOpenLocation(false);
                              console.log(
                                "🔄 Updated Form Value:",
                                form.getValues("location_id")
                              );
                            }}
                          >
                            {location.location}
                            <Check
                              className={cn(
                                "ml-auto",
                                location.location === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  );
}
