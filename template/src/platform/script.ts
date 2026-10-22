// Portal SDKs are loaded as <script> tags at start-up. Resolves false when the script is missing
// (e.g. /sdk.js under `npm run dev`), blocked or too slow — the platform then works without its SDK.

export function loadScript(src: string, timeout = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    const timer = setTimeout(() => resolve(false), timeout)
    script.src = src
    script.async = true
    script.onload = () => {
      clearTimeout(timer)
      resolve(true)
    }
    script.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }
    document.head.append(script)
  })
}
