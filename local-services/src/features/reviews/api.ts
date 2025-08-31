import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";
import type { ReviewDoc } from "../../types/models";

const COL = "reviews";

export function watchReviews(
  serviceId: string,
  cb: (rows: ReviewDoc[]) => void
) {
  const refCol = collection(db, COL);
  const q = query(
    refCol,
    where("serviceId", "==", serviceId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ReviewDoc) }));
    cb(rows);
  });
}

export async function addReview(
  serviceId: string,
  data: Omit<ReviewDoc, "id" | "createdAt"> & { createdAt?: never }
) {
  const payload: ReviewDoc = {
    ...data,
    serviceId,
    createdAt: serverTimestamp() as any,
  } as any;
  await addDoc(collection(db, COL), payload as any);
}

