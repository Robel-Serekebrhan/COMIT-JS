import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../lib/firebase/firebase";
import type { MessageDoc, ThreadMetaDoc } from "../../types/models";

/** Paths */
function messagesColPath(bookingId: string) {
  return `bookings/${bookingId}/messages`;
}
function threadMetaDocPath(bookingId: string) {
  return `bookings/${bookingId}/thread/meta`;
}

/** Ensure thread meta exists with participants derived from the booking */
async function ensureThreadMeta(bookingId: string) {
  const metaRef = doc(db, threadMetaDocPath(bookingId));
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists()) return;

  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);
  if (!bookingSnap.exists())
    throw new Error("Booking not found for thread init.");
  const b = bookingSnap.data() as any; // BookingDoc

  const payload: ThreadMetaDoc = {
    participants: [b.userUid, b.providerUid],
    lastMessageAt: serverTimestamp() as any,
    lastMessageText: "Thread created",
    lastReadAt: {},
  };
  await setDoc(metaRef, payload, { merge: true });
}

/** Upload selected files; returns array of download URLs */
async function uploadAttachments(
  bookingId: string,
  senderUid: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) {
    const path = `messages/${bookingId}/${senderUid}/${Date.now()}-${f.name}`;
    const r = ref(storage, path);
    await uploadBytes(r, f);
    urls.push(await getDownloadURL(r));
  }
  return urls;
}

/** Send a message (text and/or files) */
export async function sendMessage(opts: {
  bookingId: string;
  senderUid: string;
  senderName?: string;
  text?: string;
  files?: File[];
}) {
  await ensureThreadMeta(opts.bookingId);

  const attachments = opts.files?.length
    ? await uploadAttachments(opts.bookingId, opts.senderUid, opts.files)
    : [];

  if (!opts.text && attachments.length === 0) return;

  const payload: MessageDoc = {
    senderUid: opts.senderUid,
    senderName: opts.senderName ?? "User",
    text: opts.text?.trim() || undefined,
    attachments: attachments.length ? attachments : undefined,
    createdAt: serverTimestamp() as any,
  };

  const refCol = collection(db, messagesColPath(opts.bookingId));
  await addDoc(refCol, payload as any);

  const metaRef = doc(db, threadMetaDocPath(opts.bookingId));
  await updateDoc(metaRef, {
    lastMessageAt: serverTimestamp() as any,
    lastMessageText:
      payload.text ?? (payload.attachments?.length ? "📎 Attachment" : ""),
  } as any);
}

/** Watch messages in a thread (live, newest first) */
export function watchMessages(
  bookingId: string,
  cb: (rows: MessageDoc[]) => void
) {
  const q = query(
    collection(db, messagesColPath(bookingId)),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as MessageDoc) })));
  });
}

/** Watch thread meta (for unread counters, etc.) */
export function watchThreadMeta(
  bookingId: string,
  cb: (meta: ThreadMetaDoc | null) => void
) {
  const ref = doc(db, threadMetaDocPath(bookingId));
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as ThreadMetaDoc) : null);
  });
}

/** Mark current user as "read" now */
export async function markThreadRead(bookingId: string, uid: string) {
  const ref = doc(db, threadMetaDocPath(bookingId));
  await setDoc(
    ref,
    { lastReadAt: { [uid]: serverTimestamp() as any } },
    { merge: true }
  );
}
