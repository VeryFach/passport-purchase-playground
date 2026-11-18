import { createFileRoute } from "@tanstack/react-router";
import { ComparisonScreen } from "@/components/comparison-screen";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/compare")({
  head: () =>
    pageHead(
      "Bandingkan perangkat",
      "Bandingkan harga, baterai, riwayat, dan sumber bukti hingga tiga perangkat.",
    ),
  component: ComparisonScreen,
});
