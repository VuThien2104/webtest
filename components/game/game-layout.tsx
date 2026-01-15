"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { GameState } from "@/lib/game-types"
import { MeditationPanel } from "./meditation-panel"
import { StatusDisplay } from "./status-display"
import { MethodsPanel } from "./methods-panel"
import { BreakthroughPanel } from "./breakthrough-panel"
import { LeaderboardPanel } from "./leaderboard-panel"

type Tab = "meditation" | "methods" | "breakthrough" | "leaderboard"

interface GameLayoutProps {
  initialState: GameState
}

async function fetchGameState(userId: string): Promise<GameState | null> {
  const supabase = createClient()

  const [profileRes, cultivationRes, methodsRes, allMethodsRes, realmsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("user_cultivation").select("*").eq("user_id", userId).single(),
    supabase.from("user_methods").select("*, method:cultivation_methods(*)").eq("user_id", userId),
    supabase.from("cultivation_methods").select("*").order("rarity"),
    supabase.from("realms").select("*").order("order_index"),
  ])

  if (!profileRes.data || !cultivationRes.data) return null

  return {
    profile: profileRes.data,
    cultivation: cultivationRes.data,
    methods: methodsRes.data || [],
    allMethods: allMethodsRes.data || [],
    allRealms: realmsRes.data || [],
  }
}

export function GameLayout({ initialState }: GameLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>("meditation")
  const router = useRouter()

  const { data: gameState, mutate } = useSWR(
    `game-state-${initialState.profile.id}`,
    () => fetchGameState(initialState.profile.id),
    {
      fallbackData: initialState,
      revalidateOnFocus: false,
    },
  )

  // Fallback nếu data null
  const state = gameState || initialState

  const currentRealm = state.allRealms.find((r) => r.id === state.cultivation.realm_id)
  const nextRealm = state.allRealms.find((r) => r.order_index === (currentRealm?.order_index || 0) + 1)
  const activeMethod = state.methods.find((m) => m.is_active) || null

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const refreshGameState = () => {
    mutate()
  }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
        <h1 className="text-xl font-bold">Tu Tiên Giới</h1>
        <div className="flex gap-2">
          {state.profile.is_admin && (
            <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
              Admin
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Status */}
      <StatusDisplay
        profile={state.profile}
        cultivation={state.cultivation}
        activeMethod={activeMethod}
        currentRealm={currentRealm}
      />

      {/* Navigation */}
      <div className="flex gap-2 my-6 border-b border-border pb-4">
        <Button
          variant={activeTab === "meditation" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("meditation")}
        >
          Thiền định
        </Button>
        <Button
          variant={activeTab === "methods" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("methods")}
        >
          Công pháp
        </Button>
        <Button
          variant={activeTab === "breakthrough" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("breakthrough")}
        >
          Đột phá
        </Button>
        <Button
          variant={activeTab === "leaderboard" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("leaderboard")}
        >
          Xếp hạng
        </Button>
      </div>

      {/* Content */}
      {activeTab === "meditation" && (
        <MeditationPanel
          cultivation={state.cultivation}
          activeMethod={activeMethod}
          currentRealm={currentRealm}
          nextRealm={nextRealm}
          onUpdate={refreshGameState}
        />
      )}

      {activeTab === "methods" && (
        <MethodsPanel
          cultivation={state.cultivation}
          userMethods={state.methods}
          allMethods={state.allMethods}
          onUpdate={refreshGameState}
        />
      )}

      {activeTab === "breakthrough" && (
        <BreakthroughPanel
          cultivation={state.cultivation}
          currentRealm={currentRealm}
          nextRealm={nextRealm}
          allRealms={state.allRealms}
          onUpdate={refreshGameState}
        />
      )}

      {activeTab === "leaderboard" && <LeaderboardPanel />}
    </div>
  )
}
