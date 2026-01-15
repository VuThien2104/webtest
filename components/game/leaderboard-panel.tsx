"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface LeaderboardUser {
  id: string
  username: string
  realm_name: string
  realm_order: number
  current_level: number
  spiritual_power: number
}

export function LeaderboardPanel() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"realm" | "power">("realm")

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    const supabase = createClient()

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, is_admin")
      .eq("is_admin", false)

    if (!profiles || profiles.length === 0) {
      setLoading(false)
      return
    }

    // Lấy cultivation data
    const { data: cultivations, error: cultError } = await supabase
      .from("user_cultivation")
      .select("user_id, realm_id, current_level, spiritual_power")

    // Lấy realms
    const { data: realms, error: realmsError } = await supabase.from("realms").select("id, name, order_index")

    if (!cultivations || !realms) {
      setLoading(false)
      return
    }

    // Merge data
    const leaderboard: LeaderboardUser[] = profiles
      .map((profile) => {
        const cultivation = cultivations.find((c) => c.user_id === profile.id)
        const realm = realms.find((r) => r.id === cultivation?.realm_id)

        if (!cultivation || !realm) return null

        return {
          id: profile.id,
          username: profile.username || "Vô Danh",
          realm_name: realm.name,
          realm_order: realm.order_index,
          current_level: cultivation.current_level,
          spiritual_power: cultivation.spiritual_power,
        }
      })
      .filter((u): u is LeaderboardUser => u !== null)

    setUsers(leaderboard)
    setLoading(false)
  }

  // Sắp xếp theo tiêu chí
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "realm") {
      if (b.realm_order !== a.realm_order) return b.realm_order - a.realm_order
      if (b.current_level !== a.current_level) return b.current_level - a.current_level
      return b.spiritual_power - a.spiritual_power
    } else {
      return b.spiritual_power - a.spiritual_power
    }
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  if (loading) {
    return <div className="text-muted-foreground">Đang tải bảng xếp hạng...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Bảng Xếp Hạng</h2>
        <div className="flex gap-2 text-sm">
          <button
            className={`px-2 py-1 rounded ${sortBy === "realm" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            onClick={() => setSortBy("realm")}
          >
            Cảnh giới
          </button>
          <button
            className={`px-2 py-1 rounded ${sortBy === "power" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            onClick={() => setSortBy("power")}
          >
            Linh lực
          </button>
        </div>
      </div>

      <div className="border border-border rounded">
        <div className="grid grid-cols-12 gap-2 p-2 border-b border-border text-sm text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Đạo danh</div>
          <div className="col-span-4">Cảnh giới</div>
          <div className="col-span-3 text-right">Linh lực</div>
        </div>

        {sortedUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">Chưa có tu sĩ nào</div>
        ) : (
          sortedUsers.map((user, index) => (
            <div
              key={user.id}
              className={`grid grid-cols-12 gap-2 p-2 text-sm ${index % 2 === 0 ? "" : "bg-muted/30"} ${index < 3 ? "font-semibold" : ""}`}
            >
              <div className="col-span-1">{index + 1}</div>
              <div className="col-span-4 truncate">{user.username}</div>
              <div className="col-span-4">
                {user.realm_name} tầng {user.current_level}
              </div>
              <div className="col-span-3 text-right">{formatNumber(user.spiritual_power)}</div>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center">Tổng cộng {users.length} tu sĩ</div>
    </div>
  )
}
