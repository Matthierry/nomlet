let deferredPrompt: any = null

window.addEventListener("beforeinstallprompt", (e: Event) => {
  e.preventDefault()
  deferredPrompt = e
})

export async function installPWA() {
  if (!deferredPrompt) return false

  deferredPrompt.prompt()

  const result = await deferredPrompt.userChoice
  deferredPrompt = null

  return result?.outcome === "accepted"
}

export function canInstallPWA() {
  return !!deferredPrompt
}