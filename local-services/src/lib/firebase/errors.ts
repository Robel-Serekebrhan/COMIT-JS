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

