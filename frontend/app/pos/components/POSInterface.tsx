"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  FileText,
  User,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PrescriptionForm } from "../components/PrescriptionForm";
import { DSWDForm } from "../components/DSWDForm";
import { getSession } from "next-auth/react";
import { Session } from "@/app/lib/types/session";

const branches = [
  { id: 1, name: "Asuncion" },
  { id: 2, name: "Talaingod" },
];

interface Products {
  product_id: number;
  full_product_name: string;
  price: number;
}
export default function PosInterface() {
  const [session, updateSession] = useState<Session>();
  const fetchSession = async () => {
    const _session = await getSession();
    if (_session) updateSession(_session);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const [cart, setCart] = useState<
    Array<{
      product_id: number;
      full_product_name: string;
      price: number;
      quantity: number;
    }>
  >([]);

  const [customerType, setCustomerType] = useState("regular");
  const [hasPrescription, setHasPrescription] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Products[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (session?.user?.location_id) {
      const locationId = session?.user?.location_id.toString();
      const defaultBranch = locationId === "8" ? "1" : locationId;
      setSelectedBranch(defaultBranch);
    }
  }, [session]);

  useEffect(() => {
    async function fetchSupplierItems() {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/pharmacy/products/`
        );
        const data: Products[] = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("❌ Error fetching supplier items:", error);
      }
    }

    fetchSupplierItems();
  }, []);

  // Customer information for DSWD clients
  const [customerInfo, setCustomerInfo] = useState({
    patient_name: "",
    client_name: "",
    guaranteeLetterNo: "",
    guaranteeLetterDate: "",
    receivedDate: "",
    invoiceNumber: "",
  });

  // Discount information
  const [discountInfo, setDiscountInfo] = useState({
    name: "",
    address: "",
    type: "", // PWD or Senior
    idNumber: "",
    discountRate: 0.2, // 20% discount
  });

  // Prescription information
  const [prescriptionInfo, setPrescriptionInfo] = useState({
    doctorName: "",
    PRCNumber: "",
    PTRNumber: "",
    prescriptionDate: "",
    notes: "",
  });

  // Add product to cart
  const addToCart = (product: Products) => {
    const existingItem = cart.find(
      (item) => item.product_id === product.product_id
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // Update quantity
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.product_id !== id));
    } else {
      setCart(
        cart.map((item) =>
          item.product_id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // Remove item from cart
  const removeItem = (id: number) => {
    setCart(cart.filter((item) => item.product_id !== id));
  };

  // Calculate subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate discount
  const discount =
    discountInfo.type === "pwd" || discountInfo.type === "senior"
      ? parseFloat((subtotal * discountInfo.discountRate).toFixed(2))
      : 0;

  useEffect(() => {
    if (customerType !== "regular") {
      setDiscountInfo({
        name: "",
        address: "",
        type: "",
        idNumber: "",
        discountRate: 0.2,
      });
    }
  }, [customerType]);

  // Calculate total
  const total = customerType === "dswd" ? 0 : subtotal - discount;

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.full_product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const router = useRouter();

  // Handle checkout
  const handleCheckout = () => {
    // Create order data
    const orderData = {
      user_id: session?.user?.user_id,
      branch: selectedBranch,
      customerInfo, // ✅ Removed duplicate
      customerType,
      discount,
      discountInfo,
      items: cart, // ✅ Changed from `cart` to `items`
      prescriptionInfo,
      subtotal,
      total,
      timestamp: new Date(),
    };

    // Save order to localStorage
    localStorage.setItem("orderSummary", JSON.stringify(orderData));

    // Navigate to order summary page
    router.push("/pos/order-summary");

    // Debugging: Log order details
    console.log({
      branch: selectedBranch,
      customerType,
      customerInfo: customerType === "dswd" ? customerInfo : null,
      discountInfo:
        customerType === "pwd" || customerType === "senior"
          ? discountInfo
          : null,
      prescription: hasPrescription ? prescriptionInfo : null,
      items: cart,
      subtotal,
      discount,
      total,
      timestamp: new Date(),
    });

    // Clear cart and reset form
    setCart([]);
    setCustomerType("regular");
    setHasPrescription(false);
    setCustomerInfo({
      patient_name: "",
      client_name: "",
      guaranteeLetterNo: "",
      guaranteeLetterDate: "",
      receivedDate: "",
      invoiceNumber: "",
    });
    setDiscountInfo({
      name: "",
      address: "",
      type: "",
      idNumber: "",
      discountRate: 0.2,
    });
    setPrescriptionInfo({
      doctorName: "",
      PTRNumber: "",
      PRCNumber: "",
      prescriptionDate: "",
      notes: "",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Column - Product Selection */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle>Products</CardTitle>
            <CardDescription>Search and add products to cart</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.product_id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => addToCart(product)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">
                        {product.full_product_name}
                      </CardTitle>
                      {/* <CardDescription>{product.category}</CardDescription> */}
                    </CardHeader>
                    <CardFooter className="p-4 pt-2 flex justify-between">
                      <span className="font-medium">
                        ₱{product.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Cart and Checkout */}
      <div>
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Current Transaction</CardTitle>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 mt-4">
              <Tabs
                value={customerType}
                onValueChange={setCustomerType}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="regular">Regular</TabsTrigger>
                  <TabsTrigger value="dswd">DSWD</TabsTrigger>
                  <TabsTrigger value="discount">PWD/Senior</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {customerType === "dswd" && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full mt-2">
                    <User className="h-4 w-4 mr-2" />
                    Enter DSWD Client Info
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <DSWDForm
                    customerInfo={customerInfo}
                    setCustomerInfo={setCustomerInfo}
                  />
                </SheetContent>
              </Sheet>
            )}

            {customerType === "discount" && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full mt-2">
                    <User className="h-4 w-4 mr-2" />
                    Enter Discount Info
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Discount Information</SheetTitle>
                    <SheetDescription>
                      Enter PWD or Senior Citizen details
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Patient Name</Label>
                      <Input
                        id="name"
                        value={discountInfo.name}
                        onChange={(e) =>
                          setDiscountInfo({
                            ...discountInfo,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={discountInfo.address}
                        onChange={(e) =>
                          setDiscountInfo({
                            ...discountInfo,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="discount-type">Discount Type</Label>
                      <Select
                        value={discountInfo.type}
                        onValueChange={(value) =>
                          setDiscountInfo({ ...discountInfo, type: value })
                        }
                      >
                        <SelectTrigger id="discount-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pwd">PWD</SelectItem>
                          <SelectItem value="senior">Senior Citizen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="id-number">ID Number</Label>
                      <Input
                        id="id-number"
                        value={discountInfo.idNumber}
                        onChange={(e) =>
                          setDiscountInfo({
                            ...discountInfo,
                            idNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="prescription"
                checked={hasPrescription}
                onCheckedChange={(checked) =>
                  setHasPrescription(checked as boolean)
                }
              />
              <label
                htmlFor="prescription"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Has Prescription
              </label>
            </div>

            {hasPrescription && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full mt-2">
                    <FileText className="h-4 w-4 mr-2" />
                    Enter Prescription Details
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <PrescriptionForm
                    prescriptionInfo={prescriptionInfo}
                    setPrescriptionInfo={setPrescriptionInfo}
                  />
                </SheetContent>
              </Sheet>
            )}
          </CardHeader>

          <CardContent className="flex-grow overflow-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items in cart. Add products to begin.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">
                        {item.full_product_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          <CardFooter className="flex-col border-t pt-4">
            <div className="w-full space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>

              {(customerType === "pwd" || customerType === "senior") && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discountInfo.discountRate * 20}%):</span>
                  <span>-₱{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>
                  {customerType === "dswd" ? "FREE" : `₱${total.toFixed(2)}`}
                </span>
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                disabled={
                  cart.length === 0 ||
                  !selectedBranch ||
                  (customerType === "dswd" && !customerInfo.patient_name)
                }
                onClick={handleCheckout}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {customerType === "dswd"
                  ? "Complete Transaction"
                  : "Proceed to Payment"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
