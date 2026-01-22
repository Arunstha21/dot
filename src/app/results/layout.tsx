import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "Tournament Results",
  description: "View live match results, standings, and statistics",
  openGraph: {
    title: "Tournament Results",
    description: "View live match results, standings, and statistics",
    type: "website",
  },
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children
}
