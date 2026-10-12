import { useCallback, useEffect, useState } from "react";

import { supabase } from "../lib/supabase.js";
import { TOPICS } from "../lib/enquiries.js";
import { useStaff } from "./session.jsx";
import { ConfirmButton, Empty, FilterTabs, LoadError, StatusBadge } from "./bits.jsx";
import { ENQUIRY_STATUSES, formatDateTime, statusLabel, timeAgo } from "./format.js";

const VIEWS = [
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

const topicLabel = (value) => TOPICS.find((t) => t.value === value)?.label ?? value;

export default function EnquiriesList() {
  const [view, setView] = useState("new");
  const [state, setState] = useState({ status: "loading", rows: [] });
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading" }));
    let query = supabase
      .from("enquiries")
      .select("*, product:products(name, slug)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (view !== "all") query = query.eq("status", view);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      setState({ status: "failed", rows: [] });
    } else {
      setState({ status: "ready", rows: data });
    }
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="staff-head">
        <h1>Messages</h1>
        <button type="button" className="staff-btn staff-btn--small" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="staff-toolbar">
        <FilterTabs label="Show" value={view} onChange={setView} options={VIEWS} />
      </div>

      {state.status === "failed" && <LoadError onRetry={load} />}
      {state.status === "loading" && state.rows.length === 0 && <p className="staff-muted">Loading…</p>}
      {state.status === "ready" && state.rows.length === 0 && (
        <Empty>{view === "new" ? "You're all caught up. No new messages." : "Nothing here."}</Empty>
      )}

      <ul className="messages">
        {state.rows.map((row) => (
          <Enquiry
            key={row.id}
            row={row}
            open={openId === row.id}
            onToggle={() => setOpenId(openId === row.id ? null : row.id)}
            onChanged={() => {
              window.dispatchEvent(new Event("staff:changed"));
              load();
            }}
          />
        ))}
      </ul>
    </>
  );
}

function Enquiry({ row, open, onToggle, onChanged }) {
  const { session, isAdmin } = useStaff();
  const [notes, setNotes] = useState(row.staff_notes ?? "");
  const [problem, setProblem] = useState("");

  async function update(changes) {
    setProblem("");
    const { error } = await supabase.from("enquiries").update(changes).eq("id", row.id);
    if (error) {
      console.error(error);
      setProblem("Couldn't save. Try again.");
    } else {
      onChanged();
    }
  }

  async function remove() {
    const { error } = await supabase.from("enquiries").delete().eq("id", row.id);
    if (error) setProblem("Couldn't delete it. Try again.");
    else onChanged();
  }

  const replyLink = `mailto:${row.email}?subject=${encodeURIComponent("Re: your message to GPT Pharm & Meds")}&body=${encodeURIComponent(
    `Hello ${row.full_name.split(" ")[0]},\n\n\n\n---\nYou wrote:\n${row.message}`
  )}`;

  return (
    <li className={`message${open ? " is-open" : ""}${row.status === "new" ? " is-new" : ""}`}>
      <button type="button" className="message__summary" aria-expanded={open} onClick={onToggle}>
        <span className="message__who">
          {row.full_name}
          <span className="staff-table__sub">{topicLabel(row.topic)}</span>
        </span>
        <span className="message__preview">{row.message}</span>
        <StatusBadge status={row.status} label={statusLabel(ENQUIRY_STATUSES, row.status)} />
        <span className="message__when">{timeAgo(row.created_at)}</span>
      </button>

      {open && (
        <div className="message__body">
          <p className="detail__text">{row.message}</p>
          <dl className="facts facts--inline">
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${row.email}`}>{row.email}</a>
            </dd>
            {row.phone && (
              <>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}>{row.phone}</a>
                </dd>
              </>
            )}
            {row.product && (
              <>
                <dt>About</dt>
                <dd>
                  <a href={`/products?q=${encodeURIComponent(row.product.name)}`} target="_blank" rel="noopener noreferrer">
                    {row.product.name}
                  </a>
                </dd>
              </>
            )}
            <dt>Sent</dt>
            <dd>{formatDateTime(row.created_at)}</dd>
          </dl>

          <label className="staff-field">
            <span>Notes for the team</span>
            <textarea rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div className="staff-form__actions">
            <a href={replyLink} className="staff-btn staff-btn--primary">
              Reply by email
            </a>
            {row.status !== "replied" && (
              <button
                type="button"
                className="staff-btn"
                onClick={() => update({ status: "replied", staff_notes: notes.trim() || null, handled_by: session.user.id })}
              >
                Mark as replied
              </button>
            )}
            {row.status !== "closed" && (
              <button
                type="button"
                className="staff-btn"
                onClick={() => update({ status: "closed", staff_notes: notes.trim() || null, handled_by: session.user.id })}
              >
                Close
              </button>
            )}
            {row.status !== "new" && (
              <button type="button" className="staff-btn" onClick={() => update({ status: "new" })}>
                Mark as new
              </button>
            )}
            {notes !== (row.staff_notes ?? "") && (
              <button type="button" className="staff-btn" onClick={() => update({ staff_notes: notes.trim() || null })}>
                Save notes
              </button>
            )}
          </div>
          {problem && (
            <p role="alert" className="staff-error">
              {problem}
            </p>
          )}
          {isAdmin && (
            <div className="message__danger">
              <ConfirmButton onConfirm={remove}>Delete message</ConfirmButton>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
