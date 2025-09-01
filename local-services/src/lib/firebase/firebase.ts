// Import the functions you need from the SDKs you
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// src/lib/firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-1560422RQ8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// Normalize storage bucket config so it works whether the env contains
// a bucket name ("<id>.appspot.com"), a download domain
// ("<id>.firebasestorage.app"), or a gs:// URL.
function normalizeBucketUrl(raw?: string) {
  if (!raw) return undefined as any;
  let bucket = raw.trim();
  // Convert firebasestorage.app domain to appspot.com bucket name
  const m = bucket.match(/^([a-z0-9-]+)\.firebasestorage\.app$/i);
  if (m) bucket = `${m[1]}.appspot.com`;
  // If already gs://, keep
  if (bucket.startsWith("gs://")) return bucket;
  // Otherwise build gs:// URL from bucket name
  return `gs://${bucket}`;
}

export const storage = getStorage(app, normalizeBucketUrl(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET));

// Developer-friendly runtime check: warn if Storage bucket looks unreachable
function runStorageHealthCheck() {
  try {
    const raw = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
    const norm = normalizeBucketUrl(raw);
    // Skip in SSR/non-browser or when bucket is missing
    if (typeof window === "undefined" || !raw) return;
    // Probe a non-existent object; successful connectivity should yield
    // 'storage/object-not-found'. Other codes indicate a misconfiguration.
    const probe = ref(storage, "healthcheck/__does_not_exist__.txt");
    getDownloadURL(probe)
      .then(() => {
        // If this ever resolves, object happened to exist. That's fine.
      })
      .catch((err: any) => {
        const code: string = err?.code ?? "";
        const okCodes = ["storage/object-not-found", "storage/unauthorized"]; // unauthorized can happen due to rules
        if (!okCodes.includes(code)) {
          // eslint-disable-next-line no-console
          console.warn(
            "[Storage check] Potential storage config issue:",
            { code, bucketConfig: raw, normalized: norm }
          );
        }
      });
  } catch {
    // ignore
  }
}

runStorageHealthCheck();
