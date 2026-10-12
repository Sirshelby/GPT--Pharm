import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { supabase } from "../lib/supabase.js";
import { useStaff } from "./session.jsx";
import { ConfirmButton, LoadError, StatusBadge } from "./bits.jsx";
import { formatDateTime, PRESCRIPTION_STATUSES, statusLabel, whatsappNumber } from "./format.js";

// Signed links to the prescription photo expire, so a screenshot of the
// dashboard or a forwarded link stops working after a few minutes.
const FILE_LINK_SECONDS = 10 * 60;

export default function PrescriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, isAdmin } = useStaff();
  const [state, setState] = useState({ status: "loading" });
  const [form, setForm] = useState({ status: "", staff_notes: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    const [request, events, team] = await Promise.all([
      supabase.from("prescription_requests").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("prescription_request_events")
        .select("id, status, changed_by, created_at")
        .eq("request_id", id)
        .order("created_at"),
      supabase.from("staff_members").select("user_id, full_name"),
    ]);

    if (request.error || events.error) {
      console.error(request.error ?? events.error);
      setState({ status: "failed" });
      return;
    }
    if (!request.data) {
      setState({ status: "missing" });
      return;
    }

    let fileUrl = null;
    if (request.data.file_path) {
      const { data } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(request.data.file_path, FILE_LINK_SECONDS);
      fileUrl = data?.signedUrl ?? null;
    }

    const names = Object.fromEntries((team.data ?? []).map((m) => [m.user_id, m.full_name]));
    setState({ status: "ready", request: request.data, events: events.data, names, fileUrl });
    setForm({ status: request.data.status, staff_notes: request.data.staff_notes ?? "" });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setSaved("");
    const { error } = await supabase
      .from("prescription_requests")
      .update({ status: form.status, staff_notes: form.staff_notes.trim() || null })
      .eq("id", id);
    setSaving(false);
    if (error) {
      console.error(error);
      setSaved("Couldn't save. Check your connection and try again.");
      return;
    }
    setSaved("Saved");
    window.dispatchEvent(new Event("staff:changed"));
    load();
  }

  async function assignToMe() {
    await supabase.from("prescription_requests").update({ assigned_to: session.user.id }).eq("id", id);
    load();
  }

  async function remove() {
    const { request } = state;
    // File first: if that fails we still have the row pointing at it.
    if (request.file_path) {
      const { error } = await supabase.storage.from("prescriptions").remove([request.file_path]);
      if (error) {
        console.error(error);
        setSaved("Couldn't delete the prescription file. Nothing was removed.");
        return;
      }
    }
    const { error } = await supabase.from("prescription_requests").delete().eq("id", id);
    if (error) {
      console.error(error);
      setSaved("The file was deleted but the request wasn't. Try again.");
      return;
    }
    window.dispatchEvent(new Event("staff:changed"));
    navigate("/staff/prescriptions", { replace: true });
  }

  if (state.status === "loading") return <p className="staff-muted">Loading…</p>;
  if (state.status === "failed") return <LoadError onRetry={load} />;
  if (state.status === "missing")
    return (
      <div className="staff-empty">
        <p>That request doesn't exist, or it's been deleted.</p>
        <Link to="/staff/prescriptions" className="staff-btn">
          Back to requests
        </Link>
      </div>
    );

  const { request: r, events, names, fileUrl } = state;
  const isImage = /\.(jpe?g|png|webp)$/i.test(r.file_path ?? "");

  return (
    <>
      <p className="staff-back">
        <Link to="/staff/prescriptions">← All requests</Link>
      </p>

      <div className="staff-head">
        <h1>
          {r.reference}
          <StatusBadge status={r.status} label={statusLabel(PRESCRIPTION_STATUSES, r.status)} />
        </h1>
        <p className="staff-muted">Received {formatDateTime(r.created_at)}</p>
      </div>

      <div className="detail">
        <div className="detail__main">
          <section className="panel">
            <h2>{r.kind === "new" ? "New prescription" : "Refill request"}</h2>

            {r.file_path &&
              (fileUrl ? (
                isImage ? (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="rx-image">
                    <img src={fileUrl} alt={`Prescription uploaded for ${r.reference}`} />
                    <span>Open full size</span>
                  </a>
                ) : (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="staff-btn">
                    Open the prescription ({r.file_path.split(".").pop().toUpperCase()})
                  </a>
                )
              ) : (
                <p className="staff-error">The prescription file couldn't be loaded. Refresh to try again.</p>
              ))}

            {r.medicines && (
              <>
                <h3>Medicines asked for</h3>
                <p className="detail__text">{r.medicines}</p>
              </>
            )}
            {r.notes && (
              <>
                <h3>Customer's notes</h3>
                <p className="detail__text">{r.notes}</p>
              </>
            )}
          </section>

          <section className="panel">
            <h2>Update</h2>
            <form onSubmit={save} className="staff-form">
              <label className="staff-field">
                <span>Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {PRESCRIPTION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="staff-field">
                <span>Notes for the team</span>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.staff_notes}
                  onChange={(e) => setForm({ ...form, staff_notes: e.target.value })}
                  placeholder="e.g. Called at 2pm, Amlodipine in stock, ₦4,500 agreed"
                />
              </label>
              <div className="staff-form__actions">
                <button type="submit" className="staff-btn staff-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {saved && (
                  <span role="status" className={saved === "Saved" ? "staff-ok" : "staff-error"}>
                    {saved}
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel">
            <h2>Customer</h2>
            <dl className="facts">
              <dt>Name</dt>
              <dd>{r.full_name}</dd>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a>
                {" · "}
                <a href={`https://wa.me/${whatsappNumber(r.phone)}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </dd>
              {r.email && (
                <>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your request ${r.reference}`)}`}>{r.email}</a>
                  </dd>
                </>
              )}
              <dt>Getting it by</dt>
              <dd>{r.fulfilment === "delivery" ? "Delivery" : "Collecting in store"}</dd>
              {r.delivery_address && (
                <>
                  <dt>Deliver to</dt>
                  <dd className="detail__text">{r.delivery_address}</dd>
                </>
              )}
              <dt>Consent given</dt>
              <dd>{formatDateTime(r.consented_at)}</dd>
              <dt>Handled by</dt>
              <dd>
                {r.assigned_to ? names[r.assigned_to] ?? "A former staff member" : "Nobody yet"}
                {r.assigned_to !== session.user.id && (
                  <button type="button" className="staff-link" onClick={assignToMe}>
                    Take this one
                  </button>
                )}
              </dd>
            </dl>
          </section>

          <section className="panel">
            <h2>History</h2>
            <ol className="timeline">
              {events.map((e) => (
                <li key={e.id}>
                  <strong>{statusLabel(PRESCRIPTION_STATUSES, e.status)}</strong>
                  <span>
                    {formatDateTime(e.created_at)}
                    {e.changed_by ? ` by ${names[e.changed_by] ?? "a former staff member"}` : " (sent by customer)"}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {isAdmin && (
            <section className="panel panel--danger">
              <h2>Delete</h2>
              <p className="staff-muted">
                For data-deletion requests from the customer. Removes the request, its history and the
                prescription file for good.
              </p>
              <ConfirmButton onConfirm={remove}>Delete this request</ConfirmButton>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
