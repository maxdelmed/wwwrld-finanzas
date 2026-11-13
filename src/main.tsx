import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import Chart from 'chart.js/auto'
import { cargarmes, categorias, colores, feclocal, montocent, plata, savegasto, savepresup, sumarcat, supa } from './datos'
import type { Gasto } from './datos'
import './estilo.css'

function Grafico({ gastos }: { gastos: Gasto[] }) {
  const lienzo = useRef<HTMLCanvasElement>(null)
  const totales = sumarcat(gastos)

  useEffect(() => {
    if (!lienzo.current || !gastos.length) return
    const graf = new Chart(lienzo.current, {
      type: 'doughnut',
      data: {
        labels: categorias,
        datasets: [{ data: sumarcat(gastos).map(monto => monto / 100), backgroundColor: colores, borderWidth: 0 }]
      },
      options: {
        cutout: '73%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: dato => dato.label + ' · ' + plata(Math.round(dato.parsed * 100)) } }
        }
      }
    })
    return () => graf.destroy()
  }, [gastos])

  return <section className="panel" aria-labelledby="tcat">
    <h2 id="tcat">Gastos por categoría</h2>
    <div className="graf">
      {gastos.length ? <canvas ref={lienzo} aria-hidden="true" /> : <div className="anillo">Sin gastos</div>}
    </div>
    <ul className="leyenda">
      {categorias.map((cat, i) => <li key={cat}>
        <span><i style={{ background: colores[i] }} />{cat}</span><strong>{plata(totales[i])}</strong>
      </li>)}
    </ul>
  </section>
}

function Tablero({ usuario }: { usuario: string }) {
  const [mes, setmes] = useState(feclocal().slice(0, 7))
  const [gastos, setgastos] = useState<Gasto[]>([])
  const [presupmensual, setpresup] = useState(0)
  const [cargado, setcargado] = useState('')
  const [aviso, setaviso] = useState('')
  const [ocupado, setocupado] = useState(false)
  const [cambio, setcambio] = useState(0)
  const [fallo, setfallo] = useState(false)
  const listo = cargado === mes && !fallo
  const mesgastos = listo ? gastos : []
  const total = mesgastos.reduce((suma, gasto) => suma + gasto.monto, 0)
  const saldo = presupmensual - total

  useEffect(() => {
    let activo = true
    cargarmes(mes, usuario).then(datos => {
      if (!activo) return
      setgastos(datos.gastos)
      setpresup(datos.monto)
      setcargado(mes)
      setfallo(false)
    }).catch(() => {
      if (!activo) return
      setfallo(true)
      setaviso('No se pudieron cargar los datos del mes.')
    })
    return () => { activo = false }
  }, [mes, usuario, cambio])

  async function addgasto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado || !listo) return
    const form = evento.currentTarget
    const campos = new FormData(form)
    const detalle = String(campos.get('detalle') ?? '').trim()
    const fecha = String(campos.get('fecha') ?? '')
    const categoria = String(campos.get('categoria') ?? '')
    const monto = montocent(campos.get('monto'))
    if (!detalle || !monto || !fecha.startsWith(mes + '-') || !categorias.includes(categoria)) {
      setaviso('Se tiene que completar el gasto con una fecha del mes y un monto mayor a cero.')
      return
    }

    setocupado(true)
    try {
      await savegasto({ id: crypto.randomUUID(), detalle, fecha, categoria, monto }, usuario)
      form.reset()
      setcargado('')
      setcambio(cambio + 1)
      setaviso('Gasto guardado.')
    } catch {
      setaviso('No se pudo guardar el gasto.')
    } finally {
      setocupado(false)
    }
  }

  async function addpresup(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado || !listo) return
    const monto = montocent(new FormData(evento.currentTarget).get('presup'))
    if (!monto) {
      setaviso('Se tiene que ingresar un presupuesto mayor a cero.')
      return
    }

    setocupado(true)
    try {
      await savepresup(mes, monto, usuario)
      setpresup(monto)
      setaviso('Presupuesto guardado.')
    } catch {
      setaviso('No se pudo guardar el presupuesto.')
    } finally {
      setocupado(false)
    }
  }

  return <>
    <header className="barra"><div className="contenedor marca"><span>Mis finanzas</span>
      {supa ? <button className="claro" onClick={async () => {
        const res = await supa?.auth.signOut()
        if (res?.error) setaviso('No se pudo cerrar la sesión.')
      }}>Cerrar sesión</button> : <span className="modo">Guardado en este navegador</span>}
    </div></header>
    <main className="contenedor">
      <div className="titulo">
        <div><h1>Resumen mensual</h1><p>Presupuesto y gastos en colones.</p></div>
        <label>Mes<input type="month" value={mes} min="1900-01" max="9999-12" disabled={ocupado}
          onChange={evento => {
            const valor = evento.target.value
            if (!evento.target.validity.valid || !/^\d{4}-\d{2}$/.test(valor)) return
            setmes(valor)
            setcargado('')
            setaviso('')
            setfallo(false)
          }} /></label>
      </div>
      <div className="resumen">
        <div className="tarjeta"><span>Presupuesto</span><strong>{listo && presupmensual ? plata(presupmensual) : '—'}</strong></div>
        <div className="tarjeta"><span>Total gastado</span><strong>{listo ? plata(total) : '—'}</strong></div>
        <div className="tarjeta saldo"><span>{listo && presupmensual && saldo < 0 ? 'Exceso de presupuesto' : 'Saldo disponible'}</span>
          <strong>{listo && presupmensual ? plata(Math.abs(saldo)) : '—'}</strong></div>
      </div>
      <div className="estado" role="status">{aviso || (!listo && !fallo ? 'Cargando el mes…' : '')}
        {fallo && <button type="button" onClick={() => { setfallo(false); setaviso(''); setcambio(cambio + 1) }}>Reintentar</button>}
      </div>
      <div className="columnas">
        <Grafico gastos={mesgastos} />
        <div className="formas">
          <section className="panel">
            <h2>Nuevo gasto</h2>
            <form key={mes} onSubmit={addgasto}>
              <fieldset disabled={!listo || ocupado} aria-label="Datos del gasto">
                <label>Detalle<input name="detalle" placeholder="Ej. Supermercado" maxLength={100} required /></label>
                <div className="fila">
                  <label>Monto (₡)<input name="monto" type="number" min="0.01" max="21474836.47" step="0.01" required /></label>
                  <label>Fecha<input name="fecha" type="date" min={mes + '-01'}
                    defaultValue={feclocal().startsWith(mes) ? feclocal() : mes + '-01'} required /></label>
                </div>
                <label>Categoría<select name="categoria">{categorias.map(cat => <option key={cat}>{cat}</option>)}</select></label>
                <button>Guardar gasto</button>
              </fieldset>
            </form>
          </section>
          <section className="panel">
            <h2>Presupuesto del mes</h2>
            <form key={mes + '-' + presupmensual} onSubmit={addpresup}>
              <fieldset className="fila monto" disabled={!listo || ocupado} aria-label="Presupuesto mensual">
                <label>Monto (₡)<input name="presup" type="number" min="0.01" max="21474836.47" step="0.01"
                  defaultValue={presupmensual ? presupmensual / 100 : ''} required /></label>
                <button>Guardar</button>
              </fieldset>
            </form>
          </section>
        </div>
      </div>
      <section className="panel movs">
        <h2>Movimientos</h2>
        {listo && (mesgastos.length ? <div className="tabla"><table>
          <thead><tr><th>Detalle</th><th>Categoría</th><th>Fecha</th><th>Monto</th></tr></thead>
          <tbody>{mesgastos.map(gasto => <tr key={gasto.id}><td>{gasto.detalle}</td><td>{gasto.categoria}</td>
            <td>{gasto.fecha.split('-').reverse().join('/')}</td><td>{plata(gasto.monto)}</td></tr>)}</tbody>
        </table></div> : <p>Este mes todavía no tiene gastos registrados.</p>)}
      </section>
    </main>
  </>
}

function App() {
  const [usuario, setusuario] = useState('')
  const [cuenta, setcuenta] = useState(false)
  const [cargando, setcargando] = useState(Boolean(supa))
  const [ocupado, setocupado] = useState(false)
  const [aviso, setaviso] = useState('')

  useEffect(() => {
    const sesion = supa?.auth.onAuthStateChange((_evento, datos) => {
      setusuario(datos?.user.id ?? '')
      setcargando(false)
    })
    return () => sesion?.data.subscription.unsubscribe()
  }, [])

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!supa || ocupado) return
    const form = new FormData(evento.currentTarget)
    const datos = { email: String(form.get('correo')).trim(), password: String(form.get('clave')) }
    setocupado(true)
    setaviso('')
    try {
      if (cuenta) {
        const res = await supa.auth.signUp(datos)
        if (res.error) throw res.error
        if (!res.data.session) setaviso('Se tiene que confirmar el correo para iniciar sesión.')
      } else {
        const res = await supa.auth.signInWithPassword(datos)
        if (res.error) throw res.error
      }
    } catch {
      setaviso(cuenta ? 'No se pudo crear la cuenta.' : 'No se pudo iniciar sesión. Se tiene que revisar el correo y la contraseña.')
    } finally {
      setocupado(false)
    }
  }

  if (!supa || usuario) return <Tablero key={usuario} usuario={usuario} />
  if (cargando) return <main className="acceso"><p role="status">Cargando sesión…</p></main>
  return <main className="panel acceso">
    <h1>Mis finanzas</h1>
    <h2>{cuenta ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
    <form onSubmit={entrar}>
      <fieldset disabled={ocupado} aria-label="Datos de acceso">
        <label>Correo<input name="correo" type="email" autoComplete="email" required /></label>
        <label>Contraseña<input name="clave" type="password" minLength={cuenta ? 6 : undefined}
          autoComplete={cuenta ? 'new-password' : 'current-password'} required /></label>
        <button>{cuenta ? 'Crear cuenta' : 'Entrar'}</button>
      </fieldset>
    </form>
    <p role="status">{aviso}</p>
    <button className="secundario" disabled={ocupado} onClick={() => {
      setcuenta(!cuenta)
      setaviso('')
    }}>{cuenta ? 'Volver a iniciar sesión' : 'Crear una cuenta'}</button>
  </main>
}

createRoot(document.getElementById('root')!).render(<App />)
