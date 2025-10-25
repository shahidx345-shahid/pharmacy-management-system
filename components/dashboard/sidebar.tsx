"use client"

import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Package, ShoppingCart, Pill, Users, BarChart3, Settings } from "lucide-react"

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  onLogout: () => void
}

export function Sidebar({ currentPage, onPageChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "sales", label: "Sales & Billing", icon: ShoppingCart },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="w-full h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="hidden md:block p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">Rx</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">PharmaCare</h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button onClick={onLogout} variant="outline" className="w-full flex items-center gap-2 bg-transparent">
          <LogOut size={18} />
          Logout
        </Button>
      </div>
    </aside>
  )
}
