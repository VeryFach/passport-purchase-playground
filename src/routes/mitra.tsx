import { createFileRoute } from "@tanstack/react-router";
import { PartnerScreen } from "@/components/partner-screen";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/mitra")({
  head: () =>
    pageHead("Dasbor Mitra", "Periksa bukti dan simulasikan verifikasi catatan perangkat."),
  component: PartnerScreen,
});
