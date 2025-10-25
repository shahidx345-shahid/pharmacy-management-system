"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/dashboard/sidebar"
import { InventoryPage } from "@/components/pages/inventory-page"
import { SalesPage } from "@/components/pages/sales-page"
import { PrescriptionsPage } from "@/components/pages/prescriptions-page"
import { CustomersPage } from "@/components/pages/customers-page"
import { ReportsPage } from "@/components/pages/reports-page"
import { DashboardOverview } from "@/components/pages/dashboard-overview"
import { SettingsPage } from "@/components/pages/settings-page"
import { Menu, X } from "lucide-react"

export function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />
      case "inventory":
        return <InventoryPage />
      case "sales":
        return <SalesPage />
      case "prescriptions":
        return <PrescriptionsPage />
      case "customers":
        return <CustomersPage />
      case "reports":
        return <ReportsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardOverview />
    }
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="ml-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Rx</span>
          </div>
          <span className="font-bold text-sidebar-foreground">PharmaCare</span>
        </div>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`fixed md:relative w-64 h-screen z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar currentPage={currentPage} onPageChange={handlePageChange} onLogout={handleLogout} />
      </div>

      <main className="flex-1 overflow-auto pt-16 md:pt-0">{renderPage()}</main>
    </div>
  )
}
