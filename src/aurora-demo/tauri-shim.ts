import { handleDemoTunnelInvoke } from './api'

export async function getVersion(): Promise<string> {
  return '0.1.0'
}

export async function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return handleDemoTunnelInvoke(cmd, args) as T
}

export function getCurrentWindow() {
  return {
    minimize: async () => {},
    toggleMaximize: async () => {},
    close: async () => {},
    startDragging: async () => {},
  }
}

export async function open(_options?: unknown): Promise<string | null> {
  return 'D:\\Projects\\sample-workspace'
}

export async function openUrl(url: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
