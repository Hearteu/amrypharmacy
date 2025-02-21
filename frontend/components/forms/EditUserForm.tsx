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
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TypeOf, z } from "zod";
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
  role_id: z.string().optional(),
});

interface EditUserFormProps {
  user_id: number;
  onSuccess: (data: AxiosResponse) => void;
}

interface Role {
  role_id: number;
  role_name: string;
}

export default function EditUserForm({ user_id, onSuccess }: EditUserFormProps) {
  const [userData, setUserData] = useState<any>(null);
  const [personData, setPersonData] = useState<any>(null);
  const [roleData, setRoleData] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      address: "",
      contact: "",
      email: "",
      password: "",
      role_id: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_BASE_URL = "http://127.0.0.1:8000/pharmacy";

        // Step 1: Fetch user data
        const userResponse = await axios.get(
          `${API_BASE_URL}/users/${user_id}/`,
        );
        const userArray = userResponse.data;

        // ✅ Ensure we get the first object if API returns an array
        const user = Array.isArray(userArray) ? userArray[0] : userArray;

        setUserData(user);

        // Step 2: Fetch person data ONLY IF person_id exists
        if (user.person_id) {
          const personResponse = await axios.get(
            `${API_BASE_URL}/persons/${user.person_id}/`,
          );
          if (
            Array.isArray(personResponse.data) &&
            personResponse.data.length > 0
          ) {
            setPersonData(personResponse.data[0]); // ✅ Extract first object
          }
        }

        // Step 3: Fetch role data ONLY IF role_id exists
        if (user.role_id) {
          const roleResponse = await axios.get(
            `${API_BASE_URL}/roles/${user.role_id}/`,
          );
          if (
            Array.isArray(roleResponse.data) &&
            roleResponse.data.length > 0
          ) {
            setRoleData(roleResponse.data[0]); // ✅ Extract first object
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (user_id) {
      fetchData();
    }
  }, [user_id]);

  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const roleRes = await fetch("http://127.0.0.1:8000/pharmacy/roles/");
        const rolesData: Role[] = await roleRes.json();
        console.log("Fetched Roles:", rolesData); // Log the fetched data

        setRoles(rolesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchRole();
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/users/${user_id}/`,
        data,
      );
      onSuccess(response)
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  useEffect(() => {
    if (personData) {
      form.reset({
        first_name: personData.first_name || "",
        last_name: personData.last_name || "",
        address: personData.address || "",
        contact: String(personData.contact) || "",
        email: personData.email || "",
        password: "", // Always keep empty for security
        role_id: String(roleData?.role_id) || "",
      });
    }
  }, [personData, roleData, form]);

    console.log("Roles:",roles)
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
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {
                          roles.find((role) => role.role_id == field.value)
                            ?.role_name
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
                                  ")",
                                );
                                field.onChange(role.role_id.toString());
                                setOpen(false);
                                console.log(
                                  "🔄 Updated Form Value:",
                                  form.getValues("role_id"),
                                );
                              }}
                            >
                              {role.role_name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  role.role_name === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
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
          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
