"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Slash } from "lucide-react";

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

const formSchema = z.object({
  patient_name: z.string().min(2, { message: "Patient Name is required." }),
  gl_no: z.string().min(1, { message: "GL No. is required." }),
  gl_date: z.string().min(1, { message: "GL Date is required." }),
  claim_date: z.string().min(1, { message: "Claim Date is required." }),
  prescription_date: z.string().min(1, { message: "Prescription Date is required." }),
});

const selectedItems = [
  { id: 1, product: "Item 1", quantity: 2, price: 10 },
  { id: 2, product: "Item 2", quantity: 3, price: 15 },
];

const totalAmount = selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

export default function DswdPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_name: "",
      gl_no: "",
      gl_date: "",
      claim_date: "",
      prescription_date: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="p-4 fixed w-full bg-white shadow-md z-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="main">Sales Orders</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="regular-discount">DSWD</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row min-h-screen pt-16 gap-4 p-4">
        {/* Left Side - Form */}
 
        <div className="md:w-2/3 w-full bg-white shadow-md p-4 rounded-lg">
        <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push("/pos/main")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardHeader>
            <CardTitle className="text-lg font-bold">DSWD Details</CardTitle>
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

              <FormField control={form.control} name="gl_no" render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantee Letter No.</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter GL No." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="gl_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Guarantee Letter Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="claim_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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

              <Button type="submit" className="w-full" onClick={() => router.push("/pos/main")}>
                Submit
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Side - Order Summary */}
        <div className="md:w-1/3 w-full bg-gray-100 shadow-md p-4 rounded-lg">
          <Card className="p-4 shadow-md border border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product} x{item.quantity}</span>
                  <span>${item.price * item.quantity}</span>
                </div>
              ))}
              <hr className="my-2 border-gray-300" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${totalAmount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}