# Mis finanzas

Dashboard en español para registrar gastos en colones, definir un presupuesto mensual y ver el saldo disponible. El gráfico muestra cuánto se gastó por categoría en el mes seleccionado.

**Tecnologías** · React, TypeScript, Vite, Chart.js y Supabase.

## Ejecutar en la computadora

Se requiere Node.js 22.12 o superior. Después de clonar el repositorio o descomprimir el ZIP, se abre una terminal en la carpeta donde está `package.json`.

```bash
npm ci
npm run dev
```

Se abre la dirección que aparece en la terminal. Por defecto, los datos se guardan en el navegador.

## Conectar Supabase

1. Se crea un proyecto en Supabase y se ejecuta [supabase.sql](supabase.sql) una vez en el SQL Editor. El archivo crea las tablas y los permisos para que cada cuenta solo pueda acceder a sus datos.
2. Se copia [.env.example](.env.example) como `.env.local`. Se completan `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con la URL del proyecto y la clave publicable que aparecen en **Connect**. Las claves secretas quedan fuera del repositorio.
3. En **Authentication → URL Configuration → Site URL**, se configura la dirección de la app para que el enlace de confirmación de correo abra el sitio.
4. Se reinicia la app con `npm run dev`. Con Supabase configurado, se puede crear una cuenta y guardar los datos en ella. Los gastos registrados antes de conectar Supabase permanecen en el navegador donde se ingresaron.

## Generar la versión de producción

```bash
npm run build
npm run preview
```

La compilación queda en la carpeta `dist`. Para usar Supabase en producción, se tienen que configurar las variables de entorno antes de compilar.

[Guía de Supabase para React](https://supabase.com/docs/guides/auth/quickstarts/react)

## Publicar en GitHub Pages

El repositorio `maxdelmed/wwwrld-finanzas` se publica desde la rama `main`. En GitHub, se abre **Settings → Pages** y se selecciona **GitHub Actions** como fuente. El flujo **Publicar Mis finanzas** compila la app con la configuración publicable de Supabase.

Si se selecciona la fuente después de subir el código, se puede abrir **Actions → Publicar Mis finanzas → Run workflow** para iniciar la publicación.

Cuando termine, se abre [Mis finanzas](https://maxdelmed.github.io/wwwrld-finanzas/). En Supabase, se pone esa misma dirección en **Authentication → URL Configuration → Site URL** para que el correo de confirmación abra la app.
