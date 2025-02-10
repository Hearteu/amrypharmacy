import { Payment, columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ]
}

export default async function ProductList() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-xl font-semibold px-4">Product List</h2>

      <DataTable columns={columns} data={data} />
    </div>
  )
}
