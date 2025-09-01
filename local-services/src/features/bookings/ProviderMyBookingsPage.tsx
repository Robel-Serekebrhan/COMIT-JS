import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { updateBookingStatus, watchProviderBookings } from "./api";
import type { BookingDoc } from "../../types/models";
import { Link } from "react-router-dom";
import { UnreadPill } from "../messages/UnreadPill";

function StatusBadge({ s }: { s: BookingDoc["status"] }) {
  const cls = {
    pending: "badge badge--pending",
    confirmed: "badge badge--confirmed",
    declined: "badge badge--declined",
    cancelled: "badge badge--cancelled",
    completed: "badge badge--completed",
  }[s];
  return <span className={cls}>{s}</span>;
}

export function ProviderMyBookingsPage() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<BookingDoc[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = watchProviderBookings(user.uid, setRows);
    return () => unsub();
  }, [user?.uid]);

  if (!user)
    return (
      <div className="card">
        <p>Please log in.</p>
      </div>
    );
  if (!(role === "provider" || role === "admin"))
    return (
      <div className="card">
        <p>Access denied.</p>
      </div>
    );

  const confirmed = rows.filter((b) => b.status === "confirmed");

  async function complete(id: string) {
    try {
      setActionError(null);
      await updateBookingStatus(id, "completed");
    } catch (e: any) {
      setActionError(e?.message ?? "Could not complete booking.");
    }
  }

  return (
    <div className="card">
      <h2>My Bookings (Confirmed)</h2>
      {actionError ? (
        <p style={{ color: "var(--danger)", marginTop: 8 }}>{actionError}</p>
      ) : null}
      <table className="table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Service</th>
            <th>When</th>
            <th>Duration</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {confirmed.map((b) => {
            const when = b.startTime.toDate().toLocaleString();
            return (
              <tr key={b.id}>
                <td>{b.userName ?? b.userUid.slice(0, 6)}</td>
                <td>{b.serviceName}</td>
                <td>{when}</td>
                <td>{b.durationHours}h</td>
                <td>CAD ${b.priceQuote.toFixed(2)}</td>
                <td>
                  <StatusBadge s={b.status} />
                </td>
                <td className="actions">
                  <Link
                    className="btn btn--ghost"
                    to={`/bookings/${b.id}/chat`}
                  >
                    Chat <UnreadPill bookingId={b.id!} uid={user.uid} />
                  </Link>
                  <button className="btn" onClick={() => complete(b.id!)}>
                    Mark completed
                  </button>
                </td>
              </tr>
            );
          })}
          {confirmed.length === 0 ? (
            <tr>
              <td colSpan={7} className="muted">
                No confirmed bookings yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

