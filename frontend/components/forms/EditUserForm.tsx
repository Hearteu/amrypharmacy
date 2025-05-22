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
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import { Location } from "@/app/lib/types/location";
import { Users } from "@/app/lib/types/persons";
import { getRoleData, getUserData } from "@/app/lib/services/Persons";
import { fetchUserLocations } from "@/app/lib/services/location";
import {
  UserFormSchema,
  useUserForm,
} from "@/app/lib/services/schemas/personSchema";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "../ui/select";

interface EditUserFormProps {
  user_id: number;
  onSuccess: (data: AxiosResponse) => void;
}

interface Role {
  role_id: number;
  role_name: string;
}

export default function EditUserForm({
  user_id,
  onSuccess,
}: EditUserFormProps) {
  const [userData, setUserData] = useState<Users | null>(null);

  const { form, resetForm } = useUserForm(userData);

  useEffect(() => {
    resetForm();
  }, [userData]);

  const [locationData, setLocationData] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const refreshData = async () => {
    try {
      const userData = await getUserData({ user_id });
      setUserData(userData);
      console.log("indiv data", userData);
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

  const onSubmit = async (data: z.infer<typeof UserFormSchema>) => {
    console.log(data);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/users/${user_id}/`,
        data
      );
      onSuccess(response);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Input
                    type="tel"
                    {...field}
                    onChange={(e) => field.onChange(String(e.target.value))}
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
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="w-[200px]">
                <FormLabel>Status:</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select status"
                        className="capitalize"
                      >
                        {field.value
                          ? field.value.charAt(0).toUpperCase() +
                            field.value.slice(1)
                          : "Select status"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
