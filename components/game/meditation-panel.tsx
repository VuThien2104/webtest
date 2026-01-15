"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { UserCultivation, UserMethod, Realm } from "@/lib/game-types"

interface MeditationPanelProps {
  cultivation: UserCultivation
  activeMethod: UserMethod | null
  currentRealm: Realm | undefined
  nextRealm: Realm | undefined
  onUpdate: () => void
}

export function MeditationPanel({
  cultivation,
  activeMethod,
  currentRealm,
  nextRealm,
  onUpdate,
}: MeditationPanelProps) {
  const [isMeditating, setIsMeditating] = useState(cultivation.is_meditating)
  const [spiritPower, setSpiritPower] = useState(cultivation.spirit_power)
  const [spiritStones, setSpiritStones] = useState(cultivation.spirit_stones)
  const [meditationLog, setMeditationLog] = useState<string[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const spiritPowerRef = useRef(spiritPower)
  const spiritStonesRef = useRef(spiritStones)
  const isMeditatingRef = useRef(isMeditating)

  const activeMethodRef = useRef(activeMethod)

  useEffect(() => {
    activeMethodRef.current = activeMethod
  }, [activeMethod])

  useEffect(() => {
    spiritPowerRef.current = spiritPower
    spiritStonesRef.current = spiritStones
    isMeditatingRef.current = isMeditating
  }, [spiritPower, spiritStones, isMeditating])

  const saveProgress = useCallback(async () => {
    const supabase = createClient()
    await supabase
      .from("user_cultivation")
      .update({
        spirit_power: spiritPowerRef.current,
        spirit_stones: spiritStonesRef.current,
        is_meditating: isMeditatingRef.current,
        last_meditation_time: new Date().toISOString(),
      })
      .eq("user_id", cultivation.user_id)
  }, [cultivation.user_id])

  useEffect(() => {
    if (isMeditating) {
      saveIntervalRef.current = setInterval(() => {
        saveProgress()
      }, 5000)
    } else {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
        saveIntervalRef.current = null
      }
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [isMeditating, saveProgress])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isMeditatingRef.current) {
        // Use sendBeacon for reliable save on page unload
        const supabase = createClient()
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_cultivation?user_id=eq.${cultivation.user_id}`,
          JSON.stringify({
            spirit_power: spiritPowerRef.current,
            spirit_stones: spiritStonesRef.current,
            is_meditating: false,
            last_meditation_time: new Date().toISOString(),
          }),
        )
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isMeditatingRef.current) {
        saveProgress()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [cultivation.user_id, saveProgress])

  // Tính toán tốc độ tu luyện - sử dụng ref để luôn có giá trị mới nhất
  const calculateSpeed = useCallback(() => {
    const baseSpeed = 10 // 10 linh lực/giây
    const method = activeMethodRef.current
    const methodMultiplier = method?.method?.base_speed_multiplier || 1
    const levelBonus = method ? 1 + (method.current_level - 1) * 0.1 : 1
    return Math.floor(baseSpeed * methodMultiplier * levelBonus)
  }, [])

  // Xử lý thiền định
  const handleMeditation = useCallback(() => {
    const speed = calculateSpeed()
    const stoneChance = Math.random()

    setSpiritPower((prev) => prev + speed)

    // 5% cơ hội nhận linh thạch mỗi giây
    if (stoneChance < 0.05) {
      const stonesGained = Math.floor(Math.random() * 5) + 1
      setSpiritStones((prev) => prev + stonesGained)
      setMeditationLog((prev) => [`+${stonesGained} linh thạch`, ...prev.slice(0, 4)])
    }
  }, [calculateSpeed])

  // Bắt đầu/dừng thiền định
  const toggleMeditation = async () => {
    const supabase = createClient()
    const newState = !isMeditating

    setIsMeditating(newState)

    await supabase
      .from("user_cultivation")
      .update({
        spirit_power: spiritPower,
        spirit_stones: spiritStones,
        is_meditating: newState,
        last_meditation_time: new Date().toISOString(),
      })
      .eq("user_id", cultivation.user_id)

    if (newState) {
      setMeditationLog(["Bắt đầu thiền định..."])
    } else {
      setMeditationLog((prev) => ["Kết thúc thiền định.", ...prev.slice(0, 4)])
      onUpdate()
    }
  }

  // Effect cho thiền định
  useEffect(() => {
    if (isMeditating) {
      intervalRef.current = setInterval(handleMeditation, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isMeditating, handleMeditation])

  // Sync state khi props thay đổi
  useEffect(() => {
    setSpiritPower(cultivation.spirit_power)
    setSpiritStones(cultivation.spirit_stones)
  }, [cultivation.spirit_power, cultivation.spirit_stones])

  const displaySpeed = (() => {
    const baseSpeed = 10
    const methodMultiplier = activeMethod?.method?.base_speed_multiplier || 1
    const levelBonus = activeMethod ? 1 + (activeMethod.current_level - 1) * 0.1 : 1
    return Math.floor(baseSpeed * methodMultiplier * levelBonus)
  })()

  // Tính % tiến độ đột phá
  const progressPercent = nextRealm ? Math.min(100, (spiritPower / nextRealm.spirit_power_required) * 100) : 100

  return (
    <div className="space-y-6 border border-border p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Trạng thái tu luyện</h2>
        <div className="text-sm text-muted-foreground">
          Cảnh giới: {currentRealm?.name || "Không xác định"} - Tầng {cultivation.current_level}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Linh lực:</span>
          <span className="font-mono">{spiritPower.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Linh thạch:</span>
          <span className="font-mono">{spiritStones.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Tốc độ tu luyện:</span>
          <span className="font-mono">{displaySpeed}/giây</span>
        </div>
        {activeMethod && (
          <div className="flex justify-between">
            <span>Công pháp:</span>
            <span className="font-mono">
              {activeMethod.method?.name} (Tầng {activeMethod.current_level})
            </span>
          </div>
        )}
        {nextRealm && (
          <div className="flex justify-between">
            <span>Tiến độ đột phá:</span>
            <span className="font-mono">{progressPercent.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Progress bar đơn giản bằng text */}
      {nextRealm && (
        <div className="text-xs font-mono">
          [{"=".repeat(Math.floor(progressPercent / 5))}
          {"-".repeat(20 - Math.floor(progressPercent / 5))}] {spiritPower.toLocaleString()}/
          {nextRealm.spirit_power_required.toLocaleString()}
        </div>
      )}

      <Button onClick={toggleMeditation} variant={isMeditating ? "destructive" : "default"} className="w-full">
        {isMeditating ? "Xuất định" : "Thiền định"}
      </Button>

      {/* Log thiền định */}
      {meditationLog.length > 0 && (
        <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-4">
          {meditationLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  )
}
