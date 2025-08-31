import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";
import { db, storage } from "../../lib/firebase/firebase";
import type { ServiceDoc } from "../../types/models";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const COL = "services";

export type ListingsFilter = {
  city?: string;
  category?: string;
  // lightweight client-side filters for price and text to avoid complex indexes
  searchText?: string; // name/description contains (client-side)
  minPrice?: number; // client-side
  maxPrice?: number; // client-side
};

/** Create a service listing; optionally upload one image file */
export async function createService(opts: {
  ownerUid: string;
  data: Omit<
    ServiceDoc,
    | "id"
    | "ownerUid"
    | "rating"
    | "ratingCount"
    | "createdAt"
    | "updatedAt"
    | "photos"
  > & { photoFile?: File | null };
}) {
  let photoUrl: string | null = null;
  if (opts.data.photoFile) {
    const path = `services/${opts.ownerUid}/${Date.now()}-${
      opts.data.photoFile.name
    }`;
    const r = ref(storage, path);
    await uploadBytes(r, opts.data.photoFile);
    photoUrl = await getDownloadURL(r);
  }

  const payload: ServiceDoc = {
    ownerUid: opts.ownerUid,
    name: opts.data.name,
    description: opts.data.description,
    category: opts.data.category,
    city: opts.data.city,
    pricePerHour: opts.data.pricePerHour,
    photos: photoUrl ? [photoUrl] : [],
    rating: 0,
    ratingCount: 0,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  const refCol = collection(db, COL);
  const docRef = await addDoc(refCol, payload as any);
  return docRef.id;
}

/** Live list: applies equality filters server-side, everything else client-side */
export function watchServices(
  filter: ListingsFilter,
  cb: (rows: ServiceDoc[]) => void
) {
  const refCol = collection(db, COL);
  const clauses = [];

  if (filter.city) clauses.push(where("city", "==", filter.city));
  if (filter.category) clauses.push(where("category", "==", filter.category));

  const q = query(refCol, ...clauses, orderBy("createdAt", "desc"), limit(50));

  return onSnapshot(q, (snap) => {
    let rows = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as ServiceDoc),
    }));

    // client-side search & price filters
    if (filter.searchText && filter.searchText.trim()) {
      const t = filter.searchText.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(t) ||
          r.description.toLowerCase().includes(t)
      );
    }
    if (typeof filter.minPrice === "number")
      rows = rows.filter((r) => r.pricePerHour >= filter.minPrice!);
    if (typeof filter.maxPrice === "number")
      rows = rows.filter((r) => r.pricePerHour <= filter.maxPrice!);

    cb(rows);
  });
}

/** Live one: a single service by id */
export function watchServiceById(
  id: string,
  cb: (row: ServiceDoc | null) => void
) {
  const refDoc = doc(db, COL, id);
  return onSnapshot(refDoc, (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...(snap.data() as ServiceDoc) });
  });
}

/** (Optional) Update listing (owner/admin only – secured by rules) */
export async function updateService(id: string, patch: Partial<ServiceDoc>) {
  const refDoc = doc(db, COL, id);
  await updateDoc(refDoc, {
    ...patch,
    updatedAt: serverTimestamp() as any,
  } as any);
}
