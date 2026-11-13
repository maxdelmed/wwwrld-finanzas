# Mis finanzas

Aplicación web para registrar gastos en colones, definir un presupuesto mensual y consultar el saldo disponible. El gráfico muestra el gasto por categoría del mes seleccionado.

**Tecnologías** · React, TypeScript, Vite, Chart.js y Supabase.

## Ejecutar en la computadora

Se requiere Node.js 22.12 o superior. Desde la carpeta que contiene `package.json`, se ejecuta lo siguiente.

```bash
npm ci
npm run dev
```

Se abre la dirección que aparece en la terminal. Por defecto, la app guarda los gastos y presupuestos en el navegador.

## Guardado por cuenta con Supabase

1. Se crea un proyecto en Supabase y se ejecuta [supabase.sql](supabase.sql) en el SQL Editor. El script crea las tablas y los permisos para que cada cuenta pueda acceder a sus propios datos.
2. Se copia [.env.example](.env.example) como `.env.local` y se completan `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los valores de **Connect**.
3. En **Authentication → URL Configuration → Site URL**, se indica la dirección de la app para confirmar el correo.
4. Se reinicia la app con `npm run dev`.

## Generar la versión de producción

```bash
npm run build
npm run preview
```

La compilación queda en `dist`. Si se usa Supabase, se configuran las variables de entorno antes de compilar.