import { createClient } from '@supabase/supabase-js'

export const categorias = ['Comida', 'Transporte', 'Casa', 'Salud', 'Ocio', 'Otros']
export const colores = ['#09318d', '#fd91cc', '#5076d5', '#aa327a', '#a6bcf3', '#e3eaff']

export type Gasto = {
  id: string
  detalle: string
  fecha: string
  categoria: string
  monto: number
}

export type Presup = { mes: string; monto: number }

const url = import.meta.env.VITE_SUPABASE_URL
const llave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supa = url && llave ? createClient(url, llave) : null

export function feclocal() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export function montocent(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? '')
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return 0
  const monto = Math.round(Number(texto) * 100)
  if (monto < 1 || monto > 2147483647) return 0
  return monto
}

export function plata(cent: number) {
  return formato.format(cent / 100)
}

const formato = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC'
})

export function sumarcat(gastos: Gasto[]) {
  const totales = categorias.map(() => 0)
  for (const gasto of gastos) {
    const pos = categorias.indexOf(gasto.categoria)
    if (pos >= 0) totales[pos] += gasto.monto
  }
  return totales
}

export async function cargarmes(mes: string, usuario: string) {
  if (!supa) {
    const gastos = leerlocal<Gasto>('gastos').filter(gasto => gasto.fecha.startsWith(mes))
    const presup = leerlocal<Presup>('presup').find(fila => fila.mes === mes)
    gastos.sort((a, b) => b.fecha.localeCompare(a.fecha))
    return { gastos, monto: presup?.monto ?? 0 }
  }

  const gastos: Gasto[] = []
  const limite = 500
  for (let pos = 0; ; pos += limite) {
    const res = await supa.from('gastos').select('id, detalle, fecha, categoria, monto')
      .eq('usuario', usuario).gte('fecha', mes + '-01').lte('fecha', ultimodia(mes))
      .order('fecha', { ascending: false }).order('id').range(pos, pos + limite - 1)
    if (res.error) throw res.error
    gastos.push(...res.data)
    if (res.data.length < limite) break
  }

  const presup = await supa.from('presupuestos').select('monto')
    .eq('usuario', usuario).eq('mes', mes + '-01').maybeSingle()
  if (presup.error) throw presup.error
  return { gastos, monto: presup.data?.monto ?? 0 }
}

function ultimodia(mes: string) {
  const [anio, num] = mes.split('-').map(Number)
  return mes + '-' + new Date(anio, num, 0).getDate()
}

function leerlocal<T>(tabla: string): T[] {
  return JSON.parse(localStorage.getItem('misfinanzas-' + tabla) ?? '[]')
}

export async function savegasto(gasto: Gasto, usuario: string) {
  if (!supa) {
    const gastos = leerlocal<Gasto>('gastos')
    gastos.push(gasto)
    localStorage.setItem('misfinanzas-gastos', JSON.stringify(gastos))
    return
  }
  const { error } = await supa.from('gastos').insert({ ...gasto, usuario })
  if (error) throw error
}

export async function savepresup(mes: string, monto: number, usuario: string) {
  if (!supa) {
    const presup = leerlocal<Presup>('presup').filter(fila => fila.mes !== mes)
    presup.push({ mes, monto })
    localStorage.setItem('misfinanzas-presup', JSON.stringify(presup))
    return
  }
  const { error } = await supa.from('presupuestos').upsert({ mes: mes + '-01', monto, usuario })
  if (error) throw error
}
