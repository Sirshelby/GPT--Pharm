import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router";

import { Logo } from "../components/Logo.jsx";
import { supabase } from "../lib/supabase.js";
import { useStaff } from "./session.jsx";

const SECTIONS = [
  { to: "/staff/prescriptions", label: "Prescriptions", countKey: "prescriptions" },
  { to: "/staff/enquiries", label: "Messages", countKey: "enquiries" },
  { to: "/staff/signups", label: "Opening list" },
  { to: "/staff/products", label: "Products" },
];

// How often the "new" counts in the menu refresh, in milliseconds
const COUNT_REFRESH = 60_000;

export default function StaffLayout() {
  const { loading, session, member, signOut } = useStaff();
  const location = useLocation();
  const [counts, setCounts] = useState({});

  const refreshCounts = useCallback(async () => {
    const [prescriptions, enquiries] = await Promise.all([
      supabase.from("prescription_requests").select("id", { count: "exact", head: true }).eq("status", "received"),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);
    setCounts({ prescriptions: prescriptions.count ?? 0, enquiries: enquiries.count ?? 0 });
  }, []);

  useEffect(() => {
    if (!member) return;
    refreshCounts();
    const timer = setInterval(refreshCounts, COUNT_REFRESH);
    // Pages call this after changing a status, so the menu stays in step
    window.addEventListener("staff:changed", refreshCounts);
    return () => {
      clearInterval(timer);
      window.removeEventListener("staff:changed", refreshCounts);
    };
  }, [member, refreshCounts]);

  useEffect(() => {
    document.title = "Staff | GPT Pharm & Meds";
  }, [location.pathname]);

  if (!supabase) {
    return (
      <StaffMessage title="The dashboard isn't connected yet">
        Add the Supabase details to the environment variables and redeploy.
      </StaffMessage>
    );
  }

  if (loading) return <div className="staff-loading" aria-busy="true">Loading…</div>;

  if (!session) return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;

  if (!member) {
    return (
      <StaffMessage title="This account isn't set up as staff">
        You're logged in as {session.user.email}, but you're not on the staff list yet. Ask an admin to
        add you.
        <button type="button" className="staff-btn" onClick={signOut}>
          Log out
        </button>
      </StaffMessage>
    );
  }

  return (
    <div className="staff">
      <header className="staff-bar">
        <Link to="/staff" className="staff-bar__brand" aria-label="Staff dashboard home">
          <Logo />
        </Link>
        <nav aria-label="Dashboard" className="staff-bar__nav">
          {SECTIONS.map((section) => (
            <NavLink key={section.to} to={section.to} className="staff-bar__link">
              {section.label}
              {section.countKey && counts[section.countKey] > 0 && (
                <span className="staff-bar__count" aria-label={`${counts[section.countKey]} new`}>
                  {counts[section.countKey]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="staff-bar__user">
          <span>
            {member.full_name}
            <span className="staff-bar__role">{member.role}</span>
          </span>
          <button type="button" className="staff-btn staff-btn--small" onClick={signOut}>
            Log out
          </button>
        </div>
      </header>

      <main id="main" className="staff-main">
        <Outlet />
      </main>
    </div>
  );
}

export function StaffMessage({ title, children }) {
  return (
    <main className="staff-message">
      <Logo />
      <h1>{title}</h1>
      <div className="staff-message__body">{children}</div>
    </main>
  );
}
