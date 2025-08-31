import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export function AppLayout() {
  const { user, role, signOut } = useAuth();

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
          </nav>

          <div style={{ display: "flex", gap: ".5rem" }}>
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
