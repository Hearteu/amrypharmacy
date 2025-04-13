"use client"; // Ensure this is at the top to use hooks

import { useState, useEffect } from "react";
import { DataTable } from "../../components/data-table/DataTable";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import RegisterForm from "@/components/forms/RegisterForm";
import { PlusCircle } from "lucide-react";
import { DataTableLoading } from "@/components/data-table/DataTableLoading";
import { columns } from "./components/Columns";
import { Users } from "../lib/types/persons";
import { getUsersData } from "../lib/services/Persons";

export default function UserList() {
  const [data, setData] = useState<Users[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  const refreshData = async () => {
    console.log("Refreshing data...");
    setLoading(true);
    try {
      const userData = await getUsersData();
      setData(userData);
      console.log(userData);
    } catch {
      console.error("Error fetching data", error);
      setError("Failed to load products");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const tableColumns = columns(refreshData);

  useEffect(() => {
    refreshData();
  }, []);

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="p-4">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User List</h1>
              <p className="text-muted-foreground">
                Manage users, assign roles, edit details, and remove accounts.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                </DialogHeader>
                <RegisterForm
                  onSuccess={(data) => {
                    console.log("From the columns component", data);
                    setOpen(false);
                    refreshData();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          {loading ? (
            <DataTableLoading columnCount={tableColumns.length} rowCount={10} />
          ) : (
            <>
              <DataTable
                columns={tableColumns}
                data={data}
                search="full_name"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
