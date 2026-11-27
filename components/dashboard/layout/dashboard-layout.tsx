"use client"

import type React from "react"
import { useState } from "react"
import { AuthGuard } from "@/components/dashboard/layout/auth-guard"
import { Sidebar } from "@/components/dashboard/layout/sidebar"
import { Header } from "@/components/dashboard/layout/header"
import { SettingsModal } from "@/components/settings-modal"
import { SOSButton } from "@/components/emergency/sos-button"
import { NotificationsPopup } from "@/components/dashboard/notifications-popup"
import type { UserRole } from "@/lib/auth"
import { Mic, HeartHandshake } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebarItems: {
    title: string
    href: string
    icon: React.ReactNode
  }[]
  footerItems?: {
    title: string
    href: string
    icon: React.ReactNode
    onClick?: () => void
  }[]
  title: string
  user: {
    name: string
    email: string
    image?: string
  }
  notifications?: number
  requiredRole?: UserRole
  accessRequests?: any[]
  recordUpdates?: any[]
  systemNotifications?: any[]
  onApproveAccess?: () => void
  onRejectAccess?: () => void
  onViewRecord?: () => void
  onMarkAllNotificationsRead?: () => void
  onViewAllNotifications?: () => void
}

export function DashboardLayout({
  children,
  sidebarItems,
  footerItems,
  title,
  user,
  notifications,
  requiredRole,
  accessRequests = [],
  recordUpdates = [],
  systemNotifications = [],
  onApproveAccess,
  onRejectAccess,
  onViewRecord,
  onMarkAllNotificationsRead,
  onViewAllNotifications
}: DashboardLayoutProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Find the settings item in the footer items and modify its onClick
  const updatedFooterItems = footerItems?.map((item) => {
    if (item.title === "Settings") {
      return {
        ...item,
        onClick: () => setShowSettingsModal(true),
      }
    }
    return item
  })

  return (
    <AuthGuard requiredRole={requiredRole}>
      <div className="cf-dashboard-shell">
        <Sidebar
          items={[...sidebarItems.filter(item => !["/visits", "/referrals"].includes(item.href)), {title:"Voice visits",href:"/visits",icon:<Mic size={18}/>}, {title:"Referrals",href:"/referrals",icon:<HeartHandshake size={18}/>}]}
          footerItems={updatedFooterItems}
          title="CareFolio"
          logo={
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              CH
            </div>
          }
        />
        <div className="cf-dashboard-content">
          <Header title={title} user={user} notifications={notifications} />
          <div className="flex items-center gap-4">
            <NotificationsPopup
              notificationCount={notifications}
              accessRequests={accessRequests}
              recordUpdates={recordUpdates}
              systemNotifications={systemNotifications}
              onApproveAccess={onApproveAccess}
              onRejectAccess={onRejectAccess}
              onViewRecord={onViewRecord}
              onMarkAllRead={onMarkAllNotificationsRead}
              onViewAll={onViewAllNotifications}
            />
          </div>
          <main className="cf-dashboard-main">{children}</main>
          {/* Add SOS button only for patient role */}
          {user && requiredRole === "patient" && (
            <SOSButton user={user} />
          )}
        </div>
        <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
      </div>
    </AuthGuard>
  )
}

