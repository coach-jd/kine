import type { Obra } from '../data/obras'
import { registrar } from './tracker'

// Comparte la dirección de la app, nunca un final concreto: evita destripes.
export async function compartir(obra: Obra, texto: string) {
  const url = `${location.origin}${location.pathname}`
  registrar('compartir', { obra: obra.id })
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Kine', text: texto, url })
      return 'compartido'
    }
    await navigator.clipboard.writeText(`${texto} ${url}`)
    return 'copiado'
  } catch {
    return 'cancelado'
  }
}
