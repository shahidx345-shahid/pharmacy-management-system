"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2, Search } from "lucide-react"

interface Customer {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  })

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        await fetchCustomers(user.id)
      }
    }
    getUser()
  }, [])

  const fetchCustomers = async (uid: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
      alert("Error loading customers")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddOrUpdate = async () => {
    if (!formData.first_name || !formData.last_name) {
      alert("Please fill in required fields")
      return
    }

    if (!userId) {
      alert("User not authenticated")
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase.from("customers").update(formData).eq("id", editingId).eq("user_id", userId)
        if (error) throw error
        setEditingId(null)
      } else {
        const { error } = await supabase.from("customers").insert([
          {
            ...formData,
            user_id: userId,
          },
        ])
        if (error) throw error
      }

      await fetchCustomers(userId)
      setFormData({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
      })
      setShowForm(false)
      alert("Customer saved successfully!")
    } catch (error) {
      console.error("Error saving customer:", error)
      alert("Error saving customer")
    }
  }

  const handleEdit = (customer: Customer) => {
    setFormData(customer)
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        if (!userId) return
        const { error } = await supabase.from("customers").delete().eq("id", id).eq("user_id", userId)
        if (error) throw error
        await fetchCustomers(userId)
        alert("Customer deleted successfully!")
      } catch (error) {
        console.error("Error deleting customer:", error)
        alert("Error deleting customer")
      }
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)),
  )

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Manage customer information and profiles</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              first_name: "",
              last_name: "",
              phone: "",
              email: "",
              address: "",
              city: "",
            })
          }}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Add Customer
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Customer" : "Add New Customer"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={formData.first_name || ""}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="First name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={formData.last_name || ""}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Last name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-6">
              <Button onClick={handleAddOrUpdate} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                {editingId ? "Update Customer" : "Add Customer"}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({
                    first_name: "",
                    last_name: "",
                    phone: "",
                    email: "",
                    address: "",
                    city: "",
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
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No customers found.</div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-semibold">{`${customer.first_name} ${customer.last_name}`}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-semibold">{customer.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-semibold text-sm break-all">{customer.email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">City</p>
                          <p className="font-semibold">{customer.city || "N/A"}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-semibold">{customer.address || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="flex-1 md:flex-none p-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 size={16} className="text-blue-600 mx-auto" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="flex-1 md:flex-none p-2 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 size={16} className="text-red-600 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
