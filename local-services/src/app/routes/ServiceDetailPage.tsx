import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { watchServiceById } from "../../features/listings/api";
import { watchReviews, addReview } from "../../features/reviews/api";
import type { ServiceDoc, ReviewDoc } from "../../types/models";
import { useAuth } from "../providers/AuthProvider";
import { BookingWidget } from "../../features/bookings/BookingWidget";

export function ServiceDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();

  const [svc, setSvc] = useState<(ServiceDoc & { id: string }) | null>(null);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);

  // review form
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");

  useEffect(() => {
    const unsub1 = watchServiceById(id, (row) =>
      row ? setSvc({ id, ...row }) : setSvc(null)
    );
    const unsub2 = watchReviews(id, setReviews);
    return () => {
      unsub1();
      unsub2();
    };
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !svc) return;
    await addReview(id, {
      serviceId: id,
      userUid: user.uid,
      userName: user.displayName ?? "Anonymous",
      rating,
      text,
    });
    setRating(5);
    setText("");
  }

  if (!svc)
    return (
      <div className="card">
        <p>Loading…</p>
      </div>
    );

  return (
    <section className="grid" style={{ gap: "1rem" }}>
      {/* Left: service info */}
      <div className="card">
        {svc.photos?.[0] ? (
          <img
            src={svc.photos[0]}
            alt={svc.name}
            style={{
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
              borderRadius: ".6rem",
            }}
          />
        ) : null}
        <h2 style={{ marginTop: ".6rem" }}>{svc.name}</h2>
        <p className="muted">
          {svc.category} • {svc.city}
        </p>
        <p>CAD ${svc.pricePerHour}/hr</p>
        <p className="muted">
          ⭐ {svc.rating?.toFixed?.(1) ?? "0.0"} ({svc.ratingCount ?? 0})
        </p>
        <p style={{ marginTop: ".6rem" }}>{svc.description}</p>
      </div>

      {/* Right: booking widget */}
      <BookingWidget service={svc as ServiceDoc & { id: string }} />

      {/* Reviews */}
      <div className="card">
        <h3>Reviews</h3>
        {reviews.length === 0 ? <p className="muted">No reviews yet.</p> : null}
        {reviews.map((r) => (
          <div
            key={r.id}
            style={{
              borderTop: "1px solid #223",
              paddingTop: ".6rem",
              marginTop: ".6rem",
            }}
          >
            <p>
              <strong>{r.userName ?? "User"}</strong> • ⭐ {r.rating}
            </p>
            <p>{r.text}</p>
          </div>
        ))}

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #223",
            margin: "1rem 0",
          }}
        />

        {user ? (
          <form onSubmit={onSubmit} className="grid" style={{ gap: ".6rem" }}>
            <label>Rating (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <label>Your review</label>
            <textarea
              rows={3}
              placeholder="How was the service?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn">Submit review</button>
          </form>
        ) : (
          <p className="muted">Log in to leave a review.</p>
        )}
      </div>
    </section>
  );
}

// import type { FormEvent } from "react";
// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { watchServiceById } from "../../features/listings/api";
// import { watchReviews, addReview } from "../../features/reviews/api";
// import type { ServiceDoc, ReviewDoc } from "../../types/models";
// import { useAuth } from "../providers/AuthProvider";

// export function ServiceDetailPage() {
//   const { id = "" } = useParams();
//   const { user } = useAuth();

//   const [svc, setSvc] = useState<ServiceDoc | null>(null);
//   const [reviews, setReviews] = useState<ReviewDoc[]>([]);

//   // form state
//   const [rating, setRating] = useState<number>(5);
//   const [text, setText] = useState("");

//   useEffect(() => {
//     const unsub1 = watchServiceById(id, setSvc);
//     const unsub2 = watchReviews(id, setReviews);
//     return () => {
//       unsub1();
//       unsub2();
//     };
//   }, [id]);

//   async function onSubmit(e: FormEvent) {
//     e.preventDefault();
//     if (!user || !svc) return;
//     await addReview(id, {
//       serviceId: id,
//       userUid: user.uid,
//       userName: user.displayName ?? "Anonymous",
//       rating,
//       text,
//     });
//     setRating(5);
//     setText("");
//   }

//   if (!svc)
//     return (
//       <div className="card">
//         <p>Loading…</p>
//       </div>
//     );

//   return (
//     <section className="grid" style={{ gap: "1rem" }}>
//       <div className="card">
//         {svc.photos?.[0] ? (
//           <img
//             src={svc.photos[0]}
//             alt={svc.name}
//             style={{
//               width: "100%",
//               maxHeight: 320,
//               objectFit: "cover",
//               borderRadius: ".6rem",
//             }}
//           />
//         ) : null}
//         <h2 style={{ marginTop: ".6rem" }}>{svc.name}</h2>
//         <p className="muted">
//           {svc.category} • {svc.city}
//         </p>
//         <p>CAD ${svc.pricePerHour}/hr</p>
//         <p className="muted">
//           ⭐ {svc.rating?.toFixed?.(1) ?? "0.0"} ({svc.ratingCount ?? 0})
//         </p>
//         <p style={{ marginTop: ".6rem" }}>{svc.description}</p>
//       </div>

//       <div className="card">
//         <h3>Reviews</h3>
//         {reviews.length === 0 ? <p className="muted">No reviews yet.</p> : null}
//         {reviews.map((r) => (
//           <div
//             key={r.id}
//             style={{
//               borderTop: "1px solid #223",
//               paddingTop: ".6rem",
//               marginTop: ".6rem",
//             }}
//           >
//             <p>
//               <strong>{r.userName ?? "User"}</strong> • ⭐ {r.rating}
//             </p>
//             <p>{r.text}</p>
//           </div>
//         ))}

//         <hr
//           style={{
//             border: "none",
//             borderTop: "1px solid #223",
//             margin: "1rem 0",
//           }}
//         />

//         {user ? (
//           <form onSubmit={onSubmit} className="grid" style={{ gap: ".6rem" }}>
//             <label>Rating (1–5)</label>
//             <input
//               type="number"
//               min={1}
//               max={5}
//               value={rating}
//               onChange={(e) => setRating(Number(e.target.value))}
//             />
//             <label>Your review</label>
//             <textarea
//               rows={3}
//               placeholder="How was the service?"
//               value={text}
//               onChange={(e) => setText(e.target.value)}
//             />
//             <button className="btn">Submit review</button>
//           </form>
//         ) : (
//           <p className="muted">Log in to leave a review.</p>
//         )}
//       </div>
//     </section>
//   );
// }

// import { useParams } from "react-router-dom";

// export function ServiceDetailPage() {
//   const { id } = useParams();
//   // Next phases: fetch service by id from Firestore
//   return (
//     <section className="card">
//       <h2>Service Detail</h2>
//       <p>Service ID: {id}</p>
//       <p>(We’ll load data, reviews, and booking widget here.)</p>
//     </section>
//   );
// }
