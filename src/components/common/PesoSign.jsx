import React from "react"

export function PesoSign({ className = "size-4", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="4" y1="7" x2="16" y2="7" />
      <line x1="4" y1="11" x2="16" y2="11" />
      <line x1="7" y1="21" x2="7" y2="4" />
      <path d="M7 4h6a4.5 4.5 0 0 1 0 9H7" />
    </svg>
  )
}

export default PesoSign
