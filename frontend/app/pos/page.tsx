import PosInterface from "./components/POSInterface";

export default function Pharmacy() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pharmacy POS System</h1>
        <p className="text-muted-foreground">
          Manage transactions and View history transaction
        </p>
      </div>
      <PosInterface />
    </div>
  );
}
