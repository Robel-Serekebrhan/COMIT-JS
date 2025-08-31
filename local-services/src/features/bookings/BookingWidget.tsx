// src/features/bookings/BookingWidget.tsx
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { createBookingRequest } from "./api";
import type { ServiceDoc } from "../../types/models";
import { useAuth } from "../../app/providers/AuthProvider";

type Props = { service: ServiceDoc & { id: string } };

export function BookingWidget({ service }: Props) {
  const { user } = useAuth();

  const [date, setDate] = useState<string>(""); // yyyy-mm-dd
  const [time, setTime] = useState<string>("09:00"); // HH:mm
  const [duration, setDuration] = useState<number>(2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const total = useMemo(() => {
    const price = Number(service.pricePerHour ?? 0);
    return Math.max(0, Math.round(price * duration * 100) / 100);
  }, [service.pricePerHour, duration]);

  function toDate(): Date | null {
    if (!date || !time) return null;
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    // Construct local time; Firestore stores UTC
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    return dt;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!user) {
      setError("Please log in to book.");
      return;
    }
    if (!service?.id) {
      setError("Service not found.");
      return;
    }
    const dt = toDate();
    if (!dt) {
      setError("Choose a valid date and time.");
      return;
    }
    if (duration <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    setPending(true);
    try {
      await createBookingRequest({
        serviceId: service.id!,
        serviceName: service.name,
        providerUid: service.ownerUid,
        userUid: user.uid,
        userName: user.displayName ?? "Customer",
        startTime: dt,
        durationHours: duration,
        priceQuote: total,
        notes,
      });
      setOk("Booking requested! We’ll notify you once the provider responds.");
      setNotes("");
    } catch (err: any) {
      setError(err?.message ?? "Could not create booking.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card">
      <h3>Request a Booking</h3>
      <form onSubmit={onSubmit} className="grid" style={{ gap: ".6rem" }}>
        <div className="row">
          <div>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Start time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label>Duration (hours)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div>
            <label>Estimated total</label>
            <input value={`CAD $${total.toFixed(2)}`} readOnly />
          </div>
        </div>

        <div>
          <label>Notes (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the job, access, parking, etc."
          />
        </div>

        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        {ok ? <p style={{ color: "var(--ok)" }}>{ok}</p> : null}
        <button className="btn" disabled={pending || !user}>
          {user
            ? pending
              ? "Requesting…"
              : "Request booking"
            : "Log in to book"}
        </button>
      </form>
    </div>
  );
}
