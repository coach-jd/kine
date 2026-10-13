// Enlaces para compartir: /c/<obra> y /c/<obra>/<final>. Las apps de mensajería
// no ejecutan la app, así que aquí se responde una página mínima con la imagen y
// el texto de la vista previa. Quien abre el enlace llega a la ficha de la obra,
// nunca al final: la vista previa lo nombra, pero no lo destripa.
import { idsDeFinales, obraPorId } from '../src/data/obras'

const escapar = (texto) =>
  texto.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const [, seccion, obraId, nodo] = url.pathname.split('/')
    if (seccion !== 'c') return env.ASSETS.fetch(request)

    const obra = obraPorId(obraId ?? '')
    if (!obra || obra.estado !== 'disponible') return Response.redirect(`${url.origin}/`, 302)

    const final = nodo ? obra.nodos?.[nodo]?.final : undefined
    const total = idsDeFinales(obra).length
    // Los textos salen de la Ficha de Publicación de la obra cuando los trae.
    const titulo = final
      ? `${final.titulo} de ${obra.titulo} · Kine`
      : (obra.seo?.titulo ?? `${obra.titulo} · Kine`)
    const descripcion = final
      ? (obra.compartir?.texto_final ?? `Descubrí uno de los ${total} finales de ${obra.titulo}. ¿Cuál te toca a ti?`)
      : (obra.seo?.descripcion ?? obra.sinopsis ?? '')
    const palabras = (obra.seo?.palabras_clave ?? []).join(', ')
    const imagen = `${url.origin}/og/${obra.id}${final ? `/${nodo}` : ''}.png`
    const destino = `${url.origin}/#/obra/${obra.id}`

    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>${escapar(titulo)}</title>
    <meta name="description" content="${escapar(descripcion)}" />
    <meta name="keywords" content="${escapar(palabras)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Kine" />
    <meta property="og:title" content="${escapar(titulo)}" />
    <meta property="og:description" content="${escapar(descripcion)}" />
    <meta property="og:url" content="${escapar(url.origin + url.pathname)}" />
    <meta property="og:image" content="${escapar(imagen)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${escapar(imagen)}" />
    <meta http-equiv="refresh" content="0; url=${escapar(destino)}" />
  </head>
  <body>
    <a href="${escapar(destino)}">Abrir ${escapar(obra.titulo)} en Kine</a>
    <script>location.replace(${JSON.stringify(destino)})</script>
  </body>
</html>`

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
    })
  },
}
