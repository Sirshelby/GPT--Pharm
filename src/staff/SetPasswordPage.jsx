import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Logo } from "../components/Logo.jsx";
import { supabase } from "../lib/supabase.js";
import { useStaff } from "./session.jsx";

const MIN_LENGTH = 10;

// Where invite and password-reset emails land. Supabase logs the person in
// from the link, then they choose a password here.
export default function SetPasswordPage() {
  const { session, loading } = useStaff();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    document.title = "Choose a password | GPT Pharm & Meds";
  }, []);

  async function save(event) {
    event.preventDefault();
    if (password.length < MIN_LENGTH) return setProblem(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== again) return setProblem("The two passwords don't match.");

    setBusy(true);
    setProblem("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setProblem(error.message || "We couldn't save that password. Try a different one.");
    else navigate("/staff", { replace: true });
  }

  return (
    <main className="staff-auth">
      <div className="staff-auth__card">
        <Logo />
        {loading ? (
          <p aria-busy="true">Checking your link…</p>
        ) : !session ? (
          <>
            <h1>This link has expired</h1>
            <p>Links in invite and reset emails only work once, for a limited time.</p>
            <Link to="/staff/login" className="staff-btn">
              Request a new reset link
            </Link>
          </>
        ) : (
          <form onSubmit={save} className="staff-form">
            <h1>Choose a password</h1>
            <p>For {session.user.email}. Use at least {MIN_LENGTH} characters, ideally a few words strung together.</p>
            <label className="staff-field">
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="staff-field">
              <span>Type it again</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={again}
                onChange={(event) => setAgain(event.target.value)}
              />
            </label>
            {problem && (
              <p role="alert" className="staff-error">
                {problem}
              </p>
            )}
            <button type="submit" className="staff-btn staff-btn--primary" disabled={busy}>
              {busy ? "Saving…" : "Save password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
