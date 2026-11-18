import { createFileRoute } from "@tanstack/react-router";
import { ListingScreen } from "@/components/listing-screen";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/devices/$id_/listing")({
  head: () => pageHead("Buat listing", "Tentukan harga berdasarkan kondisi dan riwayat perangkat."),
  component: Listing,
});
function Listing() {
  const { id } = Route.useParams();
  return <ListingScreen id={id} />;
}
