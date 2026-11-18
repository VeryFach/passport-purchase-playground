import { createFileRoute } from "@tanstack/react-router";
import { PassportForm } from "@/components/passport-form";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/devices/$id")({
  head: () => pageHead("Kelola paspor", "Lengkapi identitas dan bukti riwayat perangkat Anda."),
  component: EditDevice,
});
function EditDevice() {
  const { id } = Route.useParams();
  return <PassportForm id={id} />;
}
