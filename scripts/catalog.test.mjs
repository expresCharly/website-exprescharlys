import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { readCatalog, normalizeBarcode, imageMatchIssue, sqlValue } from './catalog-utils.mjs'
import { readProductPages } from '../src/services/catalog-query.ts'

const row = index => ({ id: `product-${index}`, name: `Producto ${index}`, category: 'abarrotes', price: '29.50', code: `code-${index}`, stock: null, icon: '🛒' })

function mockClient({ total = 1061, cap = 500, failAt, requests = [] } = {}) {
  return createClient('https://catalog.example.test', 'sb_publishable_test', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      const url = new URL(input)
      const offset = Number(url.searchParams.get('offset') || 0)
      assert.equal(url.searchParams.get('active'), 'eq.true')
      assert.equal(url.searchParams.get('order'), 'id.asc')
      requests.push(offset)
      if (offset === failAt) return new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 })
      const size = Math.min(cap, Number(url.searchParams.get('limit')), total - offset)
      const rows = Array.from({ length: size }, (_, i) => row(offset + i))
      return new Response(JSON.stringify(rows), { status: 200, headers: { 'content-type': 'application/json', 'content-range': `${offset}-${offset + size - 1}/${total}` } })
    } },
  })
}

test('recupera todos los productos, incluso después de las primeras 1,000 filas', async () => {
  const requests = []
  const products = await readProductPages(mockClient({ requests }), new AbortController().signal)
  assert.equal(products.length, 1061)
  assert.equal(products.at(-1).id, 'product-1060')
  assert.equal(products[0].price, 29.5)
  assert.equal(products[0].stock, undefined)
  assert.deepEqual(requests, [0, 500, 1000])
})

test('respeta un límite de servidor menor que el tamaño de página solicitado', async () => {
  const products = await readProductPages(mockClient({ total: 261, cap: 100 }), new AbortController().signal)
  assert.equal(products.length, 261)
})

test('un error a mitad de carga no se presenta como un catálogo completo', async () => {
  await assert.rejects(readProductPages(mockClient({ failAt: 500 }), new AbortController().signal), /No se pudo consultar/)
})

test('un catálogo remoto vacío permanece vacío', async () => {
  assert.deepEqual(await readProductPages(mockClient({ total: 0 }), new AbortController().signal), [])
})

test('conserva los 1,043 importados y los 18 productos preexistentes con ids únicos', async () => {
  const products = await readCatalog()
  assert.equal(products.length, 1061)
  assert.equal(new Set(products.map(p => p.id)).size, products.length)
  assert.equal(products.filter(p => p.code).length, 1043)
  assert.equal(products.find(p => p.id === 'xlsx-2-20804794').price, 47)
  assert.ok(products.every(p => !p.code || typeof p.code === 'string'))
})

test('valida el dígito de control y conserva ceros del código comercial', () => {
  assert.equal(normalizeBarcode('7501055300075'), '7501055300075')
  assert.equal(normalizeBarcode('036000291452'), '0036000291452')
  assert.equal(normalizeBarcode('7501055300076'), null)
  assert.equal(normalizeBarcode('interno-123'), null)
})

test('separa coincidencias de nombre y presentación dudosas', () => {
  assert.equal(imageMatchIssue({ name: 'Coca Cola 355ml' }, { product_name: 'Coca-Cola', quantity: '355 ml' }), null)
  assert.equal(imageMatchIssue({ name: 'Coca Cola 600ml' }, { product_name: 'Coca-Cola', quantity: '355 ml' }), 'Revisar presentación o tamaño')
  assert.equal(imageMatchIssue({ name: 'Leche Lala 1 litro' }, { product_name: 'Leche Lala', quantity: '1000 ml' }), null)
  assert.equal(imageMatchIssue({ name: 'Leche Lala' }, { product_name: 'Galletas Oreo' }), 'Revisar nombre y marca')
})

test('escapa comillas y conserva códigos como texto en el SQL de importación', () => {
  assert.equal(sqlValue("Charly's"), "'Charly''s'")
  assert.equal(sqlValue('00123'), "'00123'")
  assert.equal(sqlValue(null), 'null')
  assert.throws(() => sqlValue(NaN))
})
