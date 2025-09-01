import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { sendMessage, watchMessages, markThreadRead } from "./api";
import type { MessageDoc } from "../../types/models";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";

export function ChatPage() {
  const { bookingId = "" } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  // const [meta, setMeta] = useState<ThreadMetaDoc | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const [otherName, setOtherName] = useState<string>("");

  // Load booking for header context (service & counterpart)
  useEffect(() => {
    let active = true;
    (async () => {
      const snap = await getDoc(doc(db, "bookings", bookingId));
      if (!snap.exists()) return;
      const b: any = snap.data();
      const name =
        user?.uid === b.providerUid
          ? b.userName ?? "Customer"
          : b.serviceName ?? "Provider";
      if (active) setOtherName(name);
    })();
    return () => {
      active = false;
    };
  }, [bookingId, user?.uid]);

  // Live messages + meta
  useEffect(() => {
    const unsub1 = watchMessages(bookingId, (rows) => {
      setMessages(rows);
      // autoscroll on new messages
      setTimeout(() => {
        feedRef.current?.scrollTo({
          top: feedRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    });
    // If needed later, we can watch thread meta for unread indicators
    // const unsub2 = watchThreadMeta(bookingId, setMeta);
    return () => {
      unsub1();
      // unsub2();
    };
  }, [bookingId]);

  // Mark read whenever we open or messages change
  useEffect(() => {
    if (!user) return;
    markThreadRead(bookingId, user.uid).catch(() => {});
  }, [bookingId, user?.uid, messages.length]);

  if (!user)
    return (
      <div className="card">
        <p>Please log in.</p>
      </div>
    );

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list);
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    const me = user!; // guarded above by early return
    await sendMessage({
      bookingId,
      senderUid: me.uid,
      senderName: me.displayName ?? "User",
      text,
      files,
    });
    setText("");
    setFiles([]);
  }

  return (
    <div className="card chat">
      <div className="chat__feed" ref={feedRef}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: ".6rem",
          }}
        >
          <h3>Chat • {otherName}</h3>
          <Link to="/bookings" className="btn btn--ghost">
            Back to My Bookings
          </Link>
        </div>

        {messages.map((m) => {
          const mine = m.senderUid === user.uid;
          const cls = "msg " + (mine ? "msg--me" : "msg--them");
          return (
            <div key={m.id} className={cls}>
              {m.text ? <div>{m.text}</div> : null}
              {m.attachments?.length ? (
                <div className="msg__attachments">
                  {m.attachments.map((u, i) => {
                    const image = /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(u);
                    return image ? (
                      <img key={i} src={u} alt={`attachment-${i}`} />
                    ) : (
                      <a key={i} href={u} target="_blank" rel="noreferrer">
                        Attachment {i + 1}
                      </a>
                    );
                  })}
                </div>
              ) : null}
              <div className="msg__meta">{m.senderName ?? "User"}</div>
            </div>
          );
        })}
        {messages.length === 0 ? (
          <p className="muted">No messages yet. Say hi 👋</p>
        ) : null}
      </div>

      <form className="chat__composer" onSubmit={onSend}>
        <input type="file" multiple onChange={onPickFiles} />
        <input
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn">Send</button>
      </form>

      {files.length ? (
        <p className="muted" style={{ marginTop: ".25rem" }}>
          {files.length} file(s) selected
        </p>
      ) : null}
    </div>
  );
}
