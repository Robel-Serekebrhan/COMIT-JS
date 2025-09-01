import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { broadcastBookingRequest } from "../../features/bookings/api";
import {
  watchServices,
  type ListingsFilter,
} from "../../features/listings/api";

const CITIES = ["Edmonton", "Calgary", "Red Deer", "Lethbridge"];
const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Landscaping",
  "HVAC",
  "Painting",
  "Moving",
];

export function BrowseServicesPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ListingsFilter>({});
  const [rows, setRows] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [rqOpen, setRqOpen] = useState(false);
  const [rqCategory, setRqCategory] = useState<string>("");
  const [rqDate, setRqDate] = useState<string>("");
  const [rqTime, setRqTime] = useState<string>("09:00");
  const [rqDuration, setRqDuration] = useState<number>(2);
  const [rqNotes, setRqNotes] = useState<string>("");
  const [rqPending, setRqPending] = useState(false);
  const [rqError, setRqError] = useState<string| null>(null);
  const [rqOk, setRqOk] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchServices(filter, setRows);
    return () => unsub();
  }, [
    filter.city,
    filter.category,
    filter.searchText,
    filter.minPrice,
    filter.maxPrice,
  ]); // primitive deps

  const count = rows.length;

  return (
    <>
      {/* Collapsible search area */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2>Browse Services</h2>
        {!showFilters ? (
          <div
            onClick={() => setShowFilters(true)}
            style={{ cursor: "pointer" }}
            title="Click to search and filter"
          >
            <input
              placeholder="Search services… (click to open filters)"
              value={filter.searchText ?? ""}
              onFocus={() => setShowFilters(true)}
              onChange={(e) =>
                setFilter((f) => ({ ...f, searchText: e.target.value }))
              }
            />
          </div>
        ) : (
          <>
            <div className="row">
              <div>
                <label>Search</label>
                <input
                  placeholder="Search by name or description"
                  value={filter.searchText ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, searchText: e.target.value }))
                  }
                />
              </div>
              <div>
                <label>City</label>
                <select
                  value={filter.city ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      city: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Category</label>
                <select
                  value={filter.category ?? ""}
                  onChange={(e) =>
                    setFilter((f) => ({
                      ...f,
                      category: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Min Price (CAD/hr)</label>
                <input
                  type="number"
                  min={0}
                  value={filter.minPrice ?? ""}
                  onChange={(e) => {
                    const v =
                      e.target.value === "" ? undefined : Number(e.target.value);
                    setFilter((f) => ({ ...f, minPrice: v }));
                  }}
                />
              </div>
              <div>
                <label>Max Price (CAD/hr)</label>
                <input
                  type="number"
                  min={0}
                  value={filter.maxPrice ?? ""}
                  onChange={(e) => {
                    const v =
                      e.target.value === "" ? undefined : Number(e.target.value);
                    setFilter((f) => ({ ...f, maxPrice: v }));
                  }}
                />
              </div>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <p className="muted" style={{ marginTop: ".5rem" }}>
                {count} result{count === 1 ? "" : "s"}
              </p>
              <button className="btn btn--ghost" onClick={() => setShowFilters(false)}>
                Hide filters
              </button>
            </div>
          </>
        )}
      </div>

      {/* Category cards */}
      <section className="grid grid--3" style={{ marginBottom: "1rem" }}>
        {CATEGORIES.map((cat) => {
          const active = filter.category === cat;
          return (
            <button
              key={cat}
              className="card"
              style={{
                textAlign: "left",
                border: active ? "2px solid var(--accent)" : undefined,
                padding: "1rem",
              }}
              onClick={() => {
                setFilter((f) => ({ ...f, category: cat }));
                setRqCategory(cat);
                setRqOpen(true);
              }}
            >
              <h3 style={{ margin: 0 }}>{cat}</h3>
              <p className="muted" style={{ marginTop: ".25rem" }}>
                Browse {cat.toLowerCase()} services
              </p>
            </button>
          );
        })}
      </section>

      {/* Quick request by category */}
      {rqOpen && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3>Request {rqCategory} service</h3>
          {user ? (
            <form
              className="grid"
              style={{ gap: ".6rem" }}
              onSubmit={async (e) => {
                e.preventDefault();
                setRqPending(true);
                setRqError(null);
                setRqOk(null);
                try {
                  if (!rqDate || !rqTime) throw new Error("Choose date and time");
                  const [y, m, d] = rqDate.split("-").map(Number);
                  const [hh, mm] = rqTime.split(":").map(Number);
                  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
                  await broadcastBookingRequest({
                    category: rqCategory,
                    city: filter.city,
                    serviceId: `category:${rqCategory}`,
                    serviceName: rqCategory,
                    userUid: user!.uid,
                    userName: user!.displayName ?? "Customer",
                    startTime: dt,
                    durationHours: rqDuration,
                    priceQuote: 0,
                    notes: rqNotes,
                  });
                  setRqOk("Request sent to available providers.");
                  setRqNotes("");
                } catch (err: any) {
                  setRqError(err?.message ?? "Could not send request");
                } finally {
                  setRqPending(false);
                }
              }}
            >
              <div className="row">
                <div>
                  <label>Date</label>
                  <input type="date" value={rqDate} onChange={(e) => setRqDate(e.target.value)} />
                </div>
                <div>
                  <label>Time</label>
                  <input type="time" value={rqTime} onChange={(e) => setRqTime(e.target.value)} />
                </div>
                <div>
                  <label>Duration (hours)</label>
                  <input type="number" min={1} max={12} value={rqDuration} onChange={(e) => setRqDuration(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label>Notes (optional)</label>
                <textarea rows={3} value={rqNotes} onChange={(e) => setRqNotes(e.target.value)} />
              </div>
              {rqError ? <p style={{ color: "var(--danger)" }}>{rqError}</p> : null}
              {rqOk ? <p style={{ color: "var(--ok)" }}>{rqOk}</p> : null}
              <div className="row" style={{ gap: ".5rem" }}>
                <button className="btn" disabled={rqPending}>{rqPending ? "Sending…" : "Send request"}</button>
                <button type="button" className="btn btn--ghost" onClick={() => setRqOpen(false)}>Close</button>
              </div>
            </form>
          ) : (
            <p>
              <Link className="btn" to="/login" state={{ from: "/browse" }}>
                Log in
              </Link>{" "}
              to send a request.
            </p>
          )}
        </div>
      )}

      {/* Results */}
      <section className="grid grid--3">
        {rows.map((s) => (
          <div key={s.id} className="card">
            {s.photos?.[0] ? (
              <img
                src={s.photos[0]}
                alt={s.name}
                style={{
                  width: "100%",
                  height: 160,
                  objectFit: "cover",
                  borderRadius: ".6rem",
                }}
              />
            ) : null}
            <h3 style={{ marginTop: ".6rem" }}>{s.name}</h3>
            <p className="muted">
              {s.category} • {s.city}
            </p>
            <p>CAD ${s.pricePerHour}/hr</p>
            <p className="muted">
              ⭐ {s.rating?.toFixed?.(1) ?? "0.0"} ({s.ratingCount ?? 0})
            </p>
            <div className="row" style={{ gap: ".5rem" }}>
              <Link className="btn" to={`/service/${s.id}`}>
                View
              </Link>
              {user ? (
                <Link className="btn btn--ghost" to={`/service/${s.id}?book=1`}>
                  Request booking
                </Link>
              ) : (
                <Link
                  className="btn btn--ghost"
                  to="/login"
                  state={{ from: `/service/${s.id}?book=1` }}
                >
                  Request booking
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

// import { Link } from "react-router-dom";

// export function BrowseServicesPage() {
//   // We’ll replace with Firestore-driven list in the next phases
//   const mock = [
//     { id: "svc-1", name: "Plumbing Pro", city: "Edmonton" },
//     { id: "svc-2", name: "Spark Electric", city: "Calgary" },
//     { id: "svc-3", name: "Ace Cleaning", city: "Red Deer" },
//   ];

//   return (
//     <section className="grid grid--3">
//       {mock.map((s) => (
//         <div key={s.id} className="card">
//           <h3>{s.name}</h3>
//           <p className="muted">{s.city}</p>
//           <Link className="btn" to={`/service/${s.id}`}>
//             View
//           </Link>
//         </div>
//       ))}
//     </section>
//   );
// }
