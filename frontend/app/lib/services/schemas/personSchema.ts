import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Users } from "../../types/persons";

export const UserFormSchema = z.object({
    first_name: z
        .string()
        .min(2, { message: "First name must be at least 2 characters." }),
    last_name: z
        .string()
        .min(2, { message: "Last name must be at least 2 characters." }),
    address: z
        .string()
        .min(5, { message: "Address must be at least 5 characters." }),
    contact: z
        .string()
        .regex(/^\d{10}$/, { message: "Contact must be a valid 10-digit number." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().optional(),
    role_id: z.string().nonempty("Role is required."),
    location_id: z.string().nonempty("Location is required."),
});

export const useUserForm = (userData: Users | null) => {
    const form = useForm<z.infer<typeof UserFormSchema>>({
        resolver: zodResolver(UserFormSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            address: "",
            contact: "",
            email: "",
            password: "",
            role_id: "",
            location_id: "",
        },
        mode: "onChange",
    });

    const resetForm = () => {
        console.log("🔁 resetting with:", userData);

        if (userData === null) return;

        form.reset({
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            address: userData.address || "",
            contact: String(userData.contact) || "",
            email: userData.email || "",
            role_id: String(userData.role_id) || "",
            location_id: String(userData.location_id) || "",
        });
    };

    return { form, resetForm };
};