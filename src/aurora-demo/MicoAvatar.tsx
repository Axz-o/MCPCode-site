import { BotAvatar, type BotAvatarState } from 'bot-avatars'

interface Props {
  state: BotAvatarState
  size?: number
  reducedMotion?: boolean
  label?: string
}

export function MicoAvatar({ state, size = 96, reducedMotion = false, label }: Props) {
  const status = state === 'working' ? 'task running' : state === 'sleeping' ? 'sleeping' : 'idle'

  return <BotAvatar
    type="clover"
    state={state}
    size={size}
    color="#F0F0F2"
    ink="#17171B"
    shading="plastic"
    interactive
    paused={reducedMotion}
    className="mico-avatar"
    role="button"
    tabIndex={0}
    aria-label={label ?? `Mico: ${status}. Activate to jump.`}
    title={`Mico · ${status}`}
    onKeyDown={event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.click()
      }
    }}
  />
}
