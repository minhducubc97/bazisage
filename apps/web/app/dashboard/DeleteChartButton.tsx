"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteChartButton({ chartId }: { chartId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to /chart/[id] link wrapper
    e.stopPropagation(); // Stop event bubbling
    if (!window.confirm("Are you sure you want to delete this chart?")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chart/${chartId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh(); // Refresh dashboard list
      } else {
        alert("Failed to delete chart.");
      }
    } catch (err) {
      alert("Error deleting chart.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      style={{ 
        background: "transparent",
        color: "var(--text-muted)",
        border: "1px solid var(--bg-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: isDeleting ? 0.5 : 1,
        padding: "0.75rem",
        borderRadius: "var(--radius-md)",
        flexShrink: 0,
        transition: "all 0.2s ease"
      }}
      title="Delete Chart"
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--danger)";
        e.currentTarget.style.borderColor = "var(--danger)";
        e.currentTarget.style.background = "rgba(184, 64, 64, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "var(--bg-border)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {isDeleting ? "..." : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      )}
    </button>
  );
}
