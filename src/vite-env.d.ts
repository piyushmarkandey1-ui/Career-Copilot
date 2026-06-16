/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Pendo {
  track(eventName: string, properties?: Record<string, string | number | boolean>): void
}

declare const pendo: Pendo | undefined
