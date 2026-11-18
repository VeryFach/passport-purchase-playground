import { createFileRoute } from "@tanstack/react-router";
import { OrdersScreen } from "@/components/transaction-screens";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/orders/")({
  head: () =>
    pageHead("Pesanan Saya", "Pantau pesanan, masa tinjau, dan transfer paspor perangkat."),
  component: OrdersScreen,
});
