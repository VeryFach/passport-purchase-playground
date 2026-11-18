import { createFileRoute, redirect } from "@tanstack/react-router";

// The C2C model has no admin role. Kept only so the generated route tree and
// existing bookmarks resolve; every visit returns to the marketplace.
export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
