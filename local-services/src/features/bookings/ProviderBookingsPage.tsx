import { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { updateBookingStatus, watchProviderBookings } from "./api";
import type { BookingDoc } from "../../types/models";
import { Link } from "react-router-dom";
import { UnreadPill } from "../messages/UnreadPill";
import { db } from "../../lib/firebase/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

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
  const [available, setAvailable] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any;
      setAvailable(Boolean(data?.available));
    });
    return () => unsub();
  }, [user?.uid]);

  async function toggleAvailability() {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { available: !available });
  }

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
    try {
      setActionError(null);
      await updateBookingStatus(id, "confirmed");
    } catch (e: any) {
      setActionError(e?.message ?? "Could not confirm request.");
    }
  }
  async function decline(id: string) {
    try {
      setActionError(null);
      await updateBookingStatus(id, "declined");
    } catch (e: any) {
      setActionError(e?.message ?? "Could not decline request.");
    }
  }
  async function complete(id: string) {
    try {
      setActionError(null);
      await updateBookingStatus(id, "completed");
    } catch (e: any) {
      setActionError(e?.message ?? "Could not complete request.");
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2>Incoming Bookings</h2>
        <button className="btn btn--ghost" onClick={toggleAvailability}>
          {available ? "Go Offline" : "Go Available"}
        </button>
      </div>
      <table className="table">
        {actionError ? (
          <p style={{ color: "var(--danger)", marginTop: 8 }}>{actionError}</p>
        ) : null}
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
                  <Link
                    className="btn btn--ghost"
                    to={`/bookings/${b.id}/chat`}
                  >
                    Chat <UnreadPill bookingId={b.id!} uid={user.uid} />
                  </Link>
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

// <td className="actions">
//   {b.status === "pending" && (
//     <>
//       <button className="btn" onClick={() => confirm(b.id!)}>
//         Confirm
//       </button>
//       <button
//         className="btn btn--ghost"
//         onClick={() => decline(b.id!)}
//       >
//         Decline
//       </button>
//     </>
//   )}
//   {b.status === "confirmed" && (
//     <button className="btn" onClick={() => complete(b.id!)}>
//       Mark completed
//     </button>
//   )}
// </td>
