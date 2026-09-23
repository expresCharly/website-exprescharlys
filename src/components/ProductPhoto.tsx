import { useState } from 'react'
import type { Product } from '../types/catalog'

function safeLink(value?: string): string | undefined {
  if (!value) return undefined
  try { return new URL(value).protocol === 'https:' ? value : undefined } catch { return undefined }
}

export function ProductPhoto({ product }: { product: Product }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const photo = product.image
  const imageUrl = photo?.url.startsWith('/product-images/') ? photo.url : safeLink(photo?.url)
  const hasImage = Boolean(imageUrl && failedUrl !== imageUrl)
  const source = safeLink(photo?.sourceUrl)
  const license = safeLink(photo?.licenseUrl)

  return (
    <figure className="product-photo">
      <div className={`product-photo-frame${hasImage ? ' has-photo' : ''}`}>
        {hasImage ? (
          <img src={imageUrl} alt={product.name} loading="lazy" decoding="async" width="160" height="150"
            onError={() => setFailedUrl(imageUrl!)} />
        ) : <span className="product-photo-placeholder" aria-hidden="true">{product.icon}</span>}
      </div>
      {hasImage && photo?.attribution && (
        <figcaption>
          {source ? <a href={source} target="_blank" rel="noreferrer">{photo.attribution}</a> : photo.attribution}
          {photo.license && <> · {license ? <a href={license} target="_blank" rel="noreferrer">{photo.license}</a> : photo.license}</>}
        </figcaption>
      )}
    </figure>
  )
}
