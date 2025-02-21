"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

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

const formSchema = z.object({
  product_name: z.string().min(2),
  category_id: z.string(),
  brand_id: z.string(),
  current_price: z.string(),
  dosage_strength: z.string().optional(),
  dosage_form: z.string().optional(),
  net_content: z.string(),
  unit_id: z.string(),
});

interface Product {
  product_id: number;
  brand_id: number;
  category_id: number;
  product_name: string;
  current_price: number;
  net_content: string;
  unit_id: number;
  dosage_strength?: string;
  dosage_form?: string;
}

interface Unit {
  unit_id: number;
  unit: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface EditProductFormProps {
  product_id: number;
  onSuccess: (data: AxiosResponse) => void;
}

export default function EditProductForm({
  product_id,
  onSuccess,
}: EditProductFormProps) {
  const [measureOpen, setMeasureOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  
  const [productData, setProductData] = useState<Product | null>(null);
  const [drugData, setDrugData] = useState<Drug | null>(null);
  const [brandData, setBrandData] = useState<Brand | null>(null);
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [unitMeasureData, setUnitMeasureData] = useState<Unit | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_name: "",
      category_id: "",
      current_price: "",
      dosage_strength: "",
      dosage_form: "",
      net_content: "",
      unit_id: "",
    },
    mode: "onChange",
  });

    //Fetch product details
    useEffect(() => {
      const fetchProductData = async () => {
        try {
          const productResponse = await axios.get(
            `http://127.0.0.1:8000/pharmacy/products/${product_id}/`
          );
    
          console.log("Raw API Response:", productResponse.data);
    
          // Ensure productData is an object, not an array
          const product = Array.isArray(productResponse.data)
            ? productResponse.data[0] // If it's an array, get the first item
            : productResponse.data; // Otherwise, use it directly
    
          if (product) {
            setProductData(product);
            // console.log("Product data set successfully:", product);
          } else {
            console.warn("API returned no product data.");
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      };
    
      if (product_id) {
        console.log(`Fetching product data for product_id: ${product_id}`);
        fetchProductData(); // ✅ Call the function!
      }
    }, [product_id]);
    
    // Reset form with product details
    useEffect(() => {
      if (productData) {
        form.reset({
          product_name: productData.product_name || "",
          category_id: String(productData.category_id) || "",
          current_price: String(productData.current_price) || "",
          net_content: productData.net_content || "",
          brand_id: String(productData.brand_id) || "",
          unit_id: String(productData.unit_id) || "",
          dosage_form: productData.dosage_form || "",
          dosage_strength: productData.dosage_strength || "",
        });
    
        console.log("Form reset with product data:", productData);
      } 
    }, [productData]);
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

  //For the combobox
  //Fetch Category for combobox

  const [cats, setCat] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const measurementRes = await fetch(
          "http://127.0.0.1:8000/pharmacy/product-categories/"
        );
        const catData: Category[] = await measurementRes.json();

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.put(`http://127.0.0.1:8000/pharmacy/products/${product_id}/`, values
      );
      onSuccess(response);
      console.log(response.data);
    } catch (error) {
      console.log("❌ Error adding new product:", error);
  
      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", error.response?.data);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
                      {
                        cats.find((cat) => cat.category_id == field.value)
                          ?.category_name
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
                        {cats.map((cat) => (
                          <CommandItem
                            key={cat.category_id}
                            value={cat.category_name}
                            onSelect={() => {
                              field.onChange(cat.category_id.toString());
                              setCatOpen(false);
                              console.log(
                                "🔄 Updated Form Value:",
                                form.getValues("measurement")
                              );
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
          control={form.control}
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
                      {
                        brands.find((brand) => brand.brand_id == field.value)
                          ?.brand_name
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
                        {brands.map((brand) => (
                          <CommandItem
                            key={brand.brand_id}
                            value={brand.brand_name}
                            onSelect={() => {
                              field.onChange(brand.brand_id.toString());
                              setBrandOpen(false);
                              console.log(
                                "🔄 Updated Form Value:",
                                form.getValues("measurement")
                              );
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
  );
}
