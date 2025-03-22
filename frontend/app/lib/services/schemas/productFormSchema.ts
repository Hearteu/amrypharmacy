import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ProductDetails } from "../../types/inventory/product-details";

export const ProductFormSchema = z.object({
    product_name: z
        .string()
        .min(2, { message: "Product name must be at least 2 characters long." }),
    category_id: z.string().nonempty({ message: "Category is required." }),
    brand_id: z.string().nonempty({ message: "Brand is required." }),
    current_price: z.string().nonempty({ message: "Current price is required." }),
    dosage_strength: z.string().optional(),
    dosage_form: z.string().optional(),
    net_content: z.string().nonempty({ message: "Net content is required." }),
    unit_id: z.string().nonempty({ message: "Unit is required." }),
});

export const useProductForm = (productData: ProductDetails | null) => {
    const form = useForm<z.infer<typeof ProductFormSchema>>({
        resolver: zodResolver(ProductFormSchema),
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

    const resetForm = () => {
        if (productData === null) return
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
    }

    return { form, resetForm }
}