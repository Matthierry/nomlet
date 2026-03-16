type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

window.addEventListener("beforeinstallprompt", (e: Event) => {
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
})

export async function installPWA() {
  if (!deferredPrompt) return false

  await deferredPrompt.prompt()

  const result = await deferredPrompt.userChoice
  deferredPrompt = null

  return result?.outcome === "accepted"
}

export function canInstallPWA() {
  return !!deferredPrompt
}
