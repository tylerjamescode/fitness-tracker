"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn py-2">
      Print
    </button>
  );
}
