import { useState, useEffect } from "react";
import { Bookmark, BookmarkMinus, BookmarkPlus } from "lucide-react";
import { usersApi } from "../services/api";
import toast from "react-hot-toast";

export function BookmarkButton({ datasetId, initiallyBookmarked = false, onToggle }) {
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBookmarked(initiallyBookmarked);
  }, [initiallyBookmarked]);

  const toggleBookmark = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (bookmarked) {
        await usersApi.bookmarks.remove(datasetId);
        setBookmarked(false);
        toast.success("Bookmark removed");
        onToggle?.(false);
      } else {
        await usersApi.bookmarks.add(datasetId);
        setBookmarked(true);
        toast.success("Bookmark added");
        onToggle?.(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Unable to update bookmark");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={busy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        border: "1px solid var(--gray-200)",
        background: bookmarked ? "var(--green-pale)" : "white",
        color: bookmarked ? "var(--green)" : "var(--gray-700)",
        borderRadius: 10,
        padding: "8px 12px",
        cursor: busy ? "not-allowed" : "pointer",
      }}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {bookmarked ? <BookmarkMinus size={16} /> : <BookmarkPlus size={16} />}
      <span style={{ fontSize: 12, fontWeight: 700 }}>
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </span>
    </button>
  );
}
