"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

interface SaleItem {
  medicine_id: string
  medicine_name: string
  quantity: number
  unit_price: number
  line_total: number
}

interface Sale {
  id: string
  invoice_number: string
  sale_date: string
  customer_id?: string
  total_amount: number
  payment_method: string
  payment_status: string
}

interface Medicine {
  id: string
  name: string
  unit_price: number
  quantity_in_stock: number
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [cartItems, setCartItems] = useState<SaleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await fetchData(user.id)
      }
    }
    getUser()
  }, [])

  const fetchData = async (uid: string) => {
    try {
      setIsLoading(true)
      const [salesRes, medicinesRes] = await Promise.all([
        supabase.from("sales").select("*").eq("user_id", uid).order("sale_date", { ascending: false }),
        supabase.from("medicines").select("*").eq("user_id", uid),
      ])

      if (salesRes.error) throw salesRes.error
      if (medicinesRes.error) throw medicinesRes.error

      setSales(salesRes.data || [])
      setMedicines(medicinesRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Error loading sales data")
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = () => {
    if (!selectedMedicine || quantity <= 0) {
      alert("Please select a medicine and quantity")
      return
    }

    const medicine = medicines.find((m) => m.id === selectedMedicine)
    if (!medicine) return

    if (medicine.quantity_in_stock < quantity) {
      alert("Insufficient stock")
      return
    }

    const existingItem = cartItems.find((item) => item.medicine_id === selectedMedicine)
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.medicine_id === selectedMedicine
            ? {
                ...item,
                quantity: item.quantity + quantity,
                line_total: (item.quantity + quantity) * item.unit_price,
              }
            : item,
        ),
      )
    } else {
      setCartItems([
        ...cartItems,
        {
          medicine_id: selectedMedicine,
          medicine_name: medicine.name,
          quantity,
          unit_price: medicine.unit_price,
          line_total: quantity * medicine.unit_price,
        },
      ])
    }

    setSelectedMedicine("")
    setQuantity(1)
  }

  const removeFromCart = (medicineId: string) => {
    setCartItems(cartItems.filter((item) => item.medicine_id !== medicineId))
  }

  const completeSale = async () => {
    if (cartItems.length === 0) {
      alert("Please add items to cart")
      return
    }

    if (!userId) {
      alert("User not authenticated")
      return
    }

    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + item.line_total, 0)
      const invoiceNumber = `INV-${Date.now()}`

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            invoice_number: invoiceNumber,
            sale_date: new Date().toISOString().split("T")[0],
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: "completed",
            user_id: userId,
          },
        ])
        .select()

      if (saleError) throw saleError

      const saleId = saleData[0].id

      const saleItems = cartItems.map((item) => ({
        sale_id: saleId,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)
      if (itemsError) throw itemsError

      for (const item of cartItems) {
        const medicine = medicines.find((m) => m.id === item.medicine_id)
        if (medicine) {
          await supabase
            .from("medicines")
            .update({ quantity_in_stock: medicine.quantity_in_stock - item.quantity })
            .eq("id", item.medicine_id)
            .eq("user_id", userId)
        }
      }

      await fetchData(userId)
      setCartItems([])
      setPaymentMethod("cash")
      setShowForm(false)
      alert("Sale completed successfully!")
    } catch (error) {
      console.error("Error completing sale:", error)
      alert("Error completing sale")
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.line_total, 0)

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading sales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sales & Billing</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Create and manage sales transactions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          New Sale
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Add Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm font-medium">Medicine</label>
                    <select
                      value={selectedMedicine}
                      onChange={(e) => setSelectedMedicine(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name} (${medicine.unit_price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end md:col-span-2">
                    <Button onClick={addToCart} className="w-full bg-green-600 hover:bg-green-700">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>

              {cartItems.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Cart Items</h3>
                  <div className="space-y-2 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.medicine_id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.medicine_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x ${item.unit_price.toFixed(2)} = ${item.line_total.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.medicine_id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors ml-2 flex-shrink-0"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="text-xl md:text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <Button onClick={completeSale} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Complete Sale
                    </Button>
                    <Button
                      onClick={() => {
                        setShowForm(false)
                        setCartItems([])
                      }}
                      variant="outline"
                      className="flex-1 md:flex-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Invoice</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-right py-3 px-4 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 font-semibold">Payment</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono text-sm">{sale.invoice_number}</td>
                    <td className="py-3 px-4">{new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-semibold">${sale.total_amount.toFixed(2)}</td>
                    <td className="py-3 px-4 capitalize">{sale.payment_method}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        {sale.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{sale.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{new Date(sale.sale_date).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                    {sale.payment_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">${sale.total_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment</p>
                    <p className="font-semibold capitalize">{sale.payment_method}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sales.length === 0 && <div className="text-center py-8 text-muted-foreground">No sales recorded yet.</div>}
        </CardContent>
      </Card>
    </div>
  )
}
