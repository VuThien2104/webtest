"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Profile, Realm, CultivationMethod, UserCultivation } from "@/lib/game-types"
import { UsersManager } from "./users-manager"
import { RealmsManager } from "./realms-manager"
import { MethodsManager } from "./methods-manager"

type AdminTab = "users" | "realms" | "methods"

interface AdminDashboardProps {
  users: Profile[]
  realms: Realm[]
  methods: CultivationMethod[]
  cultivations: (UserCultivation & { profile?: Profile })[]
}

export function AdminDashboard({ users, realms, methods, cultivations }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users")
  const router = useRouter()

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/game")}>
          Quay lại game
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border p-4 text-center">
          <div className="text-2xl font-bold">{users.length}</div>
          <div className="text-sm text-muted-foreground">Tu sĩ</div>
        </div>
        <div className="border border-border p-4 text-center">
          <div className="text-2xl font-bold">{realms.length}</div>
          <div className="text-sm text-muted-foreground">Cảnh giới</div>
        </div>
        <div className="border border-border p-4 text-center">
          <div className="text-2xl font-bold">{methods.length}</div>
          <div className="text-sm text-muted-foreground">Công pháp</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        <Button variant={activeTab === "users" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("users")}>
          Quản lý tu sĩ
        </Button>
        <Button variant={activeTab === "realms" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("realms")}>
          Quản lý cảnh giới
        </Button>
        <Button
          variant={activeTab === "methods" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("methods")}
        >
          Quản lý công pháp
        </Button>
      </div>

      {/* Content */}
      {activeTab === "users" && (
        <UsersManager users={users} cultivations={cultivations} realms={realms} onUpdate={() => router.refresh()} />
      )}
      {activeTab === "realms" && <RealmsManager realms={realms} onUpdate={() => router.refresh()} />}
      {activeTab === "methods" && <MethodsManager methods={methods} onUpdate={() => router.refresh()} />}
    </div>
  )
}
