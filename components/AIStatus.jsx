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
          ? "Gemini 2.5 Flash key configured. Review every AI suggestion before using it."
          : "No AI key configured. Demo tools still work."
      }
    >
      <Sparkles size={13} />
      {label}
    </span>
  );
}
