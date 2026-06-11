import { getClients } from "@/app/actions/billing";
import ClientsClient from "./ClientsClient";

export default async function ClientesPage() {
  const clients = await getClients();

  return <ClientsClient clients={clients} />;
}
