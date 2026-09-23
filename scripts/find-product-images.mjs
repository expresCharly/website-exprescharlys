import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { readCatalog, root, normalizeBarcode, imageMatchIssue } from './catalog-utils.mjs'

const products = await readCatalog()
const limitArg = process.argv.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : 50
if (!(limit > 0)) throw new Error('--limit debe ser positivo.')
const refresh = process.argv.includes('--refresh')
const individual = !process.argv.includes('--batch')
const match = process.argv.find(arg => arg.startsWith('--match='))?.slice(8)
const cacheDir = new URL('.cache/product-images/', root)
const reportDir = new URL('reports/', root)
const imagesDir = new URL('public/product-images/', root)
for (const dir of [cacheDir, reportDir, imagesDir]) await mkdir(dir, { recursive: true })
const headers = { 'User-Agent': 'ExpressCharlysCatalog/1.0 (https://github.com/expresCharly/website-exprescharlys)' }
const cacheFile = new URL('lookup.json', cacheDir)
let cache = {}
try { cache = JSON.parse(await readFile(cacheFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
const selected = products.filter(p => normalizeBarcode(p.code) && (!match || new RegExp(match, 'i').test(p.name))).slice(0, limit)
const codes = [...new Set(selected.map(p => normalizeBarcode(p.code)))].filter(code => refresh || !(code in cache))
let lastRequest = 0

async function fetchChecked(url, allowMissing = false) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000), redirect: 'error' })
    if (response.ok) return response
    if (allowMissing && response.status === 404) return null
    console.log(`Fuente temporalmente no disponible: HTTP ${response.status} (${new URL(url).hostname}), intento ${attempt + 1}/3.`)
    if (![429, 502, 503, 504].includes(response.status)) throw new Error(`HTTP ${response.status}: ${new URL(url).hostname}`)
    await delay(Math.max(Number(response.headers.get('retry-after')) * 1000 || 0, 15000 * (attempt + 1)))
  }
  throw new Error('La fuente está temporalmente ocupada. Vuelve a ejecutar para reanudar.')
}

// Lotes: menos de 10 consultas/minuto. Consultas individuales: menos de 15/minuto.
const batchSize = individual ? 1 : 50
for (let offset = 0; offset < codes.length; offset += batchSize) {
  await delay(Math.max(0, (individual ? 4500 : 6500) - (Date.now() - lastRequest)))
  const batch = codes.slice(offset, offset + batchSize)
  if (individual) {
    const url = new URL(`https://world.openfoodfacts.org/api/v3/product/${batch[0]}.json`)
    url.search = new URLSearchParams({ fields: 'code,product_name,brands,quantity,image_front_url,images' })
    lastRequest = Date.now()
    const response = await fetchChecked(url, true)
    const data = response ? await response.json() : null
    if (data?.product && normalizeBarcode(data.product.code) !== batch[0]) throw new Error('La fuente devolvió otro código.')
    if (data && !data.product && data.result?.id !== 'product_not_found') throw new Error('Respuesta de producto inesperada.')
    cache[batch[0]] = data?.product ?? null
    await writeFile(cacheFile, JSON.stringify(cache, null, 2) + '\n')
    console.log(`Consultados ${offset + 1}/${codes.length} códigos nuevos; ${data?.product?.image_front_url ? 'foto encontrada' : 'sin foto'}.`)
    continue
  }
  const url = new URL('https://world.openfoodfacts.org/api/v2/search')
  url.search = new URLSearchParams({ code: batch.join(','), page_size: '100', fields: 'code,product_name,brands,quantity,image_front_url,images' })
  lastRequest = Date.now()
  const response = await (await fetchChecked(url)).json()
  if (!Array.isArray(response.products) || response.count > 100) throw new Error('Respuesta incompleta de la fuente; se conserva la caché previa.')
  const requested = new Set(batch)
  for (const item of response.products) {
    if (!requested.has(normalizeBarcode(item.code))) throw new Error('La fuente devolvió un código no solicitado.')
  }
  for (const code of batch) cache[code] = null
  for (const item of response.products) cache[normalizeBarcode(item.code)] = item
  await writeFile(cacheFile, JSON.stringify(cache, null, 2) + '\n')
  console.log(`Consultados ${Math.min(offset + 50, codes.length)}/${codes.length} códigos nuevos.`)
}

const manifestFile = new URL('src/data/product-images.json', root)
const manifest = JSON.parse(await readFile(manifestFile, 'utf8'))
const reviews = JSON.parse(await readFile(new URL('src/data/image-review.json', root), 'utf8'))
const report = []
for (const product of products) {
  const normalized = normalizeBarcode(product.code)
  const found = normalized ? cache[normalized] : undefined
  const record = { id: product.id, code: product.code ?? '', name: product.name, category: product.category }
  if (!normalized) { report.push({ ...record, status: 'sin_codigo_comercial_valido' }); continue }
  if (found === undefined) { report.push({ ...record, status: 'pendiente_busqueda' }); continue }
  if (!found?.image_front_url) { report.push({ ...record, status: 'sin_foto_en_fuente' }); continue }
  const imageUrl = new URL(found.image_front_url)
  if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'images.openfoodfacts.org' || !imageUrl.pathname.endsWith('.jpg')) {
    report.push({ ...record, status: 'revisar_url' }); continue
  }
  const review = reviews[product.code]
  const issue = review?.status === 'approved' ? null : review?.status === 'rejected' ? review.reason : imageMatchIssue(product, found)
  const selection = imageUrl.pathname.match(/\/(front_[a-z_-]+)\.\d+\.\d+\.jpg$/)?.[1]
  const original = found.images?.[found.images?.[selection]?.imgid]
  const attribution = `${original?.uploader || 'Open Food Facts contributors'} / Open Food Facts`
  const image = {
    url: `/product-images/${product.code}.jpg`,
    sourceUrl: `https://world.openfoodfacts.org/product/${found.code}`,
    originalUrl: imageUrl.href,
    attribution,
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    sourceName: found.product_name || found.brands || '',
    sourceQuantity: found.quantity || '',
    matchedCode: found.code,
  }
  const file = new URL(`${product.code}.jpg`, imagesDir)
  try {
    let exists = false
    try { await access(file); exists = true } catch { /* Pendiente de descargar. */ }
    if (!exists) {
      const response = await fetchChecked(imageUrl)
      if (!response.headers.get('content-type')?.startsWith('image/jpeg')) throw new Error('La respuesta no es JPEG.')
      const bytes = Buffer.from(await response.arrayBuffer())
      if (bytes.length > 2_000_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Imagen inválida o demasiado grande.')
      await writeFile(file, bytes)
      await delay(150)
    }
    if (!issue && (!manifest[product.code] || manifest[product.code].matchedCode)) manifest[product.code] = image
    if (issue && manifest[product.code]?.matchedCode) delete manifest[product.code]
    report.push({ ...record, status: issue ? 'revisar_coincidencia' : 'foto_asignada', issue, ...image })
  } catch (error) {
    report.push({ ...record, status: 'error_descarga', detail: error.message, ...image })
  }
  if (report.length % 25 === 0) console.log(`Procesados ${report.length}/${products.length} productos.`)
}
await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
await writeFile(new URL('product-images.json', reportDir), JSON.stringify(report, null, 2) + '\n')
const counts = report.reduce((summary, item) => { summary[item.status] = (summary[item.status] || 0) + 1; return summary }, {})
console.log(JSON.stringify({ total: products.length, ...counts }, null, 2))
