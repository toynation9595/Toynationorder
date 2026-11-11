"use client";

/** Submit button that asks for confirmation first. */
export default function ConfirmButton({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <button
      aria-label="Delete"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className="btn px-3 py-1.5 text-red-600 ring-1 ring-red-200 hover:bg-red-50"
    >
      {children}
    </button>
  );
}
