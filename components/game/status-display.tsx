"use client"

import type { Profile, UserCultivation, UserMethod, Realm } from "@/lib/game-types"

interface StatusDisplayProps {
  profile: Profile
  cultivation: UserCultivation
  activeMethod: UserMethod | null
  currentRealm: Realm | undefined
}

export function StatusDisplay({ profile, cultivation, activeMethod, currentRealm }: StatusDisplayProps) {
  return (
    <div className="space-y-4 border border-border p-4">
      <h2 className="text-lg font-semibold">Thông tin tu sĩ</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Đạo hiệu:</span>
          <span>{profile.username}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cảnh giới:</span>
          <span>{currentRealm?.name || "Không xác định"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tầng:</span>
          <span>{cultivation.current_level}/9</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Công pháp:</span>
          <span>{activeMethod?.method?.name || "Chưa có"}</span>
        </div>
        {activeMethod && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tầng công pháp:</span>
            <span>
              {activeMethod.current_level}/{activeMethod.method?.max_level}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bonus đột phá:</span>
          <span>+{cultivation.breakthrough_bonus}%</span>
        </div>
      </div>
    </div>
  )
}
