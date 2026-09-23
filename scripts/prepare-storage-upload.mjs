import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { readCatalog, root, sqlValue } from './catalog-utils.mjs'

const env = loadEnv('development', fileURLToPath(root), '')
const url = new URL(env.VITE_SUPABASE_URL)
if (url.protocol !== 'https:') throw new Error('Configura la URL HTTPS de Supabase.')
const images = JSON.parse(await readFile(new URL('src/data/product-images.json', root), 'utf8'))
const directory = new URL('.cache/storage-upload/', root)
await mkdir(directory, { recursive: true })
const uploads = []
for (const product of await readCatalog()) {
  const image = images[product.code]
  if (!image) continue
  if (!/^\d+$/.test(product.code)) throw new Error('Código de imagen inválido.')
  const source = new URL(`public/product-images/${product.code}.jpg`, root)
  const bytes = await readFile(source)
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  const filename = `${product.code}-${hash}.jpg`
  const target = new URL(filename, directory)
  await copyFile(source, target)
  uploads.push({ id: product.id, localUrl: image.url, publicUrl: `${url.origin}/storage/v1/object/public/product-images/${filename}`, filename, file: fileURLToPath(target) })
}
if (!uploads.length) throw new Error('No hay fotos seleccionadas para subir.')
await writeFile(new URL('files.json', directory), JSON.stringify(uploads, null, 2) + '\n')
const values = uploads.map(file => `(${[file.id, file.localUrl, file.publicUrl].map(sqlValue).join(', ')})`).join(',\n')
const sql = `-- Ejecutar después de subir los archivos a product-images.\nbegin;\nupdate public.products as p\nset image_url = v.public_url\nfrom (values\n${values}\n) as v(id, local_url, public_url)\nwhere p.id = v.id and (p.image_url is null or p.image_url = v.local_url);\ncommit;\n\nselect count(*) as fotos_en_storage from public.products where image_url like ${sqlValue(`${url.origin}/storage/v1/object/public/product-images/%`)};\n`
await writeFile(new URL('supabase/link-images.sql', root), sql)
console.log(`${uploads.length} archivos preparados en .cache/storage-upload y supabase/link-images.sql. No se han hecho cambios remotos.`)
