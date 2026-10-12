import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase.js";
import { useStaff } from "./session.jsx";
import { ConfirmButton, Empty, LoadError } from "./bits.jsx";
import { formatDate } from "./format.js";

export default function SignupsList() {
  const { isAdmin } = useStaff();
  const [state, setState] = useState({ status: "loading", rows: [] });
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    // Supabase returns at most 1,000 rows per request, so page through them.
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("signups")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + 999);
      if (error) {
        console.error(error);
        setState({ status: "failed", rows: [] });
        return;
      }
      rows.push(...data);
      if (data.length < 1000) break;
    }
    setState({ status: "ready", rows });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.rows;
    return state.rows.filter((r) => r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [state.rows, search]);

  async function remove(id) {
    const { error } = await supabase.from("signups").delete().eq("id", id);
    if (error) console.error(error);
    load();
  }

  return (
    <>
      <div className="staff-head">
        <h1>Opening list</h1>
        <p className="staff-muted">
          {state.status === "ready" &&
            (state.rows.length === 1 ? "1 person is waiting to hear from us." : `${state.rows.length} people are waiting to hear from us.`)}
        </p>
      </div>

      <div className="staff-toolbar">
        <div className="staff-search">
          <label htmlFor="signup-search" className="visually-hidden">
            Search by name or email
          </label>
          <input
            id="signup-search"
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="staff-btn staff-btn--primary"
          disabled={!state.rows.length}
          onClick={() => downloadCsv(state.rows)}
        >
          Download as spreadsheet (CSV)
        </button>
      </div>

      {state.status === "failed" && <LoadError onRetry={load} />}
      {state.status === "loading" && <p className="staff-muted">Loading…</p>}
      {state.status === "ready" && shown.length === 0 && (
        <Empty>{search ? "Nobody matches that search." : "Nobody has signed up yet."}</Empty>
      )}

      {shown.length > 0 && (
        <div className="staff-table-wrap">
          <table className="staff-table staff-table--cards">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Signed up</th>
                {isAdmin && (
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id}>
                  <td data-label="Name">{row.full_name}</td>
                  <td data-label="Email">
                    <a href={`mailto:${row.email}`}>{row.email}</a>
                  </td>
                  <td data-label="Signed up">{formatDate(row.created_at)}</td>
                  {isAdmin && (
                    <td className="staff-table__actions">
                      <ConfirmButton onConfirm={() => remove(row.id)} confirmLabel="Remove">
                        Remove
                      </ConfirmButton>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Builds the file in the browser, so the list never leaves the dashboard
// except to the person who clicked the button.
function downloadCsv(rows) {
  // A leading = + - or @ would make Excel treat a name as a formula, which is
  // a known way to sneak commands into a spreadsheet. A leading ' stops that.
  const escape = (value) => {
    const text = String(value).replace(/^([=+\-@\t\r])/, "'$1");
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [
    ["Name", "Email", "Signed up"].join(","),
    ...rows.map((r) => [r.full_name, r.email, r.created_at.slice(0, 10)].map(escape).join(",")),
  ];
  // The byte-order mark makes Excel read names with accents correctly
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `opening-list-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
