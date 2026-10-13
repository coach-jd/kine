# Kine

App de Polimetrajes: historias en video vertical donde el espectador decide cómo terminan.

Esta es la versión 2, reescrita desde cero. El prototipo anterior queda en la etiqueta `v1.0.0`.

## Estado

PMV en construcción. Hoy incluye una obra reproducible (9no Inning, con clips provisionales) y cinco títulos de próximo estreno con contenido genérico. La medición se guarda por ahora en el dispositivo; el backend llega en el siguiente paso.

## Desarrollo

```bash
npm install
npm run dev
```

```bash
npm run build
```

`npm run build` deja el sitio listo para publicar en `dist/`.

## Videos y afiches

La app busca cada archivo por nombre fijo dentro de la carpeta de medios (`public/media` en local, o la dirección indicada en la variable `VITE_MEDIA_BASE`):

| Archivo | Contenido |
|---|---|
| `9no-inning/T.mp4` | Inicio de la historia |
| `9no-inning/T-A.mp4`, `T-B.mp4`, `T-C.mp4` | Segunda parte, según la primera decisión |
| `9no-inning/T-A1.mp4` … `T-C3.mp4` | Los nueve finales |
| `9no-inning/T-umbral.mp4`, `T-A-umbral.mp4`, `T-B-umbral.mp4`, `T-C-umbral.mp4` | Bucle que se repite mientras el espectador decide |
| `portadas/<obra>.jpg` | Afiche vertical 2:3 |
| `portadas/<obra>-cartel.jpg` | Imagen grande de la obra |

Formato de video: vertical 9:16, MP4 (H.264 + AAC). Si un archivo falta, la app muestra un sustituto y el recorrido continúa.

## Enlaces para compartir

Al compartir una obra o un final, el enlace es `/c/<obra>` o `/c/<obra>/<final>`. Esa dirección la responde `worker/index.js` con la imagen y el texto de la vista previa, y lleva a la ficha de la obra.

| Archivo | Vista previa de |
|---|---|
| `public/og/kine.png` | La app |
| `public/og/<obra>.png` | Una obra |
| `public/og/<obra>/<final>.png` | Un final, por ejemplo `9no-inning/T-A2.png` |

Tamaño: 1200 × 630, PNG o JPG con ese mismo nombre. Las actuales son tarjetas provisionales de texto: se reemplazan por imágenes de la obra sin cambiar el código.

## Contenido

Cada obra se describe en una Ficha de Publicación: un archivo JSON en `src/data/obras/`, entregado por Polimetrajes Studio (Maker V). Trae el título, la sinopsis, los textos para buscadores y para compartir, las cuatro decisiones y los nueve finales.

Para publicar o actualizar una obra:

1. Copiar su ficha a `src/data/obras/<obra>.json`.
2. Si la obra es nueva, sumarla a la lista `FICHAS` de `src/data/obras.ts`.
3. Subir sus videos e imágenes con los nombres fijos de las tablas de arriba.

Antes de compilar se revisa cada ficha (`scripts/verificar-fichas.mjs`). Si a una le falta un nodo, una opción o un texto, la compilación se detiene con un mensaje que dice cuál, y la versión publicada no cambia.

Una obra con `estado` igual a `proximamente` aparece en "Próximos estrenos". Su ficha no debe traer decisiones ni finales: todo lo que contiene una ficha queda a la vista de quien abra la app, y la revisión lo rechaza.

## Avisos de estreno

Al tocar "Avísame" la app pide un correo. Se guarda con el evento `aviso` en la tabla de medición, junto a la obra. El tablero privado muestra cuántas personas pidieron cada estreno y permite copiar sus correos.
