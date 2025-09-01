import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";
import { useAuth } from "../../app/providers/AuthProvider";
import type { UserDoc } from "../../types/models";

export function ProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<UserDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
    });
    return () => unsub();
  }, [user?.uid]);

  if (!user)
    return (
      <div className="card">
        <p>Please log in.</p>
      </div>
    );

  return (
    <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>Your Profile</h2>
      <div className="grid" style={{ gap: ".5rem" }}>
        <div>
          <strong>Name:</strong> {user.displayName || profile?.displayName || "—"}
        </div>
        <div>
          <strong>Email:</strong> {user.email || profile?.email || "—"}
        </div>
        <div>
          <strong>Role:</strong> {role}
        </div>
        <div>
          <strong>City:</strong> {profile?.city || "—"}
        </div>
        <div>
          <strong>Phone:</strong> {profile?.phone || "—"}
        </div>
        {profile?.providerServices?.length ? (
          <div>
            <strong>Services:</strong>
            <div style={{ marginTop: ".25rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {profile.providerServices.map((s) => (
                <span key={s} className="badge">{s}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <p className="muted" style={{ marginTop: ".75rem" }}>
        This is a read-only view. Editing can be added later.
      </p>
    </div>
  );
}

