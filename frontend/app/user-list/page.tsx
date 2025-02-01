"use client"; // Ensure this is at the top to use hooks

import UserListTable from "@/components/table/UserListTable";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserList() {
  const router = useRouter(); // Initialize router

  // Navigate to the Create Product page
  const handleAddNewItem = () => {
    router.push("/createProduct");
  };

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold"></h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button
              className="flex items-center gap-2 bg-blue-500 text-white"
              onClick={handleAddNewItem}
            >
              <Plus size={16} /> Add New Item
            </Button>
            <div className="flex items-center">
              <div className="ml-3">
                <p className="font-medium">Bryan Doe</p>
                <p className="text-sm text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UserListTable></UserListTable>
    </>
  );
}
