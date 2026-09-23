export type CategoryId = 'abarrotes' | 'farmacia' | 'restaurante'

export type ProductImage = {
  url: string
  sourceUrl?: string
  attribution?: string
  license?: string
  licenseUrl?: string
}

export type Product = {
  id: string
  name: string
  price: number
  icon: string
  category: CategoryId
  code?: string
  stock?: number
  department?: string
  image?: ProductImage
}

export type Category = {
  id: CategoryId
  name: string
  icon: string
  products: Product[]
}
