// Maps Firebase Auth error codes to user-friendly messages
// Reference: https://firebase.google.com/docs/auth/admin/errors

export function authErrorMessage(code?: string, fallback = "Authentication failed") {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Email/password sign-in is disabled for this project. Enable it in Firebase Console → Authentication → Sign-in method → Email/Password.";
    case "auth/email-already-in-use":
      return "That email is already registered. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/user-not-found":
      return "No account found for that email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    default:
      return fallback;
  }
}

export function firestoreErrorMessage(code?: string, fallback = "Request failed") {
  switch (code) {
    case "permission-denied":
      return "You don't have permission to perform this action. Check Firestore security rules and make sure you're signed in.";
    case "failed-precondition":
      return "This query needs a composite index. Deploy indexes (firebase deploy --only firestore:indexes) and retry.";
    case "unavailable":
      return "Firestore service is temporarily unavailable. Please retry.";
    default:
      return fallback;
  }
}
