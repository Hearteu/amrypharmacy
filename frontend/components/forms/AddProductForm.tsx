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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosResponse } from "axios";
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

const medFormSchema = z.object({
  product_name: z.string().min(2),
  category_id: z.string(),
  brand_id: z.string(),
  current_price: z.string(),
  dosage_strength: z.string(),
  dosage_form: z.string(),
  net_content: z.string(),
  unit_id: z.string(),
});

const nonMedFormSchema = z.object({
  product_name: z.string().min(2),
  category_id: z.string(),
  brand_id: z.string(),
  current_price: z.string(),
  net_content: z.string(),
  unit_id: z.string(),
});

interface Unit {
  unit_id: number;
  unit: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Categeory {
  category_id: number;
  category_name: string;
}

interface AddFormProps {
  onSuccess: (data: AxiosResponse) => void;
}

export default function AddProductForm({ onSuccess }: AddFormProps) {
  const [measureOpen, setMeasureOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const medicineForm = useForm<z.infer<typeof medFormSchema>>({
    resolver: zodResolver(medFormSchema),
    defaultValues: {
      product_name: "",
      category_id: "",
      current_price: "",
      dosage_strength: "",
      dosage_form: "",
      net_content: "",
      unit_id: "",
    },
  });

  const nonMedForm = useForm<z.infer<typeof nonMedFormSchema>>({
    resolver: zodResolver(nonMedFormSchema),
    defaultValues: {
      product_name: "",
      category_id: "",
      brand_id: "",
      current_price: "",
      net_content: "",
      unit_id: "",
    },
  });

  //Fetch  Brand for combobox

  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const brandRes = await fetch("http://127.0.0.1:8000/pharmacy/brands/");
        const brandData: Brand[] = await brandRes.json();

        setBrands(brandData);
      } catch (error) {
        console.error("Error fetching brand data", error);
      }
    };
    fetchBrand();
  }, []);

  //Fetch Category for combobox

  const [cats, setCat] = useState<Categeory[]>([]);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const measurementRes = await fetch(
          "http://127.0.0.1:8000/pharmacy/product-categories/"
        );
        const catData: Categeory[] = await measurementRes.json();

        setCat(catData);
      } catch (error) {
        console.error("Error fetching measurement data:", error);
      }
    };
    fetchCategory();
  }, []);

  //Fetch Unit of Measurement combobox

  const [unit, setUnit] = useState<Unit[]>([]);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const unitRes = await fetch("http://127.0.0.1:8000/pharmacy/unit/");
        const unitData: Unit[] = await unitRes.json();

        setUnit(unitData);
      } catch (error) {
        console.error("Error fetching measurement data:", error);
      }
    };
    fetchUnit();
  }, []);

  const onSubmit = async (values: z.infer<typeof medFormSchema>) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/pharmacy/products/",
        values
      );
      onSuccess(response.data);
      setDialogOpen(false);
      console.log(response.data);
    } catch (error) {
      console.log("Error adding new product:", error);

      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", error.response);
      }
    }
  };

  const onNonMedSubmit = async (values: z.infer<typeof nonMedFormSchema>) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/pharmacy/products/",

        values
      );
      onSuccess(response.data);
      setDialogOpen(false);
      console.log(response.data);
    } catch (error) {
      console.log("Error adding new product:", error);

      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", Response);
      }
    }
  };

  return (
    <Tabs defaultValue="medicine" className="w-[400px]">
      <TabsList className="">
        <TabsTrigger value="medicine">Medicine</TabsTrigger>
        <TabsTrigger value="non-medicine">Non-Medicine</TabsTrigger>
      </TabsList>
      <TabsContent value="medicine">
        <Form {...medicineForm}>
          <form
            onSubmit={medicineForm.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={medicineForm.control}
              name="product_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={medicineForm.control}
              name="category_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                  <Popover open={catOpen} onOpenChange={setCatOpen}>
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
                          {cats.find((cat) => cat.category_id == field.value)
                            ?.category_name || "Select Category"}
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
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup>
                            {cats.map((cat) => (
                              <CommandItem
                                key={cat.category_id}
                                value={cat.category_name}
                                onSelect={() => {
                                  field.onChange(cat.category_id.toString());
                                  setCatOpen(false);
                                }}
                              >
                                {cat.category_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    cat.category_name === field.value
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
              control={medicineForm.control}
              name="brand_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="">Brand Name</FormLabel>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
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
                          {brands.find((brand) => brand.brand_id == field.value)
                            ?.brand_name || "Select brand"}
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
                            {brands.map((brand) => (
                              <CommandItem
                                key={brand.brand_id}
                                value={brand.brand_name}
                                onSelect={() => {
                                  field.onChange(brand.brand_id.toString());
                                  setBrandOpen(false);
                                }}
                              >
                                {brand.brand_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    brand.brand_id.toString() === field.value
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
              control={medicineForm.control}
              name="current_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={medicineForm.control}
              name="dosage_strength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage Strength</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter dosage strength" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={medicineForm.control}
              name="dosage_form"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage Form</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter dosage form" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={medicineForm.control}
              name="net_content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Net Content</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Net Content" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={medicineForm.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="">Unit Name</FormLabel>
                  <Popover open={measureOpen} onOpenChange={setMeasureOpen}>
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
                          {unit.find((units) => units.unit_id == field.value)
                            ?.unit || "Select Unit"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search brand..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No brand found.</CommandEmpty>
                          <CommandGroup>
                            {unit.map((units) => (
                              <CommandItem
                                key={units.unit}
                                value={units.unit}
                                onSelect={() => {
                                  field.onChange(units.unit_id.toString());
                                  setBrandOpen(false);
                                  console.log(units.unit_id);
                                }}
                              >
                                {units.unit}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    units.unit_id.toString() === field.value
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

            <div className="flex justify-end">
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="non-medicine">
        <Form {...nonMedForm}>
          <form
            onSubmit={nonMedForm.handleSubmit(onNonMedSubmit)}
            className="space-y-4"
          >
            <FormField
              control={nonMedForm.control}
              name="product_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={nonMedForm.control}
              name="category_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                  <Popover open={catOpen} onOpenChange={setCatOpen}>
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
                          {cats.find((cat) => cat.category_id == field.value)
                            ?.category_name || "Select Category"}
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
                            {cats.map((cat) => (
                              <CommandItem
                                key={cat.category_id}
                                value={cat.category_name}
                                onSelect={() => {
                                  field.onChange(cat.category_id.toString());
                                  setCatOpen(false);
                                }}
                              >
                                {cat.category_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    cat.category_name === field.value
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
              control={nonMedForm.control}
              name="brand_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="">Brand Name</FormLabel>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
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
                          {brands.find((brand) => brand.brand_id == field.value)
                            ?.brand_name || "Select Brand"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search brand..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No brand found.</CommandEmpty>
                          <CommandGroup>
                            {brands.map((brand) => (
                              <CommandItem
                                key={brand.brand_id}
                                value={brand.brand_name}
                                onSelect={() => {
                                  field.onChange(brand.brand_id.toString());
                                  setBrandOpen(false);
                                }}
                              >
                                {brand.brand_name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    brand.brand_id.toString() === field.value
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
              control={nonMedForm.control}
              name="current_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={nonMedForm.control}
              name="net_content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Net Content</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Net Content" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={nonMedForm.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="">Unit Name</FormLabel>
                  <Popover open={measureOpen} onOpenChange={setMeasureOpen}>
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
                          {unit.find((units) => units.unit_id == field.value)
                            ?.unit || "Select Unit"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search brand..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No brand found.</CommandEmpty>
                          <CommandGroup>
                            {unit.map((units) => (
                              <CommandItem
                                key={units.unit}
                                value={units.unit}
                                onSelect={() => {
                                  field.onChange(units.unit_id.toString());
                                  setBrandOpen(false);
                                  console.log(units.unit_id);
                                }}
                              >
                                {units.unit}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    units.unit_id.toString() === field.value
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

            <div className="flex justify-end">
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
