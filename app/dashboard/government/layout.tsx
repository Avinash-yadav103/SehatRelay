import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Government Dashboard - CareFolio",
  description: "Government administration dashboard for healthcare system management",
}

export default function GovernmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

