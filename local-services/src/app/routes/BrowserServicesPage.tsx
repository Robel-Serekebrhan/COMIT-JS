import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  const [filter, setFilter] = useState<ListingsFilter>({});
  const [rows, setRows] = useState<any[]>([]);

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
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2>Browse Services</h2>
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
                setFilter((f) => ({ ...f, city: e.target.value || undefined }))
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
        <p className="muted" style={{ marginTop: ".5rem" }}>
          {count} result{count === 1 ? "" : "s"}
        </p>
      </div>

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
            <Link className="btn" to={`/service/${s.id}`}>
              View
            </Link>
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
