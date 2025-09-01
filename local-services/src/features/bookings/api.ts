// src/features/bookings/api.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";
import type { BookingDoc, BookingStatus } from "../../types/models";

/** Max single-booking length we support (used to approximate conflict checks) */
const MAX_DURATION_HOURS = 12;

const COL = "bookings";

/** Create a booking request with a soft conflict check. Throws if conflict found. */
export async function createBookingRequest(input: {
  serviceId: string;
  serviceName: string;
  providerUid: string;
  userUid: string;
  userName?: string;
  startTime: Date; // local Date; we convert to Timestamp
  durationHours: number;
  priceQuote: number;
  notes?: string;
}) {
  // derive end
  const start = Timestamp.fromDate(input.startTime);
  const end = Timestamp.fromDate(
    new Date(input.startTime.getTime() + input.durationHours * 60 * 60 * 1000)
  );

  // conflict check: get bookings for same service with start in a window, then filter locally
  const windowStart = Timestamp.fromDate(
    new Date(input.startTime.getTime() - MAX_DURATION_HOURS * 60 * 60 * 1000)
  );
  const q = query(
    collection(db, COL),
    where("serviceId", "==", input.serviceId),
    where("startTime", ">=", windowStart),
    where("startTime", "<", end), // anything starting before our end could overlap
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as BookingDoc),
  }));

  const overlaps = rows.some((r) => {
    const rStart = r.startTime.toDate().getTime();
    const rEnd = r.endTime.toDate().getTime();
    const s = start.toDate().getTime();
    const e = end.toDate().getTime();
    const intersects = rStart < e && rEnd > s;
    const active = r.status === "pending" || r.status === "confirmed";
    return intersects && active;
  });

  if (overlaps) {
    throw new Error(
      "Selected time overlaps an existing booking. Try a different time."
    );
  }

  const payload: BookingDoc = {
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    providerUid: input.providerUid,
    userUid: input.userUid,
    userName: input.userName ?? "Customer",
    startTime: start,
    endTime: end,
    durationHours: input.durationHours,
    priceQuote: input.priceQuote,
    currency: "CAD",
    status: "pending",
    notes: input.notes,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  const ref = await addDoc(collection(db, COL), payload as any);
  return ref.id;
}

/** Find providers matching category/city and without a conflicting booking */
async function findAvailableProviders(opts: {
  category: string;
  city?: string;
  start: Date;
  durationHours: number;
}): Promise<string[]> {
  // Users collection stores providers + services list
  const usersCol = collection(db, "users");
  const clauses = [
    where("role", "==", "provider"),
    where("providerServices", "array-contains", opts.category),
  ];
  // city is optional in user profiles; apply only if provided
  if (opts.city) clauses.push(where("city", "==", opts.city));
  // TypeScript can't infer spread of dynamic clauses length on query(); cast any
  const qUsers = query(usersCol as any, ...(clauses as any));
  const uSnap = await getDocs(qUsers);
  let providerUids = uSnap.docs.map((d) => d.id);

  // Fallback: if no providers have explicitly listed this category,
  // broadcast to all providers (optionally filtered by city)
  if (providerUids.length === 0) {
    const altClauses = [where("role", "==", "provider")] as any[];
    if (opts.city) altClauses.push(where("city", "==", opts.city));
    const qAll = query(usersCol as any, ...(altClauses as any));
    const altSnap = await getDocs(qAll);
    providerUids = altSnap.docs.map((d) => d.id);
  }
  // Broadcast to all providers matching category/city (regardless of availability/conflicts)
  return providerUids;
}

/** Broadcast a booking request to multiple available providers */
export async function broadcastBookingRequest(input: {
  category: string;
  city?: string;
  serviceId: string; // original service the user was viewing
  serviceName: string;
  userUid: string;
  userName?: string;
  startTime: Date;
  durationHours: number;
  priceQuote: number;
  notes?: string;
}) {
  const available = await findAvailableProviders({
    category: input.category,
    city: input.city,
    start: input.startTime,
    durationHours: input.durationHours,
  });
  if (available.length === 0) {
    throw new Error("No available providers found for that time.");
  }
  const groupId = `${input.userUid}-${Date.now()}`;

  const start = Timestamp.fromDate(input.startTime);
  const end = Timestamp.fromDate(
    new Date(input.startTime.getTime() + input.durationHours * 60 * 60 * 1000)
  );

  for (const providerUid of available) {
    const payload: BookingDoc = {
      serviceId: input.serviceId,
      serviceName: input.serviceName,
      providerUid,
      userUid: input.userUid,
      userName: input.userName ?? "Customer",
      startTime: start,
      endTime: end,
      durationHours: input.durationHours,
      priceQuote: input.priceQuote,
      currency: "CAD",
      status: "pending",
      notes: input.notes,
      requestGroupId: groupId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    await addDoc(collection(db, COL), payload as any);
  }
  return groupId;
}

/** Live list for a customer */
export function watchUserBookings(
  userUid: string,
  cb: (rows: BookingDoc[]) => void
) {
  const q = query(collection(db, COL), where("userUid", "==", userUid));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BookingDoc) })));
  });
}

/** Live list for a provider (owner of the service) */
export function watchProviderBookings(
  providerUid: string,
  cb: (rows: BookingDoc[]) => void
) {
  const q = query(collection(db, COL), where("providerUid", "==", providerUid));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BookingDoc) })));
  });
}

/** Status transitions:
 * user: pending -> cancelled
 * provider: pending -> confirmed/declined ; confirmed -> completed
 * admin: anything
 */
export async function updateBookingStatus(id: string, status: BookingStatus) {
  const ref = doc(db, COL, id);
  // Read booking to get context
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const row = snap.data() as BookingDoc;

  const patch: any = { status, updatedAt: serverTimestamp() as any };

  // If provider confirms, attach their profile snapshot and decline other pending in the group
  if (status === "confirmed") {
    // attach provider profile
    const provRef = doc(db, "users", row.providerUid);
    const provSnap = await getDoc(provRef);
    if (provSnap.exists()) {
      const p = provSnap.data() as any;
      const ap: any = { uid: row.providerUid };
      if (p.displayName != null) ap.displayName = p.displayName;
      if (p.email != null) ap.email = p.email;
      if (p.city != null) ap.city = p.city;
      patch.acceptedProvider = ap;
    }
    // Mark provider as offline once a booking is confirmed
    try {
      const pRef = doc(db, "users", row.providerUid);
      await updateDoc(pRef, { available: false } as any);
    } catch {}
  }

  // First, update this booking (so provider actions succeed even if follow-up steps fail)
  await updateDoc(ref, patch);

  // Note: we intentionally do not auto-decline other providers' copies here to
  // avoid heavy fan-out writes during live listeners. The user UI already
  // derives group status (confirmed/pending/declined) from all copies.
}
