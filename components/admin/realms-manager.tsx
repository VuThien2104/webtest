"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Realm } from "@/lib/game-types"

interface RealmsManagerProps {
  realms: Realm[]
  onUpdate: () => void
}

export function RealmsManager({ realms, onUpdate }: RealmsManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    order_index: realms.length + 1,
    spirit_power_required: 0,
    is_major_realm: true,
  })
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setFormData({
      name: "",
      order_index: realms.length + 1,
      spirit_power_required: 0,
      is_major_realm: true,
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (realm: Realm) => {
    setFormData({
      name: realm.name,
      order_index: realm.order_index,
      spirit_power_required: realm.spirit_power_required,
      is_major_realm: realm.is_major_realm,
    })
    setEditingId(realm.id)
    setIsAdding(false)
  }

  const saveRealm = async () => {
    setLoading(true)
    const supabase = createClient()

    if (editingId) {
      await supabase.from("realms").update(formData).eq("id", editingId)
    } else {
      await supabase.from("realms").insert(formData)
    }

    resetForm()
    setLoading(false)
    onUpdate()
  }

  const deleteRealm = async (id: string) => {
    if (!confirm("Xác nhận xóa cảnh giới này?")) return
    const supabase = createClient()
    await supabase.from("realms").delete().eq("id", id)
    onUpdate()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Danh sách cảnh giới</h2>
        <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          Thêm cảnh giới
        </Button>
      </div>

      {/* Form thêm/sửa */}
      {(isAdding || editingId) && (
        <div className="border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tên cảnh giới</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Luyện Khí"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Thứ tự</Label>
              <Input
                type="number"
                min={1}
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_index: Number.parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Linh lực yêu cầu</Label>
              <Input
                type="number"
                min={0}
                value={formData.spirit_power_required}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    spirit_power_required: Number.parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveRealm} disabled={loading}>
              {loading ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm"}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      <div className="space-y-2">
        {realms.map((realm) => (
          <div key={realm.id} className="border border-border p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">
                {realm.order_index}. {realm.name}
              </div>
              <div className="text-sm text-muted-foreground">
                Yêu cầu: {realm.spirit_power_required.toLocaleString()} linh lực
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(realm)}>
                Sửa
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteRealm(realm.id)}>
                Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
