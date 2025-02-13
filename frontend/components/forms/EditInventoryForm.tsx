"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const formSchema = z.object({
  product_name: z.string().min(2),
  stockroom_inventory: z.string(),
  display_inventory: z.string(),
  branch: z.string(),

});


//for combobox
interface Branch {
  branch_id: number;
  branch_name: string;
}


export default function EditInventoryForm() {
  //for combobox
  const [branchOpen, setBranchOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_name: "",
      stockroom_inventory: "",
      display_inventory: "",
      branch: "",
    },
  });
  const { setValue } = form;

  //Fetch  Brand for combobox
  const [branc, setBranc] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const branchRes = await fetch("http://127.0.0.1:8000/pharmacy/branches/");
        const branchData: Branch[] = await branchRes.json();

        setBranc(branchData);
      } catch (error) {
        console.error("Error fetching brand data", error);
      }
    };
    fetchBranch();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/pharmacy/inventories/",
        
          values
        
      );
      // onSuccess(response.data);
      console.log(response.data);
    } catch (error) {
      console.log("Error adding new product:", error);
      
      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", error.response?.data);
      }
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Inventory</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Inventory</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stockroom_inventory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stockroom Inventory</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter stockroom inventory" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_inventory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Inventory</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter display inventory" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Branch</FormLabel>
                  <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative w-full">
                        <Input
                          value={field.value}
                          onChange={(e) => setValue("branch", e.target.value)}
                          placeholder="Type or select a branch"
                          className="w-full"
                        />
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "absolute right-0 top-0 h-full px-2",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search branch..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No branches found.</CommandEmpty>
                          <CommandGroup>
                            {branc.map((branch) => (
                              <CommandItem
                                key={branch.branch_id}
                                value={branch.branch_name}
                                onSelect={() => {
                                  field.onChange(branch.branch_id.toString());
                                  setBranchOpen(false);
                                }}
                              >
                                {branch.branch_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    branch.branch_id.toString() === field.value
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
            />            <div className="flex justify-end">
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
