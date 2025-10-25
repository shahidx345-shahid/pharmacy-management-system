"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, AlertCircle, TrendingUp, DollarSign } from "lucide-react"

interface Stats {
  totalMedicines: number
  lowStockItems: number
  totalCustomers: number
  totalSales: number
  totalRevenue: number
  expiringItems: number
}

export function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    totalMedicines: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    expiringItems: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          console.log("[v0] No user found")
          return
        }

        console.log("[v0] Fetching stats for user:", user.id)

        const [medicinesRes, salesRes, customersRes] = await Promise.all([
          supabase.from("medicines").select("*").eq("user_id", user.id),
          supabase.from("sales").select("*").eq("user_id", user.id),
          supabase.from("customers").select("*").eq("user_id", user.id),
        ])

        if (medicinesRes.error) throw medicinesRes.error
        if (salesRes.error) throw salesRes.error
        if (customersRes.error) throw customersRes.error

        const medicines = medicinesRes.data || []
        const sales = salesRes.data || []
        const customers = customersRes.data || []

        const lowStockItems = medicines.filter((m: any) => m.quantity_in_stock < m.reorder_level).length
        const today = new Date()
        const expiringItems = medicines.filter((m: any) => {
          const expiry = new Date(m.expiry_date)
          const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0
        }).length

        const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0)

        console.log("[v0] Stats fetched successfully")

        setStats({
          totalMedicines: medicines.length,
          lowStockItems,
          totalCustomers: customers.length,
          totalSales: sales.length,
          totalRevenue,
          expiringItems,
        })
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Medicines",
      value: stats.totalMedicines,
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: AlertCircle,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Sales",
      value: stats.totalSales,
      icon: ShoppingCart,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Expiring Soon",
      value: stats.expiringItems,
      icon: TrendingUp,
      color: "bg-red-100 text-red-600",
    },
  ]

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Welcome to your pharmacy management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-xl md:text-3xl font-bold text-foreground mt-2 truncate">{stat.value}</p>
                  </div>
                  <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${stat.color}`}>
                    <Icon size={20} className="md:w-6 md:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-8">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-xs md:text-sm">Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-2 md:space-y-3">
            <button className="w-full p-2 md:p-3 text-left text-sm md:text-base bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              Add New Medicine
            </button>
            <button className="w-full p-2 md:p-3 text-left text-sm md:text-base bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              Create New Sale
            </button>
            <button className="w-full p-2 md:p-3 text-left text-sm md:text-base bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              Add Customer
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">System Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Current health</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-foreground">Database Status</span>
              <span className="text-xs md:text-sm font-semibold text-green-600">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-foreground">Data Sync</span>
              <span className="text-xs md:text-sm font-semibold text-green-600">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-foreground">Last Updated</span>
              <span className="text-xs md:text-sm font-semibold text-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
