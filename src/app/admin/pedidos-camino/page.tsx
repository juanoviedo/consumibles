import { getIncomingOrders } from "@/app/actions/incomingOrder";
import { getProducts } from "@/app/actions/product";
import IncomingOrdersClient from "./IncomingOrdersClient";

export default async function PedidosCaminoPage() {
  const orders = await getIncomingOrders();
  const products = await getProducts();

  return <IncomingOrdersClient orders={orders} products={products} />;
}
