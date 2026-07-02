import React from "react";
import { logError } from "../services/logger";

/**
 * React error boundary for catching render/runtime errors in the component tree.
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logError("react_render_crash", error, {
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{ maxWidth: 520, margin: "72px auto", padding: 24 }}
        >
          <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
          <p>Our team has been notified. Please refresh.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
