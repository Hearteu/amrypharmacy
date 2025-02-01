"use client"; // Ensure this is at the top to use hooks

import UserListTable from "@/components/table/UserListTable";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import RegisterForm from "@/components/RegisterForm";
import { useState } from "react";

export default function UserList() {
  const [open, setOpen] = useState(false);

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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add User</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                </DialogHeader>
                <RegisterForm onClose={() => setOpen(false)}></RegisterForm>
              </DialogContent>
            </Dialog>
            <div className="flex items-center">
              <div className="ml-3">
                <p className="font-medium">Bryan Doe</p>
                <p className="text-sm text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <UserListTable />

    </>
  );
}
