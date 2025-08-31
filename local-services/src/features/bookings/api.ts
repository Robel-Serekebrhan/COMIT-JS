// src/features/bookings/api.ts
import {
  addDoc,
  collection,
  doc,
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

/** Live list for a customer */
export function watchUserBookings(
  userUid: string,
  cb: (rows: BookingDoc[]) => void
) {
  const q = query(
    collection(db, COL),
    where("userUid", "==", userUid),
    orderBy("startTime", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BookingDoc) })));
  });
}

/** Live list for a provider (owner of the service) */
export function watchProviderBookings(
  providerUid: string,
  cb: (rows: BookingDoc[]) => void
) {
  const q = query(
    collection(db, COL),
    where("providerUid", "==", providerUid),
    orderBy("startTime", "desc")
  );
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
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp() as any,
  } as any);
}
