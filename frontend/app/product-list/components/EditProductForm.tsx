"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { z } from "zod";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ProductFormSchema,
  useProductForm,
} from "@/app/lib/services/schemas/productFormSchema";
import { ProductDetails } from "@/app/lib/types/inventory/product-details";
import { ProductFormProps } from "@/app/lib/types/inventory/product-props";
import { Brand } from "@/app/lib/types/inventory/brand";
import { getBrand } from "@/app/lib/services/brand";
import { Category } from "@/app/lib/types/inventory/category";
import { Unit } from "@/app/lib/types/inventory/unit";
import { getCategory } from "@/app/lib/services/category";
import { getUnit } from "@/app/lib/services/units";

export default function EditProductForm({
  product_id,
  onSuccess,
}: ProductFormProps) {
  const [productData, setProductData] = useState<ProductDetails | null>(null);
  const { form, resetForm } = useProductForm(productData);

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

  useEffect(() => {
    resetForm();
  }, [productData]);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandOpen, setBrandOpen] = useState(false);
  const [inputBrand, setInputBrand] = useState("");
  const [cats, setCat] = useState<Category[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [inputCat, setInputCat] = useState("");
  const [unit, setUnit] = useState<Unit[]>([]);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [inputUnit, setInputUnit] = useState("");

  const refreshData = async () => {
    try {
      const brandData = await getBrand();
      setBrands(brandData);
      const catData = await getCategory();
      setCat(catData);
      const unitData = await getUnit();
      setUnit(unitData);
    } catch (error) {
      console.error("Error fetching data", error);
      setBrands([]);
      setCat([]);
      setUnit([]);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addNewBrand = async (brandName: string) => {
    const trimmedBrandName = brandName.trim();
    if (
      trimmedBrandName === "" ||
      brands.some(
        (brand) =>
          brand.brand_name.toLowerCase() === trimmedBrandName.toLowerCase()
      )
    ) {
      return;
    }
    {
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/pharmacy/brands/",
          {
            brand_name: trimmedBrandName,
          }
        );

        if (response.status === 201) {
          setInputBrand(brandName);
          await refreshData();
        }
      } catch (error) {
        console.error("❌ Error adding brand:", error);
      }
    }
  };

  const addNewCat = async (catName: string) => {
    const trimmedCatName = catName.trim();

    if (
      trimmedCatName === "" ||
      cats.some(
        (category) =>
          category.category_name.toLowerCase() === trimmedCatName.toLowerCase()
      )
    ) {
      return;
    }
    {
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/pharmacy/product-categories/",
          {
            category_name: trimmedCatName,
          }
        );

        if (response.status === 201) {
          setInputCat(catName);
          await refreshData();
        }
      } catch (error) {
        console.error("❌ Error adding category:", error);
      }
    }
  };

  const addNewUnit = async (unitName: string) => {
    const trimmedUnitName = unitName.trim();

    if (
      trimmedUnitName === "" ||
      unit.some(
        (uni) => uni.unit.toLowerCase() === trimmedUnitName.toLowerCase()
      )
    ) {
      return;
    }
    {
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/pharmacy/unit/",
          {
            unit: trimmedUnitName,
          }
        );

        if (response.status === 201) {
          setInputUnit(unitName);
          await refreshData();
        }
      } catch (error) {
        console.error("❌ Error adding unit:", error);
      }
    }
  };

  const handleBrandKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && inputBrand) {
      e.preventDefault();
      addNewBrand(inputBrand);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && inputCat) {
      e.preventDefault();
      addNewCat(inputCat);
    }
  };

  const handleUnitKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && inputUnit) {
      e.preventDefault();
      addNewUnit(inputUnit);
    }
  };

  const onSubmit = async (values: z.infer<typeof ProductFormSchema>) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/products/${product_id}/`,
        values
      );
      onSuccess();
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
                        cats.find(
                          (cat) => cat.category_id.toString() == field.value
                        )?.category_name
                      }
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search category..."
                      className="h-9"
                      value={inputCat}
                      onValueChange={setInputCat}
                      onKeyDown={handleCategoryKeyDown}
                    />
                    <CommandList>
                      <CommandEmpty>
                        Press ENTER to Add New Category
                      </CommandEmpty>
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
          control={form.control}
          name="brand_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="">Brand Name</FormLabel>
              <FormMessage />
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
                          (brand) => brand.brand_id.toString() == field.value
                        )?.brand_name
                      }
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search brand..."
                      className="h-9"
                      value={inputBrand}
                      onValueChange={setInputBrand}
                      onKeyDown={handleBrandKeyDown}
                    />
                    <CommandList className="max-h-60 overflow-y-auto">
                      <CommandEmpty>Press ENTER to add New Brand</CommandEmpty>
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
                      {unit.find(
                        (units) => units.unit_id.toString() == field.value
                      )?.unit || "Select Unit"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search unit..."
                      className="h-9"
                      value={inputUnit}
                      onValueChange={setInputUnit}
                      onKeyDown={handleUnitKeyDown}
                    />
                    <CommandList>
                      <CommandEmpty>Press ENTER to Add New Unit</CommandEmpty>
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
