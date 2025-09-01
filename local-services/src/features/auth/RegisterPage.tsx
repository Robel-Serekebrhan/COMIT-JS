import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import type { Role } from "../../types/models";
import { authErrorMessage } from "../../lib/firebase/errors";

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [services, setServices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const SERVICE_OPTIONS = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Landscaping",
    "Painting",
    "Handyman",
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (role === "provider" && services.length === 0) {
        throw new Error("Select at least one service you can provide.");
      }
      await register(name, email, password, role, services);
      nav("/dashboard");
    } catch (err: any) {
      const code: string | undefined = err?.code;
      setError(authErrorMessage(code, "Registration failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2>Create account</h2>
      <form onSubmit={onSubmit} className="grid" style={{ gap: ".75rem" }}>
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="row" style={{ alignItems: "center" }}>
          <label style={{ minWidth: 120 }}>Account type</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="user">User</option>
            <option value="provider">Provider</option>
          </select>
        </div>
        {role === "provider" ? (
          <div>
            <label>Services you can provide</label>
            <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {SERVICE_OPTIONS.map((opt) => (
                <label key={opt} style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={services.includes(opt)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setServices((prev) =>
                        checked ? [...prev, opt] : prev.filter((x) => x !== opt)
                      );
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        <button className="btn" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
      <p style={{ marginTop: ".75rem" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
