import React from "react";
import { logError } from "../services/logger";
import ErrorPage from "../pages/ErrorPage";

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
      return <ErrorPage code={500} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
