"use client"

import type React from "react"
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface DSWDFormProps {
  customerInfo: {
    name: string
    guaranteeLetterNo: string
    guaranteeLetterDate: string
    address: string
    contactNumber: string
  }
  setCustomerInfo: React.Dispatch<
    React.SetStateAction<{
      name: string
      guaranteeLetterNo: string
      guaranteeLetterDate: string
      address: string
      contactNumber: string
    }>
  >
}

export function DSWDForm({ customerInfo, setCustomerInfo }: DSWDFormProps) {
      const [date, setDate] = useState<Date | undefined>(
        customerInfo.guaranteeLetterDate ? new Date(customerInfo.guaranteeLetterDate) : undefined,
      )
    
      const handleDateChange = (selectedDate: Date | undefined) => {
        setDate(selectedDate)
        if (selectedDate) {
            setCustomerInfo({
            ...customerInfo,
            guaranteeLetterDate: selectedDate.toISOString().split("T")[0],
          })
        }
      }
  return (
    <>
      <SheetHeader>
        <SheetTitle>DSWD Client Information</SheetTitle>
        <SheetDescription>Enter client details for DSWD free medication</SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Patient Name</Label>
          <Input
            id="name"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            placeholder="Juan Dela Cruz"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="guarantee-letter">Guarantee Letter No.</Label>
          <Input
            id="guarantee-letter"
            value={customerInfo.guaranteeLetterNo}
            onChange={(e) => setCustomerInfo({ ...customerInfo, guaranteeLetterNo: e.target.value })}
            placeholder="GL-12345-2023"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rx-date">Prescription Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="rx-date"
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={customerInfo.address}
            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
            placeholder="Complete address"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact">Contact Number</Label>
          <Input
            id="contact"
            value={customerInfo.contactNumber}
            onChange={(e) => setCustomerInfo({ ...customerInfo, contactNumber: e.target.value })}
            placeholder="09XX-XXX-XXXX"
          />
        </div>
      </div>
    </>
  )
}

