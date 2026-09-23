import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import { readCatalog, root } from './catalog-utils.mjs'

const env = { ...loadEnv('development', fileURLToPath(root), ''), ...process.env }
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Completa VITE_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local para la carga local a Storage.')
if (new URL(url).protocol !== 'https:') throw new Error('Se requiere HTTPS para la carga a Supabase.')
const apply = process.argv.includes('--apply')
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const manifest = JSON.parse(await readFile(new URL('src/data/product-images.json', root), 'utf8'))
const products = (await readCatalog()).filter(product => manifest[product.code])
let uploaded = 0
let preserved = 0
for (const product of products) {
  if (!/^\d+$/.test(product.code)) throw new Error('Código de imagen inválido.')
  const image = manifest[product.code]
  const bytes = await readFile(new URL(`public/product-images/${product.code}.jpg`, root))
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  const path = `${product.code}-${hash}.jpg`
  const { data: current, error: readError } = await client.from('products').select('image_url').eq('id', product.id).single()
  if (readError) throw new Error(`No se pudo consultar ${product.id}. Ejecuta primero supabase/setup.sql.`)
  if (current.image_url && current.image_url !== image.url) { preserved++; continue }
  if (!apply) { uploaded++; continue }
  const { error: uploadError } = await client.storage.from('product-images').upload(path, bytes, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
  if (uploadError && !['Duplicate', 'ResourceAlreadyExists'].includes(uploadError.code) && String(uploadError.statusCode) !== '409') throw new Error(`Falló la carga de ${product.code}: ${uploadError.message}`)
  const { data: { publicUrl } } = client.storage.from('product-images').getPublicUrl(path)
  let update = client.from('products').update({ image_url: publicUrl, image_source_url: image.sourceUrl,
    image_attribution: image.attribution, image_license: image.license, image_license_url: image.licenseUrl }).eq('id', product.id)
  // Preservar una foto cambiada por el administrador mientras se ejecutaba el script.
  update = current.image_url === null ? update.is('image_url', null) : update.eq('image_url', current.image_url)
  const { data: changed, error: updateError } = await update.select('id')
  if (updateError) throw new Error(`La foto se cargó, pero no se pudo vincular a ${product.id}.`)
  if (changed.length) uploaded++; else preserved++
}
console.log(`${apply ? 'Cargadas' : 'Listas para cargar'}: ${uploaded}. Fotos existentes conservadas: ${preserved}.${apply ? '' : ' Ejecuta con --apply para confirmar la carga.'}`)
