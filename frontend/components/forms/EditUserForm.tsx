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
  role: z.string().optional(),
});

interface EditUserFormProps {
  user_id: number;
}

interface Role {
  role_id: number;
  role_name: string;
}

interface RoleSelectorProps {
  roles: Role[]
  value: number | null
  onChange: (roleId: number) => void
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

        // ✅ Ensure we get the first object if API returns an array
        const user = Array.isArray(userArray) ? userArray[0] : userArray;

        setUserData(user);

        // Step 2: Fetch person data ONLY IF person_id exists
        if (user.person_id) {
          const personResponse = await axios.get(
            `${API_BASE_URL}/persons/${user.person_id}/`
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
            `${API_BASE_URL}/roles/${user.role_id}/`
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

  function RoleSelector({
    roles,
    currentRoleId,
    onRoleChange, // Callback to update the form
  }: {
    roles: Role[];
    currentRoleId: number | null;
    onRoleChange: (roleId: number) => void;
  }) {
    const [open, setOpen] = useState(false);

    // ✅ Set the initial selected role based on currentRoleId
    const currentRole = roles.find((role) => role.role_id === currentRoleId);
    const [selectedRole, setSelectedRole] = useState<string>(
      currentRole?.role_name || "Select Role"
    );

    // ✅ Update selected role when currentRoleId changes
    useEffect(() => {
      const newRole = roles.find((role) => role.role_id === currentRoleId);
      setSelectedRole(newRole?.role_name || "Select Role");
    }, [currentRoleId, roles]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[150px] justify-between">
            {selectedRole}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[150px] p-0">
          <Command>
            <CommandInput placeholder="Search role..." />
            <CommandList>
              {roles.length === 0 ? (
                <CommandEmpty>No roles found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {roles.map((role) => (
                    <CommandItem
                      key={role.role_id}
                      value={role.role_name}
                      onSelect={() => {
                        // form.setValue("role", role.role_name);
                        console.log(role.role_name) // ✅ Update form
                        setSelectedRole(role.role_name); // ✅ Update UI
                        onRoleChange(role.role_id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedRole === role.role_name
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {role.role_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        role_id: data.role, // ✅ Ensure correct role_id is sent
      };

      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/users/${user_id}/`,
        payload
      );

      console.log("Form Submitted:", payload);
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
        contact: personData.contact || "",
        email: personData.email || "",
        password: "", // Always keep empty for security
        role: roleData?.role_name || "",
      });
    }
  }, [personData, roleData, form]);

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
                <RoleSelector
                  roles={roles}
                  currentRoleId={userData?.role_id || null}
                  onRoleChange={(roleId) => {
                    console.log("Updating form role to:", roleId);
                  }}
                />
                </FormControl>
                
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
