import type { Obra } from '../data/obras'
import { registrar } from './tracker'

// El enlace /c/... muestra la imagen de la obra o del final en la vista previa
// y lleva a la ficha de la obra, nunca al final: evita destripes.
export async function compartir(obra: Obra, texto: string, final?: string) {
  const url = `${location.origin}/c/${obra.id}${final ? `/${final}` : ''}`
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
