import { createFileRoute } from "@tanstack/react-router";
import { DetailScreen } from "@/components/detail-screen";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/p/$id")({
  head: () =>
    pageHead(
      "Detail perangkat",
      "Periksa skor kepercayaan, spesifikasi, bukti, dan riwayat perangkat bekas.",
    ),
  component: Passport,
});
function Passport() {
  const { id } = Route.useParams();
  return <DetailScreen id={id} />;
}
