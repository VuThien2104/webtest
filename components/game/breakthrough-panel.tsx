"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { UserCultivation, Realm } from "@/lib/game-types"

interface BreakthroughPanelProps {
  cultivation: UserCultivation
  currentRealm: Realm | undefined
  nextRealm: Realm | undefined
  allRealms: Realm[]
  onUpdate: () => void
}

export function BreakthroughPanel({
  cultivation,
  currentRealm,
  nextRealm,
  allRealms,
  onUpdate,
}: BreakthroughPanelProps) {
  const [isBreaking, setIsBreaking] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const isMaxLevel = cultivation.current_level >= 9
  const isMaxRealm = !nextRealm && isMaxLevel

  // Tiểu cảnh giới: tầng 1-8 trong cùng đại cảnh giới
  // Đại cảnh giới: từ tầng 9 lên cảnh giới mới
  const isMajorBreakthrough = isMaxLevel && nextRealm

  // Kiểm tra đủ linh lực không
  const requiredPower = isMajorBreakthrough
    ? nextRealm?.spirit_power_required || 0
    : Math.floor((currentRealm?.spirit_power_required || 1000) * (1 + cultivation.current_level * 0.5))

  const hasEnoughPower = cultivation.spirit_power >= requiredPower

  // Tỷ lệ thành công
  const baseSuccessRate = isMajorBreakthrough ? 30 : 100 // Đại cảnh giới 30%, tiểu cảnh giới 100%
  const totalSuccessRate = Math.min(100, baseSuccessRate + cultivation.breakthrough_bonus)

  const attemptBreakthrough = async () => {
    if (!hasEnoughPower) {
      setResult({
        success: false,
        message: "Linh lực không đủ để đột phá!",
      })
      return
    }

    setIsBreaking(true)
    setResult(null)

    // Giả lập thời gian đột phá
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const supabase = createClient()
    const roll = Math.random() * 100
    const success = roll < totalSuccessRate

    if (success) {
      // Đột phá thành công
      if (isMajorBreakthrough && nextRealm) {
        // Lên đại cảnh giới mới
        await supabase
          .from("user_cultivation")
          .update({
            realm_id: nextRealm.id,
            current_level: 1,
            spirit_power: 0,
            breakthrough_bonus: 0, // Reset bonus
          })
          .eq("user_id", cultivation.user_id)

        setResult({
          success: true,
          message: `Chúc mừng! Đột phá thành công lên ${nextRealm.name} Tầng 1!`,
        })
      } else {
        // Lên tiểu cảnh giới
        await supabase
          .from("user_cultivation")
          .update({
            current_level: cultivation.current_level + 1,
            spirit_power: cultivation.spirit_power - requiredPower,
          })
          .eq("user_id", cultivation.user_id)

        setResult({
          success: true,
          message: `Đột phá thành công! Đạt ${currentRealm?.name} Tầng ${cultivation.current_level + 1}!`,
        })
      }
    } else {
      // Đột phá thất bại - chỉ xảy ra với đại cảnh giới
      // Tụt 1 cảnh giới nhưng giữ nguyên đại cảnh giới
      const newLevel = Math.max(1, cultivation.current_level - 1)
      const newBonus = cultivation.breakthrough_bonus + 5

      await supabase
        .from("user_cultivation")
        .update({
          current_level: newLevel,
          breakthrough_bonus: newBonus,
          spirit_power: Math.floor(cultivation.spirit_power * 0.5), // Mất 50% linh lực
        })
        .eq("user_id", cultivation.user_id)

      setResult({
        success: false,
        message: `Đột phá thất bại! Tụt xuống Tầng ${newLevel}. Bonus đột phá +5% (hiện tại: ${newBonus}%)`,
      })
    }

    setIsBreaking(false)
    onUpdate()
  }

  return (
    <div className="space-y-6 border border-border p-4">
      <h2 className="text-lg font-semibold">Đột phá cảnh giới</h2>

      {/* Trạng thái hiện tại */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cảnh giới hiện tại:</span>
          <span>
            {currentRealm?.name} Tầng {cultivation.current_level}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mục tiêu:</span>
          <span>
            {isMaxRealm
              ? "Đã đạt đỉnh phong!"
              : isMajorBreakthrough
                ? `${nextRealm?.name} Tầng 1`
                : `${currentRealm?.name} Tầng ${cultivation.current_level + 1}`}
          </span>
        </div>
      </div>

      {/* Yêu cầu đột phá */}
      {!isMaxRealm && (
        <div className="space-y-2 text-sm border-t border-border pt-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Linh lực cần:</span>
            <span className="font-mono">{requiredPower.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Linh lực hiện có:</span>
            <span className="font-mono">{cultivation.spirit_power.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tỷ lệ thành công:</span>
            <span className="font-mono">{totalSuccessRate.toFixed(0)}%</span>
          </div>
          {isMajorBreakthrough && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bonus tích lũy:</span>
              <span className="font-mono">+{cultivation.breakthrough_bonus}%</span>
            </div>
          )}
        </div>
      )}

      {/* Cảnh báo đại cảnh giới */}
      {isMajorBreakthrough && (
        <div className="text-xs text-muted-foreground border border-border p-2">
          Cảnh báo: Đây là đột phá đại cảnh giới. Thất bại sẽ tụt 1 tầng và mất 50% linh lực, nhưng được cộng 5% tỷ lệ
          thành công cho lần sau.
        </div>
      )}

      {/* Kết quả */}
      {result && (
        <div className={`text-sm border p-3 ${result.success ? "border-border" : "border-destructive"}`}>
          {result.message}
        </div>
      )}

      {/* Progress animation khi đang đột phá */}
      {isBreaking && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">
          Đang đột phá... Thiên địa linh khí đang hội tụ...
        </div>
      )}

      {/* Nút đột phá */}
      {!isMaxRealm && (
        <Button onClick={attemptBreakthrough} disabled={isBreaking || !hasEnoughPower} className="w-full">
          {isBreaking
            ? "Đang đột phá..."
            : !hasEnoughPower
              ? "Linh lực không đủ"
              : isMajorBreakthrough
                ? `Đột phá Đại Cảnh Giới (${totalSuccessRate}%)`
                : "Đột phá Tiểu Cảnh Giới"}
        </Button>
      )}

      {isMaxRealm && (
        <div className="text-center text-sm text-muted-foreground">
          Đạo hữu đã đạt đến đỉnh phong tu luyện - Độ Kiếp Kỳ Tầng 9!
        </div>
      )}

      {/* Danh sách cảnh giới */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-2">Các đại cảnh giới:</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          {allRealms.map((realm) => (
            <div
              key={realm.id}
              className={`flex justify-between ${realm.id === currentRealm?.id ? "text-foreground font-medium" : ""}`}
            >
              <span>
                {realm.id === currentRealm?.id ? "> " : "  "}
                {realm.name}
              </span>
              <span>{realm.spirit_power_required.toLocaleString()} linh lực</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
