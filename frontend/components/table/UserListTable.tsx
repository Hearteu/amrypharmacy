"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Define data types
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
  full_name: string;
  address: string;
  contact: string | null;
  email: string | null;
  role_id: number | null;
}

export default function UserListTable() {
  const [users, setUsers] = useState<MergedData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, personsRes, rolesRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/pharmacy/users/"),
          fetch("http://127.0.0.1:8000/pharmacy/persons/"),
          fetch("http://127.0.0.1:8000/pharmacy/roles/"),
        ]);

        const usersData: User[] = await usersRes.json();
        const personsData: Person[] = await personsRes.json();
        const rolesData: Role[] = await rolesRes.json();

        setRoles(rolesData); // Store roles in state

        // Merge users with persons
        const mergedData: MergedData[] = usersData.map((user) => {
          const person = personsData.find(
            (p) => p.person_id === user.person_id
          );
          return {
            user_id: user.user_id,
            username: user.username,
            full_name: person
              ? `${person.first_name || ""} ${person.last_name || ""}`.trim()
              : "Unknown",
            address: person?.address || "No Address",
            contact: person?.contact || "No Contact",
            email: person?.email || "No Email",
            role_id: user.role_id,
          };
        });

        setUsers(mergedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle role change and update the backend
  const handleRoleChange = async (user_id: number, newRoleId: number) => {
    try {
      console.log(
        `Updating role for user_id ${user_id} to role_id ${newRoleId}`
      );

      const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/users/${user_id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role_id: newRoleId }), // Correctly updating role_id for the user
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update role");
      }

      // Update the UI with the new role_id
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === user_id ? { ...user, role_id: newRoleId } : user
        )
      );

      setEditingUserId(null); // Exit edit mode
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    }
  };



  return (
    <Card className="my-2">
      <CardHeader>
        <CardTitle>User List</CardTitle>
        
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.address}</TableCell>
                  <TableCell>{user.contact}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {editingUserId === user.user_id ? (
                      <RoleSelector
                        userId={user.user_id}
                        currentRoleId={user.role_id}
                        roles={roles}
                        onRoleChange={handleRoleChange}
                      />
                    ) : (
                      roles.find((r) => r.role_id === user.role_id)
                        ?.role_name || "No Role"
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.user_id ? (
                      <>
                        <div className="flex gap-x-2">
                          <Button onClick={() => setEditingUserId(null)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setEditingUserId(null)} className="bg-red-600">
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button onClick={() => setEditingUserId(user.user_id)}>
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Role Selector Component (Dropdown)
function RoleSelector({
  userId,
  currentRoleId,
  roles,
  onRoleChange,
}: {
  userId: number;
  currentRoleId: number | null;
  roles: Role[];
  onRoleChange: (userId: number, newRoleId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(
    roles.find((role) => role.role_id === currentRoleId)?.role_name || "No Role"
  );

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
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup>
              {roles.map((role) => (
                <CommandItem
                  key={role.role_id}
                  value={role.role_name}
                  onSelect={() => {
                    setSelectedRole(role.role_name);
                    setOpen(false);
                    onRoleChange(userId, role.role_id);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedRole === role.role_name
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {role.role_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
