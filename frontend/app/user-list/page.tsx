"use client";

import { Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { useRouter } from "next/navigation";

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
];

export default function UserList() {
  const router = useRouter(); // Initialize router

  // Navigate to the Create Product page
  const handleAddNewItem = () => {
    router.push("/createProduct");
  };

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Inventory</h1>
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
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Example Rows */}
                {[
                  {
                    genericName: "Paracetamol",
                    brandName: "Biogesic",
                    code: "MED001",
                    dosage: "500mg/tab",
                    price: "₱1.50",
                  },
                  {
                    genericName: "Ibuprofen",
                    brandName: "Medicol",
                    code: "MED002",
                    dosage: "400mg/tab",
                    price: "₱1.50",
                  },
                ].map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.genericName}</TableCell>
                    <TableCell>{item.brandName}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.dosage}</TableCell>
                    <TableCell>{item.price}</TableCell>

                    <TableCell>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[200px] justify-between"
                          >
                            {value
                              ? frameworks.find(
                                  (framework) => framework.value === value
                                )?.label
                              : "Select framework..."}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search framework..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No framework found.</CommandEmpty>
                              <CommandGroup>
                                {frameworks.map((framework) => (
                                  <CommandItem
                                    key={framework.value}
                                    value={framework.value}
                                    onSelect={(currentValue) => {
                                      setValue(
                                        currentValue === value
                                          ? ""
                                          : currentValue
                                      );
                                      setOpen(false);
                                    }}
                                  >
                                    {framework.label}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        value === framework.value
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
