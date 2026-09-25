"use client";
export default function ErrorPage({ reset }) {
  return (
    <div className="empty" role="alert">
      <h2>Something interrupted the workspace</h2>
      <p>Your saved decisions are still in the database.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
