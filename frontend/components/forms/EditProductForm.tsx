"use client";

import { Button } from "@/components/ui/button";
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
  category_id: z.string(),
  brand_id: z.string(),
  current_price: z.string(),
  dosage_strength: z.string(),
  dosage_form: z.string(),
  net_content: z.string(),
  measurement: z.string(),
});

interface Product {
  products_id: number;
  brand_id: number;
  category_id: number;
  product_name: string;
  current_price: number;
  net_content: string;
}

interface Measurement {
  unit_id: number;
  measurement: string;
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
  products_id: number;
}

export default function EditProductForm({products_id} : EditProductFormProps) {
  const [measureOpen, setMeasureOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_name: "",
      category_id: "",
      current_price: "",
      dosage_strength: "",
      dosage_form: "",
      net_content: "",
      measurement: "",
    },
    mode: "onChange",
  });

  //Fetch product details

  const [productData, setProductData] = useState<Product | null>(null);
  const [drugData, setDrugData] = useState<Drug | null>(null);
  const [brandData, setBrandData] = useState<Brand | null>(null);
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [unitMeasureData, setUnitMeasureData] = useState<Measurement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_BASE_URL = "http://127.0.0.1:8000/pharmacy";
  
        console.log("🔍 Fetching product data for products_id:", products_id);
  
        // ✅ Step 1: Fetch Product Data
        const productResponse = await axios.get(`${API_BASE_URL}/products/${products_id}/`);
        console.log("✅ Product Response:", productResponse.data);
  
        const product = Array.isArray(productResponse.data)
          ? productResponse.data[0]
          : productResponse.data;
  
        setProductData(product);
        console.log("📌 Product Data Set:", product);
  
        // ✅ Step 2: Check if it's a medicine by looking in `drugs` table
        const drugResponse = await axios.get(`${API_BASE_URL}/drugs/?products_id=${product.products_id}`);
        console.log("🔍 Drug Response:", drugResponse.data);
  
        const isMedicine = Array.isArray(drugResponse.data) && drugResponse.data.length > 0;
        console.log("🧪 Is Medicine:", isMedicine);
  
        if (isMedicine) {
          const drug = drugResponse.data[0]; // ✅ Get first entry from drugs table
          setDrugData(drug);
          console.log("📌 Drug Data Set:", drug);
  
          // ✅ Step 3: Fetch Unit of Measure (only for medicines)
          if (drug.measurement) {
            console.log("🔍 Fetching Unit of Measure:", drug.measurement);
  
            const measureResponse = await axios.get(`${API_BASE_URL}/unit-measures/${drug.measurement}/`);
            console.log("✅ Unit Measure Response:", measureResponse.data);
  
            if (measureResponse.data) {
              setUnitMeasureData(measureResponse.data);
              console.log("📌 Unit Measure Data Set:", measureResponse.data);
            }
          }
        }
  
        // ✅ Step 4: Fetch Brand Data (if exists)
        if (product.brand_id) {
          console.log("🔍 Fetching Brand Data:", product.brand_id);
  
          const brandResponse = await axios.get(`${API_BASE_URL}/brands/${product.brand_id}/`);
          console.log("✅ Brand Response:", brandResponse.data);
  
          if (brandResponse.data) {
            setBrandData(brandResponse.data);
            console.log("📌 Brand Data Set:", brandResponse.data);
          }
        }
  
        // ✅ Step 5: Fetch Category Data (if exists)
        if (product.category_id) {
          console.log("🔍 Fetching Category Data:", product.category_id);
  
          const categoryResponse = await axios.get(`${API_BASE_URL}/product-categories/${product.category_id}/`);
          console.log("✅ Category Response:", categoryResponse.data);
  
          if (categoryResponse.data) {
            setCategoryData(categoryResponse.data);
            console.log("📌 Category Data Set:", categoryResponse.data);
          }
        }
  
        console.log("🎯 All data fetched successfully!");
  
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        console.log("⚠️ Debugging Info:", { products_id, productData });
      }
    };
  
    if (products_id) {
      fetchData();
    }
  }, [products_id]);
  


  useEffect(() => {
    if (productData) {
      form.reset({
        product_name: productData.product_name || "",
        category_id: String(productData.category_id) || "",
        current_price: String(productData.current_price) || "",
        net_content: productData.net_content || "",
        measurement: unitMeasureData?.measurement || "", // ✅ Use unitMeasureData if available
        dosage_strength: drugData?.dosage_strength || "", // ✅ Use drugData if it's a medicine
        dosage_form: drugData?.dosage_form || "", // ✅ Use drugData if it's a medicine
      });
  
      // console.log("✅ Form Updated with Product Data:", {
      //   product_name: productData.product_name,
      //   category_id: productData.category_id,
      //   current_price: productData.current_price,
      //   net_content: productData.net_content,
      //   measurement: unitMeasureData?.measurement,
      //   dosage_strength: drugData?.dosage_strength,
      //   dosage_form: drugData?.dosage_form,
      // });
    }
  }, [productData, drugData, unitMeasureData]);

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

  const [measurements, setMeasurement] = useState<Measurement[]>([]);

  useEffect(() => {
    const fetchMeasurement = async () => {
      try {
        const measurementRes = await fetch(
          "http://127.0.0.1:8000/pharmacy/unit-measures/"
        );
        const measurementData: Measurement[] = await measurementRes.json();

        setMeasurement(measurementData);
      } catch (error) {
        console.error("Error fetching measurement data:", error);
      }
    };
    fetchMeasurement();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/pharmacy/products/",
        
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

  // const onSubmit = (data: any) => {
  //   console.log("New Product Data:", data);
  //   setOpen(false); // Close dialog after submission
  // };

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
                            brands.find(
                              (brand) => brand.brand_id == field.value
                            )?.brand_name
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
              name="measurement"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Unit of Measurement</FormLabel>
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
                          {
                            measurements.find(
                              (measurement) =>
                                measurement.unit_id == field.value
                            )?.measurement
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
                            {measurements.map((measurement) => (
                              <CommandItem
                                key={measurement.unit_id}
                                value={measurement.measurement}
                                onSelect={() => {
                                  field.onChange(
                                    measurement.unit_id.toString()
                                  );
                                  setMeasureOpen(false);
                                  console.log(
                                    "🔄 Updated Form Value:",
                                    form.getValues("measurement")
                                  );
                                }}
                              >
                                {measurement.measurement}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    measurement.measurement === field.value
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