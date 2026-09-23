const menuSource = 'https://raw.githubusercontent.com/expresCharly/restaurant-menus/main/'

export async function readMenus(signal: AbortSignal): Promise<string[]> {
  const response = await fetch(`${menuSource}index.html`, { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error('No se pudo consultar el menú')

  // Leer la lista del proyecto original como texto, sin ejecutar su JavaScript.
  const html = await response.text()
  const list = html.match(/const\s+images\s*=\s*\[([\s\S]*?)\]/)?.[1]
  if (!list) throw new Error('No se encontró la lista de menús')

  const images = Array.from(list.matchAll(/['"](imgs\/[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|avif))['"]/gi), match =>
    new URL(match[1], menuSource).href,
  )
  if (!images.length) throw new Error('La lista de menús está vacía')
  return [...new Set(images)]
}
