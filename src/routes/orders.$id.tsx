import { createFileRoute } from "@tanstack/react-router";
import { OrderScreen } from "@/components/transaction-screens";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/orders/$id")({
  head: () =>
    pageHead(
      "Detail pesanan",
      "Periksa perangkat, konfirmasi kesesuaian, atau ajukan sengketa pada transaksi demo.",
    ),
  component: OrderDetail,
});
function OrderDetail() {
  const { id } = Route.useParams();
  return <OrderScreen id={id} />;
}
