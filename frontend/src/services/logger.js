/**
 * GhanaDataHub frontend logging + Sentry helpers.
 *
 * Notes:
 * - Sentry is initialised only when VITE_SENTRY_DSN is provided.
 * - Breadcrumbs are used for lightweight event logging.
 */

import * as Sentry from "@sentry/react";

/**
 * Initialise Sentry if a DSN is configured.
 * @returns {void}
 */
export default function init() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
  });
}

/**
 * Log an informational breadcrumb.
 * @param {string} event - Event name/category.
 * @param {Record<string, any>} [data={}] - Additional metadata.
 */
export function logInfo(event, data = {}) {
  Sentry.addBreadcrumb({ category: event, data, level: "info" });

  if (import.meta.env.DEV) {
    console.info("[GDH]", event, data);
  }
}

/**
 * Log an error and capture the exception.
 * @param {string} event - Event name/category.
 * @param {unknown} error - Error/exception to capture.
 * @param {Record<string, any>} [data={}] - Additional metadata.
 */
export function logError(event, error, data = {}) {
  Sentry.withScope((scope) => {
    scope.setExtras({ event, ...data });
    Sentry.captureException(error);
  });

  if (import.meta.env.DEV) {
    console.error("[GDH ERROR]", event, error, data);
  }
}

/**
 * Log a user action breadcrumb.
 * @param {string} action - Action identifier/message.
 * @param {Record<string, any>} [data={}] - Additional metadata.
 */
export function logAction(action, data = {}) {
  Sentry.addBreadcrumb({ category: "user_action", message: action, data });
}

/**
 * Set the current authenticated user.
 * @param {string|number|null|undefined} userId - User id.
 * @param {string|null|undefined} email - User email.
 */
export function setUser(userId, email) {
  Sentry.setUser({ id: userId, email });
}

/**
 * Clear the current authenticated user.
 */
export function clearUser() {
  Sentry.setUser(null);
}
