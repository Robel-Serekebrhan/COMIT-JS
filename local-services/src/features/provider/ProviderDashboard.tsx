import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { db } from "../../lib/firebase/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { watchProviderBookings } from "../bookings/api";
import type { BookingDoc } from "../../types/models";
import { Link } from "react-router-dom";

export function ProviderDashboard() {
  const { user, role } = useAuth();
  const [available, setAvailable] = useState(false);
  const [rows, setRows] = useState<BookingDoc[]>([]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any;
      setAvailable(Boolean(data?.available));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    const unsub = watchProviderBookings(user.uid, setRows);
    return () => unsub();
  }, [user?.uid]);

  async function toggleAvailability() {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { available: !available });
  }

  const stats = useMemo(() => {
    const now = Date.now();
    const pending = rows.filter((r) => r.status === "pending").length;
    const upcoming = rows.filter(
      (r) => r.status === "confirmed" && r.startTime.toDate().getTime() >= now
    ).length;
    const completed = rows.filter((r) => r.status === "completed").length;
    return { pending, upcoming, completed };
  }, [rows]);

  if (!user || !(role === "provider" || role === "admin")) {
    return (
      <div className="card">
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2>Provider Dashboard</h2>
          <p className="muted">Manage your availability and track bookings.</p>
        </div>
        <button
          className={available ? "btn" : "btn btn--ghost"}
          onClick={toggleAvailability}
          title={available ? "You are available" : "You are offline"}
        >
          {available ? "Available" : "Offline"}
        </button>
      </div>

      <section className="grid grid--3">
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Pending Requests</h3>
          <p style={{ fontSize: 28, margin: 0 }}>{stats.pending}</p>
          <Link className="btn btn--ghost" to="/provider/bookings">
            View Requests
          </Link>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Upcoming (Confirmed)</h3>
          <p style={{ fontSize: 28, margin: 0 }}>{stats.upcoming}</p>
          <Link className="btn btn--ghost" to="/bookings">
            My Bookings
          </Link>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Completed</h3>
          <p style={{ fontSize: 28, margin: 0 }}>{stats.completed}</p>
        </div>
      </section>
    </div>
  );
}

