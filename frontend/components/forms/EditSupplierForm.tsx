"use client";

import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";

interface Suppliers {
  supplier_id: number;
  supplier_name: string;
  contact_person_first_name: string;
  contact_person_last_name: string;
  contact: string;
  email: string;
  address: string;
  vat_num: string;
  status_id: number;
}

interface Status {
  status_id: number;
  status: string;
}

interface EditSupplierFormProps {
  supplier_id: number;
  onSuccess: (data: AxiosResponse) => void;
}

export default function EditUserForm({
  supplier_id,
  onSuccess,
}: EditSupplierFormProps) {
  const [supplierData, setSupplierData] = useState<Suppliers | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_name: "",
      contact_person_first_name: "",
      contact_person_last_name: "",
      contact: "",
      email: "",
      address: "",
      vat_num: "",
      status_id: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        const supplierResponse = await axios.get(
          `http://127.0.0.1:8000/pharmacy/suppliers/${supplier_id}/`
        );

        console.log("Raw API Response:", supplierResponse.data);

        // Ensure productData is an object, not an array
        const supplier = Array.isArray(supplierResponse.data)
          ? supplierResponse.data[0] // If it's an array, get the first item
          : supplierResponse.data; // Otherwise, use it directly

        if (supplier) {
          setSupplierData(supplier);
          // console.log("Product data set successfully:", product);
        } else {
          console.warn("API returned no product data.");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    if (supplier_id) {
      console.log(`Fetching product data for product_id: ${supplier_id}`);
      fetchSupplierData(); // ✅ Call the function!
    }
  }, [supplier_id]);

  useEffect(() => {
    if (supplierData) {
      form.reset({
        supplier_name: supplierData.supplier_name || "",
        contact_person_first_name: supplierData.contact_person_first_name || "",
        contact_person_last_name: supplierData.contact_person_last_name || "",
        contact: supplierData.contact || "",
        email: supplierData.email || "",
        address: supplierData.address || "",
        vat_num: supplierData.vat_num || "",
        status_id: supplierData.status_id || "",
      });

      console.log("Form reset with supplier data:", supplierData);
    }
  }, [supplierData]);

  //Combo box for Status
  const [status, setStatus] = useState<Status[]>({});

  const fetchStatus = async () => {
    try {
        const statusRes = await fetch("http://127.0.0.1:8000/pharmacy/status/");
        const brandData: Brand[] = await brandRes.json();
        setBrands(brandData);
      } catch (error) {
        console.error("Error fetching brand data", error);
      }
  }
  return <></>;
}
