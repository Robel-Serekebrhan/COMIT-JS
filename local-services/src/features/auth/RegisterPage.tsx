import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { authErrorMessage } from "../../lib/firebase/errors";

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await register(name, email, password);
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
