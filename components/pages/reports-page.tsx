"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ReportData {
  dailySales: Array<{ date: string; amount: number }>
  topMedicines: Array<{ name: string; quantity: number }>
  inventoryStatus: Array<{ status: string; count: number }>
  monthlyRevenue: number
  totalTransactions: number
}

export function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    dailySales: [],
    topMedicines: [],
    inventoryStatus: [],
    monthlyRevenue: 0,
    totalTransactions: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.log("[v0] No user found")
        return
      }

      console.log("[v0] Fetching reports for user:", user.id)

      const [medicinesRes, salesRes, saleItemsRes] = await Promise.all([
        supabase.from("medicines").select("*").eq("user_id", user.id),
        supabase.from("sales").select("*").eq("user_id", user.id),
        supabase.from("sale_items").select("*").eq("sale_id", "*"),
      ])

      if (medicinesRes.error) {
        console.error("[v0] Medicines error:", medicinesRes.error)
        throw medicinesRes.error
      }
      if (salesRes.error) {
        console.error("[v0] Sales error:", salesRes.error)
        throw salesRes.error
      }

      const medicines = medicinesRes.data || []
      const sales = salesRes.data || []

      const saleIds = sales.map((s) => s.id)
      let saleItems: any[] = []

      if (saleIds.length > 0) {
        const { data: items, error: itemsError } = await supabase.from("sale_items").select("*").in("sale_id", saleIds)

        if (itemsError) {
          console.error("[v0] Sale items error:", itemsError)
        } else {
          saleItems = items || []
        }
      }

      console.log("[v0] Fetched medicines:", medicines.length, "sales:", sales.length, "items:", saleItems.length)

      // Calculate daily sales
      const dailySalesMap: { [key: string]: number } = {}
      sales.forEach((sale: any) => {
        const date = new Date(sale.sale_date).toLocaleDateString()
        dailySalesMap[date] = (dailySalesMap[date] || 0) + sale.total_amount
      })

      const dailySales = Object.entries(dailySalesMap)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7)

      // Calculate top medicines
      const medicineQuantityMap: { [key: string]: number } = {}
      saleItems.forEach((item: any) => {
        const medicine = medicines.find((m: any) => m.id === item.medicine_id)
        if (medicine) {
          medicineQuantityMap[medicine.name] = (medicineQuantityMap[medicine.name] || 0) + item.quantity
        }
      })

      const topMedicines = Object.entries(medicineQuantityMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      // Calculate inventory status
      const lowStock = medicines.filter((m: any) => m.quantity_in_stock < m.reorder_level).length
      const normalStock = medicines.filter(
        (m: any) => m.quantity_in_stock >= m.reorder_level && m.quantity_in_stock < m.reorder_level * 2,
      ).length
      const highStock = medicines.filter((m: any) => m.quantity_in_stock >= m.reorder_level * 2).length

      const inventoryStatus = [
        { status: "Low Stock", count: lowStock },
        { status: "Normal Stock", count: normalStock },
        { status: "High Stock", count: highStock },
      ]

      const monthlyRevenue = sales.reduce((sum: number, sale: any) => sum + sale.total_amount, 0)

      console.log("[v0] Report data calculated successfully")

      setReportData({
        dailySales,
        topMedicines,
        inventoryStatus,
        monthlyRevenue,
        totalTransactions: sales.length,
      })
    } catch (error) {
      console.error("[v0] Error fetching report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ["#ef4444", "#f59e0b", "#10b981"]

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Comprehensive pharmacy analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-2">
                ${reportData.monthlyRevenue.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-2">{reportData.totalTransactions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Daily Sales (Last 7 Days)</CardTitle>
            <CardDescription className="text-xs md:text-sm">Revenue trend</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Top Selling Medicines</CardTitle>
            <CardDescription className="text-xs md:text-sm">Most sold items</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topMedicines}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantity" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Inventory Status Distribution</CardTitle>
            <CardDescription className="text-xs md:text-sm">Stock level breakdown</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.inventoryStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.inventoryStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
