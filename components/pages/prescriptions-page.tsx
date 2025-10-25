"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Trash2 } from "lucide-react"

interface Prescription {
  id: string
  customer_id: string
  doctor_name: string
  doctor_license?: string
  prescription_date: string
  expiry_date?: string
  notes?: string
  user_id?: string
}

export function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Prescription>>({
    customer_id: "",
    doctor_name: "",
    doctor_license: "",
    prescription_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          await fetchData(user.id)
        }
      } catch (error) {
        console.error("[v0] Error getting user:", error)
      }
    }
    getUser()
  }, [])

  const fetchData = async (uid: string) => {
    try {
      setIsLoading(true)
      const [prescriptionsRes, customersRes] = await Promise.all([
        supabase.from("prescriptions").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("customers").select("*").eq("user_id", uid),
      ])

      if (prescriptionsRes.error) throw prescriptionsRes.error
      if (customersRes.error) throw customersRes.error

      setPrescriptions(prescriptionsRes.data || [])
      setCustomers(customersRes.data || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddOrUpdate = async () => {
    if (!formData.customer_id || !formData.doctor_name) {
      alert("Please fill in all required fields")
      return
    }

    if (!userId) {
      alert("User not authenticated")
      return
    }

    try {
      if (editingId) {
        console.log("[v0] Updating prescription:", editingId)
        const { error } = await supabase
          .from("prescriptions")
          .update(formData)
          .eq("id", editingId)
          .eq("user_id", userId)
        if (error) throw error
        setEditingId(null)
      } else {
        console.log("[v0] Inserting new prescription")
        const { error } = await supabase.from("prescriptions").insert([
          {
            ...formData,
            user_id: userId,
          },
        ])
        if (error) throw error
      }

      await fetchData(userId)
      setFormData({
        customer_id: "",
        doctor_name: "",
        doctor_license: "",
        prescription_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setShowForm(false)
      alert("Prescription saved successfully!")
    } catch (error) {
      console.error("[v0] Error saving prescription:", error)
      alert("Error saving prescription")
    }
  }

  const handleEdit = (prescription: Prescription) => {
    setFormData(prescription)
    setEditingId(prescription.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this prescription?")) {
      try {
        if (!userId) return
        const { error } = await supabase.from("prescriptions").delete().eq("id", id).eq("user_id", userId)
        if (error) throw error
        await fetchData(userId)
        alert("Prescription deleted successfully!")
      } catch (error) {
        console.error("[v0] Error deleting prescription:", error)
        alert("Error deleting prescription")
      }
    }
  }

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    return customer ? `${customer.first_name} ${customer.last_name}` : "Unknown"
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading prescriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Prescription Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Track and manage patient prescriptions</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              customer_id: "",
              doctor_name: "",
              doctor_license: "",
              prescription_date: new Date().toISOString().split("T")[0],
              notes: "",
            })
          }}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Add Prescription
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Prescription" : "Add New Prescription"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Customer *</label>
                <select
                  value={formData.customer_id || ""}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {`${customer.first_name} ${customer.last_name}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Doctor Name *</label>
                <Input
                  value={formData.doctor_name || ""}
                  onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                  placeholder="Enter doctor name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Doctor License</label>
                <Input
                  value={formData.doctor_license || ""}
                  onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value })}
                  placeholder="License number"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prescription Date</label>
                <Input
                  type="date"
                  value={formData.prescription_date || ""}
                  onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-6">
              <Button onClick={handleAddOrUpdate} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                {editingId ? "Update Prescription" : "Add Prescription"}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({
                    customer_id: "",
                    doctor_name: "",
                    doctor_license: "",
                    prescription_date: new Date().toISOString().split("T")[0],
                    notes: "",
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
          <CardTitle>Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No prescriptions recorded yet.</div>
            ) : (
              prescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Patient</p>
                          <p className="font-semibold">{getCustomerName(prescription.customer_id)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Doctor</p>
                          <p className="font-semibold">{prescription.doctor_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-semibold">
                            {new Date(prescription.prescription_date).toLocaleDateString()}
                          </p>
                        </div>
                        {prescription.doctor_license && (
                          <div>
                            <p className="text-sm text-muted-foreground">License</p>
                            <p className="font-semibold">{prescription.doctor_license}</p>
                          </div>
                        )}
                      </div>
                      {prescription.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleEdit(prescription)}
                        className="flex-1 md:flex-none p-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 size={16} className="text-blue-600 mx-auto" />
                      </button>
                      <button
                        onClick={() => handleDelete(prescription.id)}
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
