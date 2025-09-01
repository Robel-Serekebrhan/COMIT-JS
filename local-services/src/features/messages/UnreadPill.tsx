import { useEffect, useMemo, useState } from "react";
import { watchMessages, watchThreadMeta } from "./api";
import type { MessageDoc, ThreadMetaDoc } from "../../types/models";

export function UnreadPill({
  bookingId,
  uid,
}: {
  bookingId: string;
  uid: string;
}) {
  const [meta, setMeta] = useState<ThreadMetaDoc | null>(null);
  const [recent, setRecent] = useState<MessageDoc[]>([]);

  useEffect(() => {
    const u1 = watchThreadMeta(bookingId, setMeta);
    const u2 = watchMessages(bookingId, (rows) => {
      // keep only the last ~50 for lightweight counting
      setRecent(rows.slice(-50));
    });
    return () => {
      u1();
      u2();
    };
  }, [bookingId]);

  const unread = useMemo(() => {
    if (!meta) return 0;
    const last = meta.lastReadAt?.[uid]?.toMillis?.() ?? 0;
    return recent.filter(
      (m) => (m.createdAt?.toMillis?.() ?? 0) > last && m.senderUid !== uid
    ).length;
  }, [meta, recent, uid]);

  if (unread <= 0) return null;
  return <span className="badge-dot">{unread}</span>;
}
