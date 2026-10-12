import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { supabase } from "../lib/supabase.js";
import { Empty, FilterTabs, LoadError, StatusBadge } from "./bits.jsx";
import { PRESCRIPTION_STATUSES, statusLabel, timeAgo } from "./format.js";

const VIEWS = {
  active: { label: "To do", statuses: ["received", "reviewing", "ready", "out_for_delivery"] },
  received: { label: "New", statuses: ["received"] },
  completed: { label: "Completed", statuses: ["completed"] },
  cancelled: { label: "Cancelled", statuses: ["cancelled"] },
  all: { label: "All", statuses: null },
};

// Only the most recent ones; older requests can still be found by searching.
const PAGE_SIZE = 100;

export default function PrescriptionsList() {
  const [params, setParams] = useSearchParams();
  const view = VIEWS[params.get("view")] ? params.get("view") : "active";
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [state, setState] = useState({ status: "loading", rows: [] });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading" }));
    let query = supabase
      .from("prescription_requests")
      .select("id, reference, kind, full_name, phone, fulfilment, status, created_at")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    const statuses = VIEWS[view].statuses;
    if (statuses) query = query.in("status", statuses);

    // Commas and brackets have meaning in Supabase filters, so drop them
    const q = (params.get("q") ?? "").replace(/[,()%*]/g, " ").trim();
    if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      setState({ status: "failed", rows: [] });
    } else {
      setState({ status: "ready", rows: data });
    }
  }, [view, params]);

  useEffect(() => {
    load();
  }, [load]);

  function changeView(next) {
    const p = new URLSearchParams(params);
    p.set("view", next);
    setParams(p, { replace: true });
  }

  function submitSearch(event) {
    event.preventDefault();
    const p = new URLSearchParams(params);
    if (search.trim()) p.set("q", search.trim());
    else p.delete("q");
    setParams(p, { replace: true });
  }

  return (
    <>
      <div className="staff-head">
        <h1>Prescription requests</h1>
        <button type="button" className="staff-btn staff-btn--small" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="staff-toolbar">
        <FilterTabs
          label="Show"
          value={view}
          onChange={changeView}
          options={Object.entries(VIEWS).map(([value, v]) => ({ value, label: v.label }))}
        />
        <form className="staff-search" onSubmit={submitSearch} role="search">
          <label htmlFor="rx-search" className="visually-hidden">
            Search by reference, name or phone
          </label>
          <input
            id="rx-search"
            type="search"
            placeholder="Reference, name or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="staff-btn staff-btn--small">
            Search
          </button>
        </form>
      </div>

      {state.status === "failed" && <LoadError onRetry={load} />}
      {state.status === "loading" && state.rows.length === 0 && <p className="staff-muted">Loading…</p>}
      {state.status === "ready" && state.rows.length === 0 && (
        <Empty>
          {params.get("q") ? "No requests match that search." : "Nothing here right now. New requests will show up on their own."}
        </Empty>
      )}

      {state.rows.length > 0 && (
        <div className="staff-table-wrap">
          <table className="staff-table staff-table--cards">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Customer</th>
                <th scope="col">Type</th>
                <th scope="col">Getting it by</th>
                <th scope="col">Status</th>
                <th scope="col">Received</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((row) => (
                <tr key={row.id} className={row.status === "received" ? "is-new" : undefined}>
                  <td data-label="Reference">
                    <Link to={`/staff/prescriptions/${row.id}`} className="staff-table__link">
                      {row.reference}
                    </Link>
                  </td>
                  <td data-label="Customer">
                    {row.full_name}
                    <span className="staff-table__sub">{row.phone}</span>
                  </td>
                  <td data-label="Type">{row.kind === "new" ? "New prescription" : "Refill"}</td>
                  <td data-label="Getting it by">{row.fulfilment === "delivery" ? "Delivery" : "Pickup"}</td>
                  <td data-label="Status">
                    <StatusBadge status={row.status} label={statusLabel(PRESCRIPTION_STATUSES, row.status)} />
                  </td>
                  <td data-label="Received" title={new Date(row.created_at).toLocaleString()}>{timeAgo(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
