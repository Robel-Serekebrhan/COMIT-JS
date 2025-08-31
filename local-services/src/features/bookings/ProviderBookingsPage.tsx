import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { updateBookingStatus, watchProviderBookings } from "./api";
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

export function ProviderBookingsPage() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<BookingDoc[]>([]);

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

  async function confirm(id: string) {
    await updateBookingStatus(id, "confirmed");
  }
  async function decline(id: string) {
    await updateBookingStatus(id, "declined");
  }
  async function complete(id: string) {
    await updateBookingStatus(id, "completed");
  }

  return (
    <div className="card">
      <h2>Incoming Bookings</h2>
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
          {rows.map((b) => {
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
                  {b.status === "pending" && (
                    <>
                      <button className="btn" onClick={() => confirm(b.id!)}>
                        Confirm
                      </button>
                      <button
                        className="btn btn--ghost"
                        onClick={() => decline(b.id!)}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button className="btn" onClick={() => complete(b.id!)}>
                      Mark completed
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="muted">
                No requests yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
