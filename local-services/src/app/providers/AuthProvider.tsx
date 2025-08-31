import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase/firebase";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import type { Role, UserDoc } from "../../types/models";

type AuthCtx = {
  user: User | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setRole("guest");
      setLoading(true);

      if (!u) {
        if (unsubUserDoc) {
          unsubUserDoc();
          unsubUserDoc = null;
        }
        setLoading(false);
        return;
      }

      // Ensure a user doc exists (in case account was created elsewhere)
      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const payload: UserDoc = {
          uid: u.uid,
          role: "user",
          displayName: u.displayName ?? "",
          email: u.email ?? "",
          createdAt: serverTimestamp() as any,
        };
        await setDoc(userRef, payload, { merge: true });
      }

      // Live role updates
      unsubUserDoc = onSnapshot(userRef, (docSnap) => {
        const data = docSnap.data() as UserDoc | undefined;
        setRole(data?.role ?? "user");
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      role,
      loading,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      register: async (name, email, password) => {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (cred.user && name)
          await updateProfile(cred.user, { displayName: name });
        const ref = doc(db, "users", cred.user!.uid);
        const payload: UserDoc = {
          uid: cred.user!.uid,
          role: "user",
          displayName: name,
          email,
          createdAt: serverTimestamp() as any,
        };
        await setDoc(ref, payload, { merge: true });
      },
      signOut: async () => {
        await fbSignOut(auth);
      },
    }),
    [user, role, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

// import { createContext, useContext, useEffect, useMemo, useState } from "react";
// import type { ReactNode } from "react";
// import type { User } from "firebase/auth";
// import {
//   onAuthStateChanged,
//   signInWithEmailAndPassword,
//   signOut as fbSignOut,
//   createUserWithEmailAndPassword,
//   updateProfile,
// } from "firebase/auth";
// import { auth } from "../../lib/firebase/firebase";

// type Role = "guest" | "user" | "provider" | "admin";

// type AuthCtx = {
//   user: User | null;
//   role: Role;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   register: (name: string, email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
// };

// const Ctx = createContext<AuthCtx | null>(null);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [role, setRole] = useState<Role>("guest");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (u) => {
//       setUser(u);
//       if (!u) {
//         setRole("guest");
//         setLoading(false);
//         return;
//       }
//       // TODO: fetch role from Firestore users/{uid}.role
//       setRole("user");
//       setLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   const value = useMemo<AuthCtx>(
//     () => ({
//       user,
//       role,
//       loading,
//       signIn: async (email, password) => {
//         await signInWithEmailAndPassword(auth, email, password);
//       },
//       register: async (name, email, password) => {
//         const cred = await createUserWithEmailAndPassword(
//           auth,
//           email,
//           password
//         );
//         if (cred.user && name)
//           await updateProfile(cred.user, { displayName: name });
//         // TODO: set user doc with default role "user"
//       },
//       signOut: async () => {
//         await fbSignOut(auth);
//       },
//     }),
//     [user, role, loading]
//   );

//   return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
// }

// export function useAuth() {
//   const v = useContext(Ctx);
//   if (!v) throw new Error("useAuth must be used within AuthProvider");
//   return v;
// }
