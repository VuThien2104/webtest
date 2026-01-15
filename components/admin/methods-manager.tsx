"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CultivationMethod } from "@/lib/game-types"

interface MethodsManagerProps {
  methods: CultivationMethod[]
  onUpdate: () => void
}

const RARITY_OPTIONS = [
  { value: "common", label: "Phàm phẩm" },
  { value: "uncommon", label: "Hạ phẩm" },
  { value: "rare", label: "Trung phẩm" },
  { value: "epic", label: "Thượng phẩm" },
  { value: "legendary", label: "Cực phẩm" },
]

export function MethodsManager({ methods, onUpdate }: MethodsManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_speed_multiplier: 1.0,
    upgrade_cost_base: 100,
    upgrade_cost_multiplier: 1.5,
    max_level: 100,
    rarity: "common",
  })
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      base_speed_multiplier: 1.0,
      upgrade_cost_base: 100,
      upgrade_cost_multiplier: 1.5,
      max_level: 100,
      rarity: "common",
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (method: CultivationMethod) => {
    setFormData({
      name: method.name,
      description: method.description || "",
      base_speed_multiplier: method.base_speed_multiplier,
      upgrade_cost_base: method.upgrade_cost_base,
      upgrade_cost_multiplier: method.upgrade_cost_multiplier,
      max_level: method.max_level,
      rarity: method.rarity,
    })
    setEditingId(method.id)
    setIsAdding(false)
  }

  const saveMethod = async () => {
    setLoading(true)
    const supabase = createClient()

    if (editingId) {
      await supabase.from("cultivation_methods").update(formData).eq("id", editingId)
    } else {
      await supabase.from("cultivation_methods").insert(formData)
    }

    resetForm()
    setLoading(false)
    onUpdate()
  }

  const deleteMethod = async (id: string) => {
    if (!confirm("Xác nhận xóa công pháp này?")) return
    const supabase = createClient()
    await supabase.from("cultivation_methods").delete().eq("id", id)
    onUpdate()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Danh sách công pháp</h2>
        <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          Thêm công pháp
        </Button>
      </div>

      {/* Form thêm/sửa */}
      {(isAdding || editingId) && (
        <div className="border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tên công pháp</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phẩm cấp</Label>
              <select
                className="w-full border border-border p-2 text-sm bg-background"
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
              >
                {RARITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Mô tả</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hệ số tốc độ</Label>
              <Input
                type="number"
                step="0.1"
                min={0.1}
                value={formData.base_speed_multiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    base_speed_multiplier: Number.parseFloat(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tầng tối đa</Label>
              <Input
                type="number"
                min={1}
                value={formData.max_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_level: Number.parseInt(e.target.value) || 100,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Chi phí cơ bản</Label>
              <Input
                type="number"
                min={1}
                value={formData.upgrade_cost_base}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    upgrade_cost_base: Number.parseInt(e.target.value) || 100,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hệ số tăng giá</Label>
              <Input
                type="number"
                step="0.1"
                min={1}
                value={formData.upgrade_cost_multiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    upgrade_cost_multiplier: Number.parseFloat(e.target.value) || 1.5,
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveMethod} disabled={loading}>
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
        {methods.map((method) => (
          <div key={method.id} className="border border-border p-3 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-xs text-muted-foreground">
                  {RARITY_OPTIONS.find((r) => r.value === method.rarity)?.label} | Hệ số: {method.base_speed_multiplier}
                  x | Max: {method.max_level} tầng
                </div>
                <div className="text-xs text-muted-foreground">{method.description}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(method)}>
                  Sửa
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMethod(method.id)}>
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
