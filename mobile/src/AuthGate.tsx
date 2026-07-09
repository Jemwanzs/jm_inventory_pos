import React, { useState } from "react";
import { Platform } from "react-native";

import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";

function readTokenFromUrl(): string | undefined {
  if (Platform.OS !== "web" || typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("token") ?? undefined;
}

// Switches between Login and Sign-Up (accept-invite) before authentication.
// A `?token=` query param on web (from an emailed invite link) jumps
// straight to Sign-Up with that code pre-filled.
export default function AuthGate() {
  const initialToken = readTokenFromUrl();
  const [view, setView] = useState<"login" | "signup">(initialToken ? "signup" : "login");

  if (view === "signup") {
    return <SignUpScreen initialToken={initialToken} onBackToLogin={() => setView("login")} />;
  }

  return <LoginScreen onGoToSignUp={() => setView("signup")} />;
}
