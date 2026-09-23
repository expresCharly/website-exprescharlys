import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { readCatalog, root, sqlValue } from './catalog-utils.mjs'

const products = await readCatalog()
if (new Set(products.map(product => product.id)).size !== products.length) throw new Error('Hay identificadores duplicados.')
for (const product of products) {
  if (!product.name || !['abarrotes', 'farmacia', 'restaurante'].includes(product.category) || !Number.isFinite(product.price) || product.price < 0) {
    throw new Error(`Producto inválido: ${product.id}`)
  }
}
const images = JSON.parse(await readFile(new URL('src/data/product-images.json', root), 'utf8'))
const columns = ['id', 'code', 'name', 'category', 'price', 'icon', 'stock', 'department', 'image_url', 'image_source_url', 'image_attribution', 'image_license', 'image_license_url']
const rows = products.map(product => {
  const image = images[product.code]
  return [product.id, product.code, product.name, product.category, product.price, product.icon, product.stock, product.department,
    image?.url, image?.sourceUrl, image?.attribution, image?.license, image?.licenseUrl]
})
const seed = `-- ${products.length} productos. Repetir no sobrescribe los cambios del administrador.\nbegin;\n\n` +
  `insert into public.products (${columns.join(', ')})\nvalues\n` +
  rows.map(row => `  (${row.map(sqlValue).join(', ')})`).join(',\n') +
  '\non conflict (id) do nothing;\n\ncommit;\n'
await mkdir(new URL('supabase/', root), { recursive: true })
await writeFile(new URL('supabase/seed.sql', root), seed)
const schema = await readFile(new URL('supabase/migrations/202609030001_products.sql', root), 'utf8')
await writeFile(new URL('supabase/setup.sql', root), schema + '\n' + seed)
console.log(`Preparado supabase/setup.sql: ${products.length} productos, ${Object.keys(images).length} fotos. No se ha modificado ninguna base de datos remota.`)
