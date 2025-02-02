"use client";
import { useForm } from "react-hook-form"; // Form handling library
import { Button } from "@/components/ui/button"; // Reusable button component
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Card layout
import { Input } from "@/components/ui/input"; // Input field styling
import { Select, SelectItem } from "@/components/ui/select"; // Select dropdown

// Example category and brand data (Replace with API call later)
const categories = ["Medicines-Branded", "Medicines-Generic", "Grocery Supplies", "Medical Supplies"];
const brands = ["Biogesic", "Medicol", "Tempra", "Omron", "Betadine"];
const units = ["Tablet", "Capsule", "Syrup", "Device", "Pack", "Bottle"];

export default function NewProductForm() {
  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Form submission handler
  const onSubmit = (data: any) => {
    console.log("New Product Data:", data);
    alert("Product added successfully!");
    reset(); // Reset form fields after submission
  };

  return (
    <Card className="max-w-lg mx-auto p-6 shadow-lg">
      {/* Form Header */}
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>

      {/* Form Content */}
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block font-medium">Product Name</label>
            <Input type="text" {...register("productName", { required: "Product name is required" })} />
            {errors.productName && <p className="text-red-500 text-sm">{errors.productName.message}</p>}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block font-medium">Category</label>
            <Select {...register("category", { required: "Category is required" })}>
              <SelectItem value="">Select Category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </Select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>

          {/* Brand Dropdown */}
          <div>
            <label className="block font-medium">Brand</label>
            <Select {...register("brand", { required: "Brand is required" })}>
              <SelectItem value="">Select Brand</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </Select>
            {errors.brand && <p className="text-red-500 text-sm">{errors.brand.message}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block font-medium">Price (₱)</label>
            <Input type="number" {...register("price", { required: "Price is required", min: 1 })} />
            {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
          </div>

          {/* Dosage */}
          <div>
            <label className="block font-medium">Dosage</label>
            <Input type="text" {...register("dosage", { required: "Dosage is required" })} />
            {errors.dosage && <p className="text-red-500 text-sm">{errors.dosage.message}</p>}
          </div>

          {/* Unit of Measure Dropdown */}
          <div>
            <label className="block font-medium">Unit of Measure</label>
            <Select {...register("unit", { required: "Unit of measure is required" })}>
              <SelectItem value="">Select Unit</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </Select>
            {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message}</p>}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-blue-500 text-white">Add Product</Button>
        </form>
      </CardContent>
    </Card>
  );
}
