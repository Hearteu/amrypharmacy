import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const InventorySchema = z.object({
    product_id: z.number(),
    location_id: z.string(),
    notes: z.string(),
    quantity: z.string().transform((val) => Number.parseInt(val, 10)),
});

export const useInventoryForm = (defaultValues?: Partial<z.infer<typeof InventorySchema>>) => {
    const InventoryForm = useForm<z.infer<typeof InventorySchema>>({
        resolver: zodResolver(InventorySchema),
        defaultValues: {
            product_id: defaultValues?.product_id ?? 0, // Ensure product_id is set
            location_id: defaultValues?.location_id ?? "",
            notes: "",
            quantity: defaultValues?.quantity ?? 0,
        },
        mode: "onChange",
    });

    return InventoryForm;
};

