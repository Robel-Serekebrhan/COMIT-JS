import { Timestamp } from "firebase/firestore";

export type Role = "guest" | "user" | "provider" | "admin";

export type UserDoc = {
  uid: string;
  role: Role;
  displayName?: string;
  email?: string;
  phone?: string;
  city?: string;
  createdAt: Timestamp;
};

export type ServiceDoc = {
  id?: string; // convenience (doc id)
  ownerUid: string; // provider/admin who owns it
  name: string;
  description: string;
  category: string; // e.g., "Plumbing", "Electrical", ...
  city: string; // e.g., "Edmonton"
  pricePerHour: number; // CAD/hour
  photos: string[]; // image URLs
  rating: number; // avg rating (derived)
  ratingCount: number; // count (derived)
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ReviewDoc = {
  id?: string;
  serviceId: string;
  userUid: string;
  userName?: string;
  rating: number; // 1..5
  text: string;
  photos?: string[];
  createdAt: Timestamp;
};

//import { Timestamp } from "firebase/firestore";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type BookingDoc = {
  id?: string;
  serviceId: string;
  serviceName: string;
  providerUid: string; // owner of the service
  userUid: string; // customer
  userName?: string;

  startTime: Timestamp; // UTC start (hour granularity is fine)
  endTime: Timestamp; // start + duration
  durationHours: number;

  priceQuote: number; // CAD total for this booking
  currency: "CAD";

  status: BookingStatus;
  notes?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};
