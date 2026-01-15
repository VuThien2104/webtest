"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { UserMethod, CultivationMethod, UserCultivation } from "@/lib/game-types"

interface MethodsPanelProps {
  cultivation: UserCultivation
  userMethods: UserMethod[]
  allMethods: CultivationMethod[]
  onUpdate: () => void
}

const RARITY_LABELS: Record<string, string> = {
  common: "Phàm phẩm",
  uncommon: "Hạ phẩm",
  rare: "Trung phẩm",
  epic: "Thượng phẩm",
  legendary: "Cực phẩm",
}

const calculateCurrentSpeed = (method: CultivationMethod, level: number) => {
  return method.base_speed_multiplier * level
}

export function MethodsPanel({ cultivation, userMethods, allMethods, onUpdate }: MethodsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Tính chi phí nâng cấp công pháp
  const calculateUpgradeCost = (method: CultivationMethod, currentLevel: number) => {
    return Math.floor(method.upgrade_cost_base * Math.pow(method.upgrade_cost_multiplier, currentLevel - 1))
  }

  // Tính chi phí mua công pháp
  const calculatePurchaseCost = (method: CultivationMethod) => {
    const rarityMultiplier: Record<string, number> = {
      common: 1,
      uncommon: 5,
      rare: 25,
      epic: 100,
      legendary: 500,
    }
    return method.upgrade_cost_base * (rarityMultiplier[method.rarity] || 1)
  }

  // Mua công pháp mới
  const purchaseMethod = async (method: CultivationMethod) => {
    const cost = calculatePurchaseCost(method)
    if (cultivation.spirit_stones < cost) {
      setMessage("Không đủ linh thạch!")
      return
    }

    setLoading(method.id)
    const supabase = createClient()

    try {
      // Trừ linh thạch
      await supabase
        .from("user_cultivation")
        .update({ spirit_stones: cultivation.spirit_stones - cost })
        .eq("user_id", cultivation.user_id)

      // Thêm công pháp
      await supabase.from("user_methods").insert({
        user_id: cultivation.user_id,
        method_id: method.id,
        current_level: 1,
        is_active: false,
      })

      setMessage(`Đã học được ${method.name}!`)
      onUpdate()
    } catch {
      setMessage("Có lỗi xảy ra!")
    } finally {
      setLoading(null)
    }
  }

  // Nâng cấp công pháp
  const upgradeMethod = async (userMethod: UserMethod) => {
    const method = userMethod.method
    if (!method) return

    if (userMethod.current_level >= method.max_level) {
      setMessage("Công pháp đã đạt tầng tối đa!")
      return
    }

    const cost = calculateUpgradeCost(method, userMethod.current_level)
    if (cultivation.spirit_stones < cost) {
      setMessage("Không đủ linh thạch!")
      return
    }

    setLoading(userMethod.id)
    const supabase = createClient()

    try {
      await supabase
        .from("user_cultivation")
        .update({ spirit_stones: cultivation.spirit_stones - cost })
        .eq("user_id", cultivation.user_id)

      await supabase
        .from("user_methods")
        .update({ current_level: userMethod.current_level + 1 })
        .eq("id", userMethod.id)

      setMessage(`${method.name} đã đạt tầng ${userMethod.current_level + 1}!`)
      onUpdate()
    } catch {
      setMessage("Có lỗi xảy ra!")
    } finally {
      setLoading(null)
    }
  }

  // Kích hoạt công pháp
  const activateMethod = async (userMethod: UserMethod) => {
    setLoading(userMethod.id)
    const supabase = createClient()

    try {
      // Tắt tất cả công pháp khác
      await supabase.from("user_methods").update({ is_active: false }).eq("user_id", cultivation.user_id)

      // Kích hoạt công pháp này
      await supabase.from("user_methods").update({ is_active: true }).eq("id", userMethod.id)

      setMessage(`Đã sử dụng ${userMethod.method?.name}!`)
      onUpdate()
    } catch {
      setMessage("Có lỗi xảy ra!")
    } finally {
      setLoading(null)
    }
  }

  // Công pháp chưa sở hữu
  const unownedMethods = allMethods.filter((m) => !userMethods.some((um) => um.method_id === m.id))

  return (
    <div className="space-y-6">
      {/* Thông báo */}
      {message && <div className="text-sm border border-border p-2 text-center">{message}</div>}

      {/* Linh thạch hiện có */}
      <div className="text-sm border border-border p-3">
        <span className="text-muted-foreground">Linh thạch: </span>
        <span className="font-mono">{cultivation.spirit_stones.toLocaleString()}</span>
      </div>

      {/* Công pháp đã sở hữu */}
      <div className="space-y-4">
        <h3 className="font-semibold border-b border-border pb-2">Công pháp đã học ({userMethods.length})</h3>
        {userMethods.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có công pháp nào</p>
        ) : (
          <div className="space-y-3">
            {userMethods.map((um) => {
              const method = um.method
              if (!method) return null
              const upgradeCost = calculateUpgradeCost(method, um.current_level)
              const canUpgrade = um.current_level < method.max_level
              const currentSpeed = calculateCurrentSpeed(method, um.current_level)

              return (
                <div key={um.id} className="border border-border p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {method.name}
                        {um.is_active && <span className="text-xs ml-2">[Đang dùng]</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {RARITY_LABELS[method.rarity]} | Hệ số gốc: {method.base_speed_multiplier}x
                      </div>
                      <div className="text-sm font-medium mt-1">Tốc độ hiện tại: {currentSpeed}x linh lực/giây</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>
                        Tầng {um.current_level}/{method.max_level}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">{method.description}</div>

                  <div className="flex gap-2">
                    {!um.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateMethod(um)}
                        disabled={loading === um.id}
                      >
                        Sử dụng
                      </Button>
                    )}
                    {canUpgrade && (
                      <Button
                        size="sm"
                        onClick={() => upgradeMethod(um)}
                        disabled={loading === um.id || cultivation.spirit_stones < upgradeCost}
                      >
                        Nâng cấp ({upgradeCost.toLocaleString()} thạch)
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Công pháp có thể mua */}
      {unownedMethods.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold border-b border-border pb-2">Công pháp có thể học ({unownedMethods.length})</h3>
          <div className="space-y-3">
            {unownedMethods.map((method) => {
              const cost = calculatePurchaseCost(method)
              return (
                <div key={method.id} className="border border-border p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {RARITY_LABELS[method.rarity]} | Hệ số: {method.base_speed_multiplier}x
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{cost.toLocaleString()} thạch</div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">{method.description}</div>

                  <Button
                    size="sm"
                    onClick={() => purchaseMethod(method)}
                    disabled={loading === method.id || cultivation.spirit_stones < cost}
                  >
                    {loading === method.id ? "Đang xử lý..." : "Học công pháp"}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
