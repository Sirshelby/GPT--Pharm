import { useState } from "react";

// Small building blocks used across the dashboard.

export function StatusBadge({ status, label }) {
  return <span className={`status status--${status}`}>{label}</span>;
}

// Deleting is permanent, so it takes two clicks: the first one asks.
// (A browser confirm() box would do, but it blocks the whole page.)
export function ConfirmButton({ children, confirmLabel = "Yes, delete it", onConfirm, disabled }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!asking) {
    return (
      <button type="button" className="staff-btn staff-btn--danger-quiet" onClick={() => setAsking(true)} disabled={disabled}>
        {children}
      </button>
    );
  }

  return (
    <span className="confirm" role="group" aria-label="Are you sure?">
      <span className="confirm__question">Are you sure? This can't be undone.</span>
      <button
        type="button"
        className="staff-btn staff-btn--danger"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setAsking(false);
          }
        }}
      >
        {busy ? "Deleting…" : confirmLabel}
      </button>
      <button type="button" className="staff-btn" onClick={() => setAsking(false)} disabled={busy}>
        Keep it
      </button>
    </span>
  );
}

export function LoadError({ onRetry }) {
  return (
    <div className="staff-empty" role="alert">
      <p>We couldn't load this. Check your connection.</p>
      <button type="button" className="staff-btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="staff-empty">{children}</div>;
}

// Tabs that filter a list, e.g. New / Being checked / Ready
export function FilterTabs({ value, onChange, options, label }) {
  return (
    <div className="filter-tabs" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="filter-tabs__tab"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count != null && <span className="filter-tabs__count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
