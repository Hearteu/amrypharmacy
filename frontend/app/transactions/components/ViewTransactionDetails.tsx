import { Transaction } from "@/app/lib/types/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface ViewTransactionDetailsProps {
  transaction: Transaction;
}

export default function ViewTransactionDetails({
  transaction,
}: ViewTransactionDetailsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4" />
          <span className="sr-only">View Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Invoice: {transaction?.pos?.invoice ?? "N/A"}
          </DialogDescription>
        </DialogHeader>

        {transaction ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.pos?.sale_date || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-sm text-muted-foreground">
                  ₱{transaction.pos?.total_amount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Items</p>
              <div className="border rounded-md p-2">
                {(transaction.pos?.pos_items || []).length > 0 ? (
                  (transaction.pos?.pos_items || []).map((item) => (
                    <p
                      key={item.pos_item_id}
                      className="text-sm text-muted-foreground"
                    >
                      {item.full_product_name} - {item.quantity} x ₱
                      {item.price.toFixed(2)} = ₱{item.total_price.toFixed(2)}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No items in this transaction.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Prescription Details</p>
                <div className="border rounded-md p-2">
                  {transaction.prescription ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Date Issued:</span>{" "}
                        {transaction.prescription.date_issued || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Physician:</span>{" "}
                        {transaction.prescription.physician?.name || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">PRC #:</span>{" "}
                        {transaction.prescription.physician?.prc_num || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">PTR #:</span>{" "}
                        {transaction.prescription.physician?.ptr_num || "N/A"}
                      </p>
                      {transaction.prescription.prescription_details && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Details:</span>{" "}
                          {transaction.prescription.prescription_details}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No prescription for this transaction.
                    </p>
                  )}
                </div>
              </div>
              {transaction.dswd_details && transaction.customer?.name ? (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">DSWD Details</p>
                  <div className="border rounded-md p-2">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">GL Number:</span>{" "}
                        {transaction.dswd_details.gl_num || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">GL Date:</span>{" "}
                        {transaction.dswd_details.gl_date || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Claim Date:</span>{" "}
                        {transaction.dswd_details?.claim_date || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Patient Name:</span>{" "}
                        {transaction.customer?.name || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Client Name:</span>{" "}
                        {transaction.dswd_details?.client_name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div></div>
              )}

              {/* pwd or senior citize */}
              {transaction.customer && transaction.pos ? (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Customer Details</p>
                  <div className="border rounded-md p-2">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Customer Type:</span>{" "}
                        {transaction.pos.order_type || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Customer Name:</span>{" "}
                        {transaction.customer?.name || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">ID Number:</span>{" "}
                        {transaction.customer?.id_card_number || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        ) : (
          <p>No transaction data found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
