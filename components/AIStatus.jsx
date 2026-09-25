"use client";
import { Sparkles } from "lucide-react";
import { useResource } from "./ui";
export default function AIStatus() {
  const { data, error } = useResource("/api/ai/status");
  const label = error
    ? "AI status unavailable"
    : !data
      ? "Checking AI…"
      : data.configured
        ? "Gemini connected"
        : "Demo mode";
  return (
    <span
      className={`provider-pill ${data?.configured ? "ready" : ""}`}
      title={
        data?.configured
          ? `Gemini key configured · ${[data.model, ...(data.fallbacks || [])].join(" → ")}. Review every AI suggestion before using it.`
          : "No AI key configured. Demo tools still work."
      }
    >
      <Sparkles size={13} />
      {label}
    </span>
  );
}
