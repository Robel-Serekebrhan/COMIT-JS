import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { updateBookingStatus, watchUserBookings } from "./api";
import type { BookingDoc } from "../../types/models";
import { Link } from "react-router-dom";
import { UnreadPill } from "../messages/UnreadPill";
import { collection, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";

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

  async function cancelGroup(groupId: string, anyDocId: string) {
    // If groupId represents a requestGroupId, cancel all bookings in that group for this user.
    // If there is no requestGroupId (groupId === anyDocId), fall back to cancelling the single doc.
    if (!user) return;
    try {
      if (groupId && groupId !== anyDocId) {
        const qAll = query(
          collection(db, "bookings"),
          where("userUid", "==", user.uid),
          where("requestGroupId", "==", groupId)
        );
        const s = await getDocs(qAll);
        await Promise.all(
          s.docs.map((d) =>
            updateDoc(d.ref, { status: "cancelled", updatedAt: serverTimestamp() as any } as any)
          )
        );
      } else {
        await updateBookingStatus(anyDocId, "cancelled");
      }
    } catch (e) {
      // ignore; UI will refresh from listener
    }
  }

  if (!user)
    return (
      <div className="card">
        <p>Please log in.</p>
      </div>
    );

  const grouped = useMemo(() => {
    const byGroup = new Map<string, BookingDoc[]>();
    for (const b of rows) {
      const key = b.requestGroupId || b.id!;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(b);
    }
    const out: (BookingDoc & { groupId: string; groupSize: number })[] = [];
    for (const [groupId, arr] of byGroup.entries()) {
      const base = arr[0];
      const confirmed = arr.find((x) => x.status === "confirmed");
      const anyPending = arr.some((x) => x.status === "pending");
      const allDeclined = arr.every((x) => x.status === "declined" || x.status === "cancelled");

      const derivedStatus: BookingDoc["status"] = confirmed
        ? "confirmed"
        : anyPending
        ? "pending"
        : allDeclined
        ? "declined"
        : base.status;

      const chosen = confirmed ?? base;
      out.push({
        ...chosen,
        status: derivedStatus,
        id: confirmed?.id ?? base.id,
        groupId,
        groupSize: arr.length,
      });
    }
    return out;
  }, [rows]);

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
          {grouped.map((b) => {
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
                <td className="actions" style={{ textAlign: "left" }}>
                  {b.status === "confirmed" && b.acceptedProvider ? (
                    <div style={{ marginBottom: ".4rem" }}>
                      <div>
                        <strong>Provider:</strong>{" "}
                        {b.acceptedProvider.displayName ?? b.acceptedProvider.uid}
                      </div>
                      {b.acceptedProvider.city ? (
                        <div className="muted">{b.acceptedProvider.city}</div>
                      ) : null}
                    </div>
                  ) : null}
                  {b.status === "confirmed" ? (
                    <Link
                      className="btn btn--ghost"
                      to={`/bookings/${b.id}/chat`}
                    >
                      Chat <UnreadPill bookingId={b.id!} uid={user.uid} />
                    </Link>
                  ) : null}
                  {b.status === "pending" ? (
                    <button
                      className="btn btn--ghost"
                      onClick={() => cancelGroup(b.groupId, b.id!)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
          {grouped.length === 0 ? (
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

{
  /* 
                <td className="actions">
                  {b.status === "pending" ? (
                    <button
                      className="btn btn--ghost"
                      onClick={() => cancel(b.id!)}
                    >
                      Cancel
                    </button>
                  ) : null} */
}
