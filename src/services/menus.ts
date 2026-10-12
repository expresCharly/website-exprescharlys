const menuSource = import.meta.env.DEV
  ? new URL('/__shared-menus/', window.location.origin).href
  : 'https://raw.githubusercontent.com/expresCharly/restaurant-menus/main/'

export async function readMenus(signal: AbortSignal): Promise<string[]> {
  // La CDN de GitHub puede conservar una lista anterior aunque fetch revalide.
  const listUrl = new URL('index.html', menuSource)
  listUrl.searchParams.set('refresh', Date.now().toString())
  const response = await fetch(listUrl.href, { signal, cache: 'no-store' })
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
