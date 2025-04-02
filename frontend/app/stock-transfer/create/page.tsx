import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { StockTransferForm } from "../components/StockTransferForm"

export default function CreateStockTransferPage() {
  return (
    <div className="container mx-auto py-6 space-y-6 px-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/stock-transfer">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Stock Transfer</h1>
      </div>
        <StockTransferForm/>
    </div>

  )
}

