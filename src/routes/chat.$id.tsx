import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/transaction-screens";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/chat/$id")({
  head: () =>
    pageHead(
      "Diskusi perangkat",
      "Tanyakan kondisi dan ajukan penawaran harga dalam percakapan demo.",
    ),
  component: Chat,
});
function Chat() {
  const { id } = Route.useParams();
  return <ChatScreen id={id} />;
}
