// Sesión del tablero privado: inicio con correo y contraseña contra Supabase.
// La lectura de datos la autoriza la base de datos, no esta app.
import { URL_BASE, cabeceras } from './supabase'

const CLAVE = 'kine.sesion'

interface Sesion {
  access_token: string
  refresh_token: string
  expires_at: number
  correo: string
}

interface RespuestaToken {
  access_token: string
  refresh_token: string
  expires_in: number
  user?: { email?: string }
}

function leer(): Sesion | null {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Sesion | null
  } catch {
    return null
  }
}

function guardar(r: RespuestaToken, correo: string) {
  const sesion: Sesion = {
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + r.expires_in,
    correo: r.user?.email ?? correo,
  }
  localStorage.setItem(CLAVE, JSON.stringify(sesion))
  return sesion
}

async function pedirToken(tipo: 'password' | 'refresh_token', cuerpo: Record<string, string>) {
  const respuesta = await fetch(`${URL_BASE}/auth/v1/token?grant_type=${tipo}`, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(cuerpo),
  })
  if (!respuesta.ok) return null
  return (await respuesta.json()) as RespuestaToken
}

export const correoActual = () => leer()?.correo ?? null

export async function entrar(correo: string, clave: string) {
  const r = await pedirToken('password', { email: correo, password: clave })
  if (!r) return false
  guardar(r, correo)
  return true
}

export function salir() {
  localStorage.removeItem(CLAVE)
}

// Devuelve un token válido, renovándolo si está por vencer; null si hay que volver a entrar.
export async function tokenVigente() {
  const sesion = leer()
  if (!sesion) return null
  if (sesion.expires_at - 60 > Date.now() / 1000) return sesion.access_token
  const r = await pedirToken('refresh_token', { refresh_token: sesion.refresh_token })
  if (!r) {
    salir()
    return null
  }
  return guardar(r, sesion.correo).access_token
}
