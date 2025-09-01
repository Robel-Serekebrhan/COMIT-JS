import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

export function AppLayout() {
  const { user, role, signOut } = useAuth();
  const [available, setAvailable] = useState<boolean>(false);

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

  return (
    <>
      <header className="card" style={{ borderRadius: 0 }}>
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/">
            <strong>Local Services</strong>
          </Link>

          <nav style={{ display: "flex", gap: "1rem" }}>
            <NavLink to="/browse">Browse</NavLink>
            {user ? <NavLink to="/bookings">My Bookings</NavLink> : null}
            {role === "provider" || role === "admin" ? (
              <NavLink to="/provider">Provider</NavLink>
            ) : null}
            {role === "provider" || role === "admin" ? (
              <NavLink to="/provider/bookings">Requests</NavLink>
            ) : null}
            {role === "admin" ? <NavLink to="/admin">Admin</NavLink> : null}
            {user ? <NavLink to="/dashboard">Dashboard</NavLink> : null}
            {user ? <NavLink to="/profile">Profile</NavLink> : null}
          </nav>

          <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
            {user && (role === "provider" || role === "admin") ? (
              <button
                className={available ? "btn" : "btn btn--ghost"}
                onClick={toggleAvailability}
                title={available ? "You are available" : "You are offline"}
              >
                {available ? "Available" : "Offline"}
              </button>
            ) : null}
            {!user ? (
              <>
                <Link to="/login" className="btn btn--ghost">
                  Login
                </Link>
                <Link to="/register" className="btn">
                  Sign up
                </Link>
              </>
            ) : (
              <button className="btn btn--ghost" onClick={signOut}>
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: "1rem" }}>
        <Outlet />
      </main>

      <footer
        className="container"
        style={{ color: "var(--muted)", padding: "2rem 1rem" }}
      >
        © {new Date().getFullYear()} Local Services
      </footer>
    </>
  );
}
