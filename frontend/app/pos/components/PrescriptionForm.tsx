"use client";

import type React from "react";

import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface PrescriptionFormProps {
  prescriptionInfo: {
    doctorName: string;
    PRCNumber: string;
    PTRNumber: string;
    prescriptionDate: string;
    notes: string;
  };
  setPrescriptionInfo: React.Dispatch<
    React.SetStateAction<{
      doctorName: string;
      PRCNumber: string;
      PTRNumber: string;
      prescriptionDate: string;
      notes: string;
    }>
  >;
}

export function PrescriptionForm({
  prescriptionInfo,
  setPrescriptionInfo,
}: PrescriptionFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    prescriptionInfo.prescriptionDate
      ? new Date(prescriptionInfo.prescriptionDate)
      : undefined
  );

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setPrescriptionInfo({
        ...prescriptionInfo,
        prescriptionDate: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Prescription Details</SheetTitle>
        <SheetDescription>Enter prescription information</SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="doctor-name">Doctor&apos;s Name</Label>
          <Input
            id="doctor-name"
            value={prescriptionInfo.doctorName}
            onChange={(e) =>
              setPrescriptionInfo({
                ...prescriptionInfo,
                doctorName: e.target.value,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rx-number">PRC Number</Label>
          <Input
            id="rx-number"
            value={prescriptionInfo.PRCNumber}
            onChange={(e) =>
              setPrescriptionInfo({
                ...prescriptionInfo,
                PRCNumber: e.target.value,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rx-number">PTR Number</Label>
          <Input
            id="rx-number"
            value={prescriptionInfo.PTRNumber}
            onChange={(e) =>
              setPrescriptionInfo({
                ...prescriptionInfo,
                PTRNumber: e.target.value,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rx-date">Prescription Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="rx-date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={prescriptionInfo.notes}
            onChange={(e) =>
              setPrescriptionInfo({
                ...prescriptionInfo,
                notes: e.target.value,
              })
            }
            placeholder="Additional notes or instructions"
          />
        </div>
      </div>
    </>
  );
}
