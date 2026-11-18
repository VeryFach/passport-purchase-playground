import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/home-screen";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Jelajahi perangkat",
      "Temukan HP dan laptop bekas dengan riwayat, bukti servis, dan skor kepercayaan.",
    ),
  component: HomeScreen,
});
