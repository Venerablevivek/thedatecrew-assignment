"use client";
import { useEffect, useRef, useId } from "react";
import { X } from "lucide-react";
export default function ToolDialog({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    ref.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`tool-dialog ${wide ? "wide" : ""}`}
      aria-labelledby={id}
      onCancel={onClose}
    >
      <header>
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </header>
      <div className="tool-content">{children}</div>
    </dialog>
  );
}
