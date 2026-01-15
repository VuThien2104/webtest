"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Profile, UserCultivation, Realm, UserMethod, CultivationMethod } from "@/lib/game-types"

interface UsersManagerProps {
  users: Profile[]
  cultivations: (UserCultivation & { profile?: Profile })[]
  realms: Realm[]
  onUpdate: () => void
}

export function UsersManager({ users, cultivations, realms, onUpdate }: UsersManagerProps) {
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [viewingMethods, setViewingMethods] = useState<string | null>(null)
  const [userMethods, setUserMethods] = useState<(UserMethod & { method?: CultivationMethod })[]>([])
  const [editData, setEditData] = useState({
    realm_id: "",
    current_level: 1,
    spirit_power: 0,
    spirit_stones: 0,
    breakthrough_bonus: 0,
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const getCultivation = (userId: string) => {
    return cultivations.find((c) => c.user_id === userId)
  }

  const getRealm = (realmId: string) => {
    return realms.find((r) => r.id === realmId)
  }

  const startEdit = (userId: string) => {
    const cult = getCultivation(userId)
    if (cult) {
      setEditData({
        realm_id: cult.realm_id,
        current_level: cult.current_level,
        spirit_power: cult.spirit_power,
        spirit_stones: cult.spirit_stones,
        breakthrough_bonus: cult.breakthrough_bonus || 0,
      })
      setEditingUser(userId)
    }
  }

  const saveEdit = async () => {
    if (!editingUser) return
    setLoading(true)

    const supabase = createClient()
    await supabase
      .from("user_cultivation")
      .update({
        realm_id: editData.realm_id,
        current_level: editData.current_level,
        spirit_power: editData.spirit_power,
        spirit_stones: editData.spirit_stones,
        breakthrough_bonus: editData.breakthrough_bonus,
      })
      .eq("user_id", editingUser)

    setEditingUser(null)
    setLoading(false)
    onUpdate()
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient()
    await supabase.from("profiles").update({ is_admin: !currentStatus }).eq("id", userId)
    onUpdate()
  }

  const loadUserMethods = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("user_methods")
      .select("*, method:cultivation_methods(*)")
      .eq("user_id", userId)

    if (data) {
      setUserMethods(data)
      setViewingMethods(userId)
    }
  }

  const updateMethodLevel = async (userMethodId: string, newLevel: number) => {
    const supabase = createClient()
    await supabase
      .from("user_methods")
      .update({ current_level: Math.max(1, Math.min(100, newLevel)) })
      .eq("id", userMethodId)

    if (viewingMethods) {
      loadUserMethods(viewingMethods)
    }
  }

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Danh sách tu sĩ ({users.length})</h2>
      </div>

      <div className="space-y-1">
        <Input placeholder="Tìm kiếm theo tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => {
          const cult = getCultivation(user.id)
          const realm = cult ? getRealm(cult.realm_id) : null
          const isEditing = editingUser === user.id
          const isViewingMethods = viewingMethods === user.id

          return (
            <div key={user.id} className="border border-border p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">
                    {user.username}
                    {user.is_admin && <span className="text-xs ml-2 opacity-60">[Admin]</span>}
                  </div>
                  {cult && !isEditing && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Cảnh giới: {realm?.name} Tầng {cult.current_level}
                      </div>
                      <div>Linh lực: {cult.spirit_power.toLocaleString()}</div>
                      <div>Linh thạch: {cult.spirit_stones.toLocaleString()}</div>
                      <div>Bonus đột phá: +{cult.breakthrough_bonus || 0}%</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" onClick={() => toggleAdmin(user.id, user.is_admin)}>
                    {user.is_admin ? "Hủy Admin" : "Set Admin"}
                  </Button>
                  {cult && !isEditing && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => startEdit(user.id)}>
                        Chỉnh sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => (isViewingMethods ? setViewingMethods(null) : loadUserMethods(user.id))}
                      >
                        {isViewingMethods ? "Đóng công pháp" : "Xem công pháp"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="space-y-3 border-t border-border pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cảnh giới</Label>
                      <select
                        className="w-full border border-border p-2 text-sm bg-background"
                        value={editData.realm_id}
                        onChange={(e) => setEditData({ ...editData, realm_id: e.target.value })}
                      >
                        {realms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tầng (1-9)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={9}
                        value={editData.current_level}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            current_level: Number.parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Linh lực</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editData.spirit_power}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            spirit_power: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Linh thạch</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editData.spirit_stones}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            spirit_stones: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Bonus đột phá (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={editData.breakthrough_bonus}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            breakthrough_bonus: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={loading}>
                      {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>
                      Hủy
                    </Button>
                  </div>
                </div>
              )}

              {isViewingMethods && (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="text-sm font-medium">Công pháp đã học:</div>
                  {userMethods.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Chưa học công pháp nào</div>
                  ) : (
                    <div className="space-y-2">
                      {userMethods.map((um) => (
                        <div key={um.id} className="flex items-center justify-between text-sm border border-border p-2">
                          <div>
                            <span className="font-medium">{um.method?.name}</span>
                            <span className="text-muted-foreground ml-2">
                              (Hệ số: x{um.method?.base_speed_multiplier})
                            </span>
                            {um.is_active && <span className="text-xs ml-2">[Đang dùng]</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">Cấp:</span>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={um.current_level}
                              onChange={(e) => updateMethodLevel(um.id, Number.parseInt(e.target.value) || 1)}
                              className="w-16 h-7 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-muted-foreground py-4">Không tìm thấy tu sĩ nào</div>
        )}
      </div>
    </div>
  )
}
