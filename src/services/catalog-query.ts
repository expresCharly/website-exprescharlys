import type { SupabaseClient } from '@supabase/supabase-js'
import type { CategoryId, Product } from '../types/catalog'

const columns = 'id,code,name,category,price,icon,stock,department,image_url,image_source_url,image_attribution,image_license,image_license_url'
const categoryIds = new Set(['abarrotes', 'farmacia', 'restaurante'])

export async function readProductPages(client: SupabaseClient, signal: AbortSignal): Promise<Product[]> {
  const products: Product[] = []
  // Supabase devuelve como máximo 1,000 filas por defecto; leer todas las páginas.
  for (let offset = 0; ; ) {
    const { data, error, count } = await client.from('products')
      .select(columns, { count: 'exact' })
      .eq('active', true)
      .order('id', { ascending: true })
      .range(offset, offset + 499)
      .abortSignal(signal)
    if (error) throw new Error('No se pudo consultar el catálogo de Supabase.')
    if (!data || count === null) throw new Error('La consulta del catálogo quedó incompleta.')
    if (!data.length && offset < count) throw new Error('La consulta del catálogo quedó incompleta.')
    for (const row of data) {
      if (!categoryIds.has(row.category) || typeof row.id !== 'string' || typeof row.name !== 'string' || !Number.isFinite(Number(row.price))) {
        throw new Error('Hay un producto con datos inválidos en el catálogo.')
      }
      products.push({
        id: row.id, code: row.code ?? undefined, name: row.name,
        category: row.category as CategoryId, price: Number(row.price), icon: row.icon || '🛒',
        stock: row.stock === null ? undefined : Number(row.stock), department: row.department ?? undefined,
        image: row.image_url ? {
          url: row.image_url, sourceUrl: row.image_source_url ?? undefined,
          attribution: row.image_attribution ?? undefined, license: row.image_license ?? undefined,
          licenseUrl: row.image_license_url ?? undefined,
        } : undefined,
      })
    }
    offset += data.length
    if (offset >= count) return products
  }
}
