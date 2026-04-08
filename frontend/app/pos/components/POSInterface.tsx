"use client";

import { API_URL } from "@/app/lib/api-config";

import { Session } from "@/app/lib/types/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  FileText,
  Minus,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DSWDForm } from "../components/DSWDForm";
import { PrescriptionForm } from "../components/PrescriptionForm";
import { SyncStatus } from "./SyncStatus";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Badge as UIBadge 
} from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Location {
  location_id: number;
  name: string;
}

const CATEGORIES = ["All", "Medicine", "Supplies", "Vitamins", "Others"];

interface Products {
  product_id: number;
  full_product_name: string;
  current_price: number;
  Stock_Item: {
    location_id: number;
    quantity: number;
  }[];
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
  const [branches, setBranches] = useState<Location[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(
    undefined
  );
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (session?.user?.location_id) {
      const locationId = session?.user?.location_id.toString();
      const defaultBranch = locationId === "8" ? "1" : locationId;
      setSelectedBranch(defaultBranch);
    }
  }, [session]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch(`${API_URL}/location/`);
        const data: Location[] = await response.json();
        setBranches(data);
        
        // Auto-select user's branch if not set
        if (session?.user?.location_id && !selectedBranch) {
          const userLoc = session.user.location_id.toString();
          setSelectedBranch(userLoc);
        }
      } catch (error) {
        console.error("❌ Error fetching locations:", error);
      }
    }
    fetchLocations();
  }, [session, selectedBranch]);

  useEffect(() => {
    async function fetchSupplierItems() {
      try {
        const locationIdRaw = selectedBranch || session?.user?.location_id;
        if (!locationIdRaw) return;

        const locationId = Number(locationIdRaw);
        // If location is Asuncion (id:1) or Main (id:8), check both stock locations
        const branchesToCheck = locationId === 1 || locationId === 8 ? [1, 8] : [locationId];

        const response = await fetch(`${API_URL}/products/`);
        const data: Products[] = await response.json();

        const filtered = data.filter((product) => {
          return product.Stock_Item?.some(
            (loc) =>
              branchesToCheck.includes(loc.location_id) &&
              loc.quantity > 0
          );
        });

        setProducts(filtered);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      }
    }

    if (selectedBranch) {
      fetchSupplierItems();
    }
  }, [session, selectedBranch]);

  // Customer information for DSWD clients
  const [customerInfo, setCustomerInfo] = useState({
    patient_name: "",
    client_name: "",
    guaranteeLetterNo: "",
    guaranteeLetterDate: "",
    receivedDate: "",
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
    const locationId = Number(selectedBranch);
    const stockQuantity = product.Stock_Item?.find(si => si.location_id === locationId)?.quantity || 0;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product_id === product.product_id
      );

      if (existingItem) {
        if (existingItem.quantity >= stockQuantity) {
          toast.error(`Only ${stockQuantity} units available in stock`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (stockQuantity <= 0) {
          toast.error("Item out of stock");
          return prevCart;
        }
        return [...prevCart, { ...product, price: product.current_price, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    const product = products.find(p => p.product_id === id);
    const locationId = Number(selectedBranch);
    const stockQuantity = product?.Stock_Item?.find(si => si.location_id === locationId)?.quantity || 0;

    if (newQuantity > stockQuantity) {
      toast.error(`Cannot exceed stock limit (${stockQuantity})`);
      return;
    }

    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.product_id !== id);
      } else {
        return prevCart.map((item) =>
          item.product_id === id ? { ...item, quantity: newQuantity } : item
        );
      }
    });
  };

  // Remove item from cart
  const removeItem = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== id));
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

  // Filter products based on search term and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.full_product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || true; // In the future, match product.category
    return matchesSearch && matchesCategory;
  });

  // Barcode Scanner Event Listener (Physical Scanner)
  useEffect(() => {
    let barcodeString = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside an actual input field (so we don't duplicate search)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentTime = Date.now();
      // Physical barcode scanners "type" very fast (usually < 30ms per char)
      // If delay is > 50ms, it's just human typing, so reset the buffer
      if (currentTime - lastKeyTime > 50) {
        barcodeString = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter" && barcodeString.length > 0) {
        // Find matching product by ID or name (simulating barcode lookup)
        const scannedProd = products.find(
          (p) =>
            p.product_id.toString() === barcodeString ||
            p.full_product_name.toLowerCase() === barcodeString.toLowerCase()
        );

        if (scannedProd) {
          addToCart(scannedProd);
          // Play a small beep (optional)
          // new Audio('/beep.mp3').play().catch(()=>null);
        }
        barcodeString = "";
      } else if (e.key.length === 1) {
        barcodeString += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products]);

  const router = useRouter();

  // Handle checkout
  const handleCheckout = () => {
    // Create order data
    const orderData = {
      user_id: session?.user?.user_id,
      branch: selectedBranch,
      customerInfo,
      customerType,
      discount,
      discountInfo,
      items: cart,
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
            <div className="flex flex-col gap-3 mt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products (or use scanner)..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    className="rounded-full px-4 h-8 text-xs whitespace-nowrap"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
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
                        ₱{product.current_price.toFixed(2)}
                        <span className="text-[10px] text-muted-foreground ml-2">
                          ({product.Stock_Item?.find(si => si.location_id === Number(selectedBranch))?.quantity || 0} in stock)
                        </span>
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
              <div className="flex space-x-2 items-center">
                <Link href="/pos/analytics">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5">
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </Link>
                <SyncStatus />
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.location_id} value={branch.location_id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <Search className="h-12 w-12 opacity-10 mb-4" />
                <p>No items in cart</p>
                <p className="text-xs">Search or scan items to begin</p>
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {item.full_product_name} from the cart?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => removeItem(item.product_id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
