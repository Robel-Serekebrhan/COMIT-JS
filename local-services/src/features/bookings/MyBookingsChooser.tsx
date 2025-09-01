import { useAuth } from "../../app/providers/AuthProvider";
import { ProviderMyBookingsPage } from "./ProviderMyBookingsPage";
import { UserBookingsPage } from "./UserBookingsPage";

export function MyBookingsChooser() {
  const { role } = useAuth();
  if (role === "provider" || role === "admin") return <ProviderMyBookingsPage />;
  return <UserBookingsPage />;
}
