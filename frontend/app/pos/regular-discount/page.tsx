"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slash } from "lucide-react";


const formSchema = z.object({
  patient_name: z.string().min(2, { message: "Patient Name is required." }),
  pwdSenior_id: z.string().min(1, { message: "ID is required." }),
  address: z.string().min(1, { message: "address is required." }),
  prescription_date: z.string().min(1, { message: "Prescription Date is required." }),
  physician_name: z.string().min(1, { message: "Physician Name is required." }),
  physician_prc: z.string().min(1, { message: "Physician PRC is required." }),
  physician_ptr: z.string().min(1, { message: "Physician PTR is required." }),

});

// Sample selected items
const selectedItems = [
  { id: 1, product: "Item 1", quantity: 2, price: 10 },
  { id: 2, product: "Item 2", quantity: 3, price: 15 },
];

const totalAmount = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

export default function DswdPage() {
  const router = useRouter(); // For navigation

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_name: "",
      pwdSenior_id: "",
      address: "",
      prescription_date: "",
      physician_name: "",
      physician_prc: "",
      physician_ptr: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <>
      <div className="p-4 fixed w-full bg-white shadow-md">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="main">Sales Orders</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="regular-discount">PWD/Senior</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Card className="m-6 p-5 shadow-lg border border-gray-300 rounded-lg">
        <CardContent className="space-y-4">
          {/* Back Button */}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push("/pos/main")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex gap-8">
            {/* Left Side - Form */}
            <div className="w-1/2 p-4 border-r border-gray-300">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Customer Details</CardTitle>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="patient_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="pwdSenior_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PWD/Senior ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter PWD/Senior ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="prescription_date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prescription Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />    

                <FormField control={form.control} name="physician_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physician Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter physician name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                <FormField control={form.control} name="physician_prc" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physician PRC</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter physician PRC number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                <FormField control={form.control} name="physician_ptr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physician PTR</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter physician PTR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button 
                  type="submit" 
                  className="w-full"
                  onClick={() => router.push("/pos/main")}
                  >Submit</Button>
                </form>
              </Form>
            </div>

            {/* Right Side - Order Summary */}
            <div className="w-1/2 p-4">
              <Card className="p-4 shadow-md border border-gray-300 rounded-lg">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedItems.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedItems.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.product} x{item.quantity}</span>
                          <span>${item.price * item.quantity}</span>
                        </li>
                      ))}
                      <hr className="my-2 border-gray-300" />
                      <li className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${totalAmount}</span>
                      </li>
                    </ul>
                  ) : (
                    <p className="text-gray-500">No items selected.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
