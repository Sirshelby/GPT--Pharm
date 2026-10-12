import { Component } from "react";

import { business } from "../content/site.js";

// If something in the page throws, show a calm message with a way to get
// help instead of a blank white screen.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("The page crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="crash">
        <h1>Something went wrong on our side.</h1>
        <p>
          Refreshing the page usually sorts it out.
          {business.email && (
            <>
              {" "}If it keeps happening, email us at <a href={`mailto:${business.email}`}>{business.email}</a>.
            </>
          )}
        </p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Refresh the page
        </button>
      </main>
    );
  }
}
