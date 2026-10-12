// Llaves públicas del proyecto de Supabase. Sin ellas la app funciona igual,
// solo que no envía medición ni abre el tablero.
export const URL_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
export const LLAVE = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const cabeceras = (token: string = LLAVE ?? '') => ({
  apikey: LLAVE ?? '',
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
})
