import { importedProductsByCategory } from './catalog'
import baseProducts from './base-products.json'
import imageManifest from './product-images.json'
import type { Category, CategoryId, Product, ProductImage } from '../types/catalog'

const categoryDetails: Omit<Category, 'products'>[] = [
  { id: 'abarrotes', name: 'Abarrotes', icon: '🛒' },
  { id: 'farmacia', name: 'Farmacia', icon: '💊' },
  { id: 'restaurante', name: 'Restaurante', icon: '🍽️' },
]

export function groupProducts(products: Product[]): Category[] {
  return categoryDetails.map(category => ({
    ...category,
    products: products.filter(product => product.category === category.id),
  }))
}

const images: Record<string, ProductImage> = imageManifest
const localProducts: Product[] = [
  ...baseProducts.map(product => ({ ...product, category: product.category as CategoryId })),
  ...Object.entries(importedProductsByCategory).flatMap(([category, products]) =>
    products.map(product => ({ ...product, category: category as CategoryId, image: images[product.code] })),
  ),
]

export const localCategories = groupProducts(localProducts)
