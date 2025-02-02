"use client"; // Ensure this is at the top to use hooks

import { useState, useEffect } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";

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
  role_name: string | null; // Fix: Use role_name instead of role_id
}

export default function UserList() {
  const [data, setData] = useState<MergedData[]>([]);
  const [loading, setLoading] = useState(true); // Loading state

  async function getData(): Promise<MergedData[]> {
    try {
      const [usersRes, personsRes, rolesRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/pharmacy/users/"),
        fetch("http://127.0.0.1:8000/pharmacy/persons/"),
        fetch("http://127.0.0.1:8000/pharmacy/roles/"),
      ]);

      if (!usersRes.ok || !personsRes.ok || !rolesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const usersData: User[] = await usersRes.json();
      const personsData: Person[] = await personsRes.json();
      const rolesData: Role[] = await rolesRes.json();

      // Merge users with persons and roles
      const mergedData: MergedData[] = usersData.map((user) => {
        const person = personsData.find((p) => p.person_id === user.person_id);
        const role = rolesData.find((r) => r.role_id === user.role_id);

        return {
          user_id: user.user_id,
          username: user.username,
          full_name: person
            ? `${person.first_name || ""} ${person.last_name || ""}`.trim()
            : "Unknown",
          address: person?.address || "No Address",
          contact: person?.contact || "No Contact",
          email: person?.email || "No Email",
          role_name: role?.role_name || "No Role", // Fix: Include role_name
        };
      });

      return mergedData;
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  }

  useEffect(() => {
    getData().then((fetchedData) => {
      setData(fetchedData);
      setLoading(false);
    });
  }, []);

  return (
    <>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </>
  );
}
