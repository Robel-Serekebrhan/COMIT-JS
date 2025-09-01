import type { FormEvent } from "react";
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";
import { getAuth } from "firebase/auth";
import { useAuth } from "../../app/providers/AuthProvider";
import { authErrorMessage } from "../../lib/firebase/errors";

export function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn(email, password);
      // Determine role and redirect accordingly (providers → requests by default)
      const uid = getAuth().currentUser!.uid;
      const snap = await getDoc(doc(db, "users", uid));
      const role = snap.exists() ? (snap.data() as any).role : undefined;
      const fallback = loc?.state?.from?.pathname;
      if (role === "provider" || role === "admin") nav(fallback || "/provider/bookings");
      else nav(fallback || "/dashboard");
    } catch (err: any) {
      const code: string | undefined = err?.code;
      setError(authErrorMessage(code, "Sign in failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} className="grid" style={{ gap: ".75rem" }}>
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
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: ".75rem" }}>
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
