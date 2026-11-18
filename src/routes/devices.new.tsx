import { createFileRoute } from "@tanstack/react-router";
import { PassportForm } from "@/components/passport-form";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/devices/new")({
  head: () => pageHead("Buat paspor", "Buat identitas digital dan riwayat HP atau laptop Anda."),
  component: () => <PassportForm />,
});
