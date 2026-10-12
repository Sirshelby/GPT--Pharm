import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";

import { Logo } from "../components/Logo.jsx";
import { supabase } from "../lib/supabase.js";
import { useStaff } from "./session.jsx";

export default function LoginPage() {
  const { session, loading } = useStaff();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // login | forgot | sent
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    document.title = "Staff login | GPT Pharm & Meds";
  }, []);

  if (!loading && session) return <Navigate to={location.state?.from ?? "/staff"} replace />;

  async function logIn(event) {
    event.preventDefault();
    setBusy(true);
    setProblem("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setProblem(
        error.status === 400
          ? "That email and password don't match. Check them and try again."
          : "We couldn't log you in just now. Try again in a minute."
      );
    }
  }

  async function sendReset(event) {
    event.preventDefault();
    setBusy(true);
    setProblem("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/staff/set-password`,
    });
    setBusy(false);
    // Say the same thing whether or not the address exists, so this can't be
    // used to find out who works here.
    if (error && error.status !== 400) setProblem("We couldn't send the email just now. Try again in a minute.");
    else setMode("sent");
  }

  return (
    <main className="staff-auth">
      <div className="staff-auth__card">
        <Logo />
        {mode === "sent" ? (
          <>
            <h1>Check your email</h1>
            <p>If {email.trim()} belongs to a staff account, we've sent it a link to choose a new password.</p>
            <button type="button" className="staff-btn" onClick={() => setMode("login")}>
              Back to log in
            </button>
          </>
        ) : (
          <form onSubmit={mode === "login" ? logIn : sendReset} className="staff-form">
            <h1>{mode === "login" ? "Staff log in" : "Reset your password"}</h1>
            <label className="staff-field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            {mode === "login" && (
              <label className="staff-field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            )}
            {problem && (
              <p role="alert" className="staff-error">
                {problem}
              </p>
            )}
            <button type="submit" className="staff-btn staff-btn--primary" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Email me a reset link"}
            </button>
            <button
              type="button"
              className="staff-link"
              onClick={() => {
                setProblem("");
                setMode(mode === "login" ? "forgot" : "login");
              }}
            >
              {mode === "login" ? "Forgot your password?" : "Back to log in"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
