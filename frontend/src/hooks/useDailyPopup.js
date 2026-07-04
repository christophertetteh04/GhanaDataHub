import { useEffect, useState } from "react";

const DISMISS_KEY = "gdh_popup_dismissed_date";
const NEVER_KEY = "gdh_popup_never_show";

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function readLocalStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("useDailyPopup: localStorage unavailable", error);
    return null;
  }
}

function writeLocalStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`useDailyPopup: failed to write ${key}`, error);
  }
}

export function useDailyPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const neverShow = readLocalStorage(NEVER_KEY) === "true";
    if (neverShow) {
      setIsVisible(false);
      return;
    }

    const dismissedDate = readLocalStorage(DISMISS_KEY);
    const today = getTodayDateString();
    setIsVisible(dismissedDate !== today);
  }, []);

  const dismiss = () => {
    const today = getTodayDateString();
    writeLocalStorage(DISMISS_KEY, today);
    setIsVisible(false);
  };

  const neverShow = () => {
    writeLocalStorage(NEVER_KEY, "true");
    setIsVisible(false);
  };

  return {
    isVisible,
    dismiss,
    neverShow,
  };
}
