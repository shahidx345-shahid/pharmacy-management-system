"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2, Search } from "lucide-react"

interface Medicine {
  id: string
  name: string
  generic_name: string
  manufacturer: string
  quantity_in_stock: number
  unit_price: number
  expiry_date: string
  batch_number: string
  reorder_level: number
  category?: string
}

export function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: "",
    generic_name: "",
    manufacturer: "",
    quantity_in_stock: 0,
    reorder_level: 10,
    unit_price: 0,
    expiry_date: "",
    batch_number: "",
  })

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.error("[v0] Auth error:", authError)
          alert("Authentication error. Please login again.")
          return
        }

        if (user) {
          console.log("[v0] User authenticated:", user.id)
          setUserId(user.id)
          await fetchMedicines(user.id)
        } else {
          console.error("[v0] No user found")
          alert("Please login to continue")
        }
      } catch (error) {
        console.error("[v0] Error getting user:", error)
      }
    }
    getUser()
  }, [])

  const fetchMedicines = async (uid: string) => {
    try {
      setIsLoading(true)
      console.log("[v0] Fetching medicines for user:", uid)

      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Fetch error:", error)
        throw error
      }

      console.log("[v0] Medicines fetched:", data?.length || 0)
      setMedicines(data || [])
    } catch (error) {
      console.error("[v0] Error fetching medicines:", error)
      alert("Error loading medicines")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.generic_name || !formData.manufacturer) {
      alert("Please fill in all required fields")
      return
    }

    if (!userId) {
      alert("User not authenticated")
      return
    }

    try {
      console.log("[v0] Saving medicine:", formData)

      if (editingId) {
        console.log("[v0] Updating medicine:", editingId)
        const { error } = await supabase.from("medicines").update(formData).eq("id", editingId).eq("user_id", userId)

        if (error) {
          console.error("[v0] Update error:", error)
          throw error
        }
        console.log("[v0] Medicine updated successfully")
        setEditingId(null)
      } else {
        console.log("[v0] Inserting new medicine")
        const { error, data } = await supabase.from("medicines").insert([
          {
            ...formData,
            user_id: userId,
          },
        ])

        if (error) {
          console.error("[v0] Insert error:", error)
          throw error
        }
        console.log("[v0] Medicine inserted successfully:", data)
      }

      await fetchMedicines(userId)
      setFormData({
        name: "",
        generic_name: "",
        manufacturer: "",
        quantity_in_stock: 0,
        reorder_level: 10,
        unit_price: 0,
        expiry_date: "",
        batch_number: "",
      })
      setShowForm(false)
      alert("Medicine saved successfully!")
    } catch (error) {
      console.error("[v0] Error saving medicine:", error)
      alert("Error saving medicine. Check console for details.")
    }
  }

  const handleEdit = (medicine: Medicine) => {
    setFormData(medicine)
    setEditingId(medicine.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this medicine?")) {
      try {
        if (!userId) return
        console.log("[v0] Deleting medicine:", id)

        const { error } = await supabase.from("medicines").delete().eq("id", id).eq("user_id", userId)

        if (error) {
          console.error("[v0] Delete error:", error)
          throw error
        }

        console.log("[v0] Medicine deleted successfully")
        await fetchMedicines(userId)
        alert("Medicine deleted successfully!")
      } catch (error) {
        console.error("[v0] Error deleting medicine:", error)
        alert("Error deleting medicine")
      }
    }
  }

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Manage medicines and stock levels</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              name: "",
              generic_name: "",
              manufacturer: "",
              quantity_in_stock: 0,
              reorder_level: 10,
              unit_price: 0,
              expiry_date: "",
              batch_number: "",
            })
          }}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Add Medicine
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Medicine" : "Add New Medicine"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Medicine Name *</label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Aspirin"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Generic Name *</label>
                <Input
                  value={formData.generic_name || ""}
                  onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  placeholder="e.g., Acetylsalicylic Acid"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Manufacturer *</label>
                <Input
                  value={formData.manufacturer || ""}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., Bayer"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  value={formData.quantity_in_stock || 0}
                  onChange={(e) => setFormData({ ...formData, quantity_in_stock: Number.parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reorder Level</label>
                <Input
                  type="number"
                  value={formData.reorder_level || 10}
                  onChange={(e) => setFormData({ ...formData, reorder_level: Number.parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price per Unit</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price || 0}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number.parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiry_date || ""}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Batch Number</label>
                <Input
                  value={formData.batch_number || ""}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="e.g., BATCH123"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-6">
              <Button onClick={handleAddOrUpdate} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                {editingId ? "Update Medicine" : "Add Medicine"}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({
                    name: "",
                    generic_name: "",
                    manufacturer: "",
                    quantity_in_stock: 0,
                    reorder_level: 10,
                    unit_price: 0,
                    expiry_date: "",
                    batch_number: "",
                  })
                }}
                variant="outline"
                className="w-full md:w-auto"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search size={18} className="text-muted-foreground" />
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Medicine Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Generic Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Manufacturer</th>
                  <th className="text-right py-3 px-4 font-semibold">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold">Price</th>
                  <th className="text-left py-3 px-4 font-semibold">Expiry Date</th>
                  <th className="text-center py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((medicine) => {
                  const isLowStock = medicine.quantity_in_stock < medicine.reorder_level
                  const isExpiringSoon =
                    new Date(medicine.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  return (
                    <tr key={medicine.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{medicine.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{medicine.generic_name}</td>
                      <td className="py-3 px-4">{medicine.manufacturer}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${isLowStock ? "text-orange-600" : ""}`}>
                        {medicine.quantity_in_stock}
                      </td>
                      <td className="py-3 px-4 text-right">${medicine.unit_price.toFixed(2)}</td>
                      <td className={`py-3 px-4 ${isExpiringSoon ? "text-red-600 font-semibold" : ""}`}>
                        {new Date(medicine.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(medicine)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Edit2 size={16} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(medicine.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-4">
            {filteredMedicines.map((medicine) => {
              const isLowStock = medicine.quantity_in_stock < medicine.reorder_level
              const isExpiringSoon = new Date(medicine.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              return (
                <div key={medicine.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">{medicine.generic_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(medicine)}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(medicine.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Manufacturer</p>
                      <p className="font-medium">{medicine.manufacturer}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className={`font-medium ${isLowStock ? "text-orange-600" : ""}`}>
                        {medicine.quantity_in_stock}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">${medicine.unit_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiry</p>
                      <p className={`font-medium ${isExpiringSoon ? "text-red-600" : ""}`}>
                        {new Date(medicine.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredMedicines.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No medicines found. Add your first medicine to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
