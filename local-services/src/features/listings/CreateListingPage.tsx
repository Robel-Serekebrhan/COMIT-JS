import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { createService } from "./api";

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

export function CreateListingPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [pricePerHour, setPricePerHour] = useState<number>(50);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user)
    return (
      <div className="card">
        <p>Please log in.</p>
      </div>
    );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const id = await createService({
        ownerUid: user!.uid,
        data: { name, description, city, category, pricePerHour, photoFile },
      });
      nav(`/service/${id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create listing");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2>Create Listing</h2>
      <form onSubmit={onSubmit} className="grid" style={{ gap: ".75rem" }}>
        <div className="row">
          <div>
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Price (CAD/hr)</label>
            <input
              type="number"
              min={0}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label>City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Cover photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

        <button className="btn" disabled={pending}>
          {pending ? "Creating…" : "Create listing"}
        </button>
      </form>
    </div>
  );
}
