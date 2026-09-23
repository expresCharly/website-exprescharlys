import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { root, readCatalog } from './catalog-utils.mjs'
import { readProductPages } from '../src/services/catalog-query.ts'

const env = loadEnv('development', fileURLToPath(root), '')
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const products = await readProductPages(client, AbortSignal.timeout(30000))
const original = await readCatalog()
assert.equal(products.length, original.length, 'La cantidad remota difiere del catálogo original.')
const byId = new Map(products.map(product => [product.id, product]))
for (const expected of original) {
  const actual = byId.get(expected.id)
  assert.ok(actual, `Falta ${expected.id}`)
  for (const field of ['name', 'code', 'category', 'price', 'stock', 'department']) {
    assert.equal(actual[field], expected[field], `Diferencia en ${field} de ${expected.id}`)
  }
}
const images = products.filter(product => product.image?.url.startsWith(`${env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/`))
for (const product of images) {
  const response = await fetch(product.image.url, { method: 'HEAD', signal: AbortSignal.timeout(15000) })
  assert.ok(response.ok, `Foto inaccesible: ${product.id}`)
  assert.ok(response.headers.get('content-type')?.startsWith('image/'), `La foto no es una imagen: ${product.id}`)
}
console.log(JSON.stringify({ products: products.length, photosInStorage: images.length,
  categories: products.reduce((counts, product) => { counts[product.category] = (counts[product.category] || 0) + 1; return counts }, {}),
  dataMatchesOriginal: true, publicImagesAccessible: true,
}, null, 2))
