import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../../Pagina para mostrar los menus/', import.meta.url))
const prefix = '/__shared-menus/'
const imageName = /^[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|avif)$/i

export default function sharedMenus() {
  return {
    name: 'shared-restaurant-menus',
    apply: 'serve',
    configureServer(server) {
      // Leer los originales: no hay copias ni una segunda lista que mantener.
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname
        if (!pathname.startsWith(prefix)) return next()
        res.setHeader('Cache-Control', 'no-store')
        try {
          const relative = pathname.slice(prefix.length)
          const files = await readdir(path.join(source, 'imgs'))
          if (relative === 'index.html') {
            const html = await readFile(path.join(source, 'index.html'), 'utf8')
            const normalized = html.replace(/(['"])imgs\/([a-zA-Z0-9_.-]+)\1/g, (match, quote, name) => {
              const actual = files.find(file => file.toLowerCase() === name.toLowerCase())
              return actual ? `${quote}imgs/${actual}${quote}` : match
            })
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            return res.end(normalized)
          }
          const name = relative.startsWith('imgs/') ? relative.slice(5) : ''
          const actual = imageName.test(name) && files.find(file => file.toLowerCase() === name.toLowerCase())
          if (!actual) { res.statusCode = 404; return res.end('Imagen no encontrada') }
          const bytes = await readFile(path.join(source, 'imgs', actual))
          const ext = path.extname(actual).slice(1).toLowerCase()
          res.setHeader('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`)
          res.end(bytes)
        } catch {
          res.statusCode = 503
          res.end('No se pudo leer la carpeta compartida de menús')
        }
      })
      server.watcher.add(source)
      const refresh = file => {
        const relative = path.relative(source, file)
        if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
          server.ws.send({ type: 'full-reload' })
        }
      }
      for (const event of ['change', 'add', 'unlink']) server.watcher.on(event, refresh)
      server.httpServer?.once('close', () => {
        for (const event of ['change', 'add', 'unlink']) server.watcher.off(event, refresh)
      })
    },
  }
}
