"use client"

import React, { useEffect, useState } from "react"
import { BotAvatar, type BotAvatarState } from "bot-avatars"

interface Props {
  state?: BotAvatarState
  size?: number
  className?: string
  label?: string
}

export function MicoMascot({
  state = "default",
  size = 64,
  className = "",
  label = "Mico, your AI companion",
}: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-white/5 border border-white/10 flex items-center justify-center ${className}`}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-white/40 animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <BotAvatar
        type="clover"
        state={state}
        size={size}
        color="#F3F3F6"
        ink="#16161A"
        shading="plastic"
        interactive
        aria-label={label}
        title={label}
      />
    </div>
  )
}
