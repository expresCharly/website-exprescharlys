import QRCode from 'qrcode'

const url = 'https://website-exprescharlys.vercel.app/menu'
const options = { errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#ffffff' } }
await QRCode.toFile('public/menu-qr.svg', url, { ...options, type: 'svg', width: 600 })
await QRCode.toFile('public/menu-qr.png', url, { ...options, width: 1200 })
console.log(`QR generado para ${url}`)
