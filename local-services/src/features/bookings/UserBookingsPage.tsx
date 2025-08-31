import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { updateBookingStatus, watchUserBookings } from "./api";
import type { BookingDoc } from "../../types/models";

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

export function UserBookingsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BookingDoc[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = watchUserBookings(user.uid, setRows);
    return () => unsub();
  }, [user?.uid]);

  async function cancel(id: string) {
    await updateBookingStatus(id, "cancelled");
  }

  if (!user)
    return (
      <div className="card">
        <p>Please log in.</p>
      </div>
    );

  return (
    <div className="card">
      <h2>My Bookings</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Service</th>
            <th>When</th>
            <th>Duration</th>
            <th>Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const when = b.startTime.toDate().toLocaleString();
            return (
              <tr key={b.id}>
                <td>{b.serviceName}</td>
                <td>{when}</td>
                <td>{b.durationHours}h</td>
                <td>CAD ${b.priceQuote.toFixed(2)}</td>
                <td>
                  <StatusBadge s={b.status} />
                </td>
                <td className="actions">
                  {b.status === "pending" ? (
                    <button
                      className="btn btn--ghost"
                      onClick={() => cancel(b.id!)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="muted">
                No bookings yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
