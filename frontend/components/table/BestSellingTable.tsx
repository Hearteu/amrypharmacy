"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";

// Define the Person type
interface Person {
  person_id: number;
  name: string;
  address: string;
  contact: string;
  email: string;
}

export default function BestSellingTable() {
  const [persons, setPersons] = useState<Person[]>([]); // Use the Person[] type

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/pharmacy/persons/");
        const data: Person[] = await res.json(); // Explicitly cast the fetched data to Person[]
        setPersons(data);
      } catch (error) {
        console.error("Error fetching persons:", error);
      }
    };

    fetchPersons();
  }, []);

  return (
    <>
      <Card className="my-2">
        <CardHeader>
          <CardTitle>Top 5 Best Selling Items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row items-center">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {persons.length > 0 ? (
                persons.map((person, index) => (
                  <TableRow key={person.person_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.address}</TableCell>
                    <TableCell>{person.contact}</TableCell>
                    <TableCell>{person.email}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
