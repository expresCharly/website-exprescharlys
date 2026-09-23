import { readFile } from 'node:fs/promises'

export const root = new URL('../', import.meta.url)

export async function readCatalog() {
  const source = await readFile(new URL('src/data/catalog.ts', root), 'utf8')
  const start = source.indexOf(' = {', source.indexOf('export const'))
  if (start < 0) throw new Error('No se encontró el catálogo importado.')
  const imported = JSON.parse(source.slice(start + 3))
  const base = JSON.parse(await readFile(new URL('src/data/base-products.json', root), 'utf8'))
  return Object.entries(imported).flatMap(([category, products]) =>
    products.map(product => ({ ...product, category })),
  ).concat(base)
}

export function normalizeBarcode(code) {
  const digits = String(code ?? '').trim()
  if (!/^\d{8}$|^\d{12,14}$/.test(digits)) return null
  const numbers = [...digits].map(Number)
  const check = numbers.pop()
  const sum = numbers.reverse().reduce((total, n, i) => total + n * (i % 2 === 0 ? 3 : 1), 0)
  if ((10 - sum % 10) % 10 !== check) return null
  return digits.length < 13 ? digits.padStart(13, '0') : digits
}

export function sqlValue(value) {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Número inválido en catálogo.')
    return String(value)
  }
  return "'" + String(value).replaceAll("'", "''") + "'"
}

export function imageMatchIssue(local, remote) {
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const ignored = new Set(['para', 'con', 'sin', 'del', 'las', 'los', 'una', 'por', 'botella', 'bolsa', 'pieza', 'piezas'])
  const tokens = normalize(local.name).match(/[a-z]{3,}/g) ?? []
  const remoteText = normalize([remote.product_name, remote.brands].join(' '))
  const compactRemote = remoteText.replace(/[^a-z0-9]/g, '')
  if (!tokens.some(token => !ignored.has(token) && (remoteText.includes(token) || compactRemote.includes(token)))) return 'Revisar nombre y marca'
  const size = text => {
    const match = normalize(text).match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|litros?|lts?|l|kg|grs?|gramos?|g)\b/)
    if (!match) return null
    const unit = match[2]
    const amount = Number(match[1].replace(',', '.'))
    return { type: /^(ml|cl|l)/.test(unit) ? 'volume' : 'weight', amount: amount * (/^(l(?!m)|kg)/.test(unit) ? 1000 : unit === 'cl' ? 10 : 1) }
  }
  const ownSize = size(local.name)
  const foundSize = size(remote.quantity || remote.product_name)
  if (ownSize && foundSize && (ownSize.type !== foundSize.type || ownSize.amount !== foundSize.amount)) return 'Revisar presentación o tamaño'
  return null
}
