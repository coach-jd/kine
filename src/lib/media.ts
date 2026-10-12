// Los archivos se buscan por nombre fijo: <base>/<obra>/<nodo>.mp4. Subir un
// video con ese nombre lo activa; si falta, la app muestra un sustituto.
const BASE =
  (import.meta.env.VITE_MEDIA_BASE as string | undefined)?.replace(/\/$/, '') ??
  `${import.meta.env.BASE_URL}media`

export const urlVideo = (obra: string, nodo: string) => `${BASE}/${obra}/${nodo}.mp4`
export const urlBucle = (obra: string, nodo: string) => `${BASE}/${obra}/${nodo}-umbral.mp4`
export const urlPortada = (obra: string) => `${BASE}/portadas/${obra}.jpg`
export const urlCartel = (obra: string) => `${BASE}/portadas/${obra}-cartel.jpg`
