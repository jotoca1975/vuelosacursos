# Vuelos a Cursos

> La versión actual se publica en Cloudflare Workers + D1. Supabase ya no se usa.

Aplicación web sencilla para que las personas que viajan a un mismo curso de Vipassana fuera de España puedan encontrarse y, si lo desean, organizar parte del trayecto.

La página no requiere cuenta de usuario: muestra cursos futuros agrupados por **centro + tipo de curso + fecha de inicio + fecha de fin**, permite consultar sus viajeros y publicar un nuevo viaje. La persona elige el tipo de curso, la fecha de inicio y la fecha de fin; las tres informaciones se guardan y se muestran. El teléfono y correo solo se muestran cuando la persona ha dado su consentimiento expreso.

## Actualización: cursos y viajeros

La versión actual separa los cursos de los viajeros: una persona crea una vez el centro, país, tipo y fechas del curso; las demás usan **Me apunto** y solo completan sus datos de viaje. Antes de guardar se muestra una previsualización que permite volver a corregir. La portada muestra el centro y país, el tipo de curso, las fechas y el número de viajeros; no muestra una duración calculada.

Si vienes de una versión anterior, ejecuta primero [`supabase/migrate_v2_courses.sql`](supabase/migrate_v2_courses.sql). Conserva los viajes antiguos y crea los cursos correspondientes.

## Catálogo oficial de centros

El buscador de centros se alimenta automáticamente del directorio público de dhamma.org. El flujo de GitHub **Actualizar directorio de centros** se ejecuta el día 1 de cada mes a las 06:00 UTC; no hay que mantener una lista a mano.

Para la primera carga, añade en GitHub → **Settings → Secrets and variables → Actions** estos secretos: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Esta segunda clave se usa exclusivamente en el flujo privado de GitHub, nunca se publica en la web. Después ve a **Actions → Actualizar directorio de centros → Run workflow**. Si el directorio oficial cambia de formato y se reconocen menos de 150 centros, la tarea se detiene sin modificar el catálogo existente.

## Qué incluye esta primera versión

- Inicio responsive y accesible, pensado también para móvil.
- Agrupación y orden cronológico automáticos desde la tabla `viajes`.
- Ficha de viajeros con ciudad, aeropuerto, llegada y comentarios opcionales.
- Botón de contacto solo cuando existe consentimiento.
- Formulario con validaciones que escribe directamente en Supabase.
- Reglas de seguridad (RLS) que permiten leer y añadir, pero no editar ni borrar desde la web pública.
- Publicación automática en GitHub Pages.

## Publicar en Cloudflare

1. Instala dependencias: `npm install`.
2. Inicia sesión en Cloudflare desde tu terminal: `npx wrangler login`.
3. Crea las tablas en la base ya creada: `npm run db:migrate`.
4. Publica la web y su API: `npm run deploy`.

Cloudflare mostrará una dirección `https://vuelos-a-cursos.<tu-subdominio>.workers.dev`. Esa será la nueva página pública; la antigua de GitHub Pages se puede conservar mientras se comprueba que todo funciona.

Necesitas Node.js 20 o superior y una cuenta gratuita de Supabase.

1. En Supabase crea un proyecto y abre **SQL Editor**.
2. Para una base de datos nueva, ejecuta [`supabase/schema.sql`](supabase/schema.sql). Si ya existe tu tabla `viajes`, ejecuta únicamente [`supabase/migrate_v2_courses.sql`](supabase/migrate_v2_courses.sql) para conservar los datos y adoptar el nuevo modelo.
3. En **Project Settings → API**, copia el Project URL y la clave `anon` pública.
4. Duplica `.env.example` con el nombre `.env.local` y pega ambos valores.
5. Instala y ejecuta:

   ```bash
   npm install
   npm run dev
   ```

6. Abre la dirección que indique la terminal. Puedes añadir un viaje de prueba y comprobar que aparece agrupado en la portada.

## Publicar en GitHub Pages

1. Crea un repositorio GitHub y sube esta carpeta a la rama `main`.
2. En el repositorio ve a **Settings → Secrets and variables → Actions** y crea estos secretos:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. En **Settings → Pages**, elige como fuente **GitHub Actions**.
4. Al enviar cambios a `main`, la acción incluida en `.github/workflows/deploy.yml` compila y publica la web. La URL aparecerá al finalizar la acción.

La clave `anon` es la clave pública prevista por Supabase para aplicaciones de navegador. La seguridad real se establece en las políticas RLS de la base de datos; nunca añadas una clave `service_role` al proyecto ni a GitHub.

## Modelo de datos

La tabla `viajes` usa estos campos principales:

| Campo | Uso |
| --- | --- |
| `centro`, `inicio_curso`, `fin_curso` | Identifican el curso y forman el grupo. |
| `nombre`, `apellidos` | Identifican al viajero. |
| `ciudad_salida`, `aeropuerto`, `llegada_centro`, `comentarios` | Información opcional para coordinarse. |
| `consentimiento`, `telefono`, `email` | Contacto voluntario y condicionado al consentimiento. |

Se han conservado `fecha_salida` y `salida_centro` para usos futuros, aunque este MVP no los muestra. La duración se calcula a partir de las fechas, para que no pueda quedar desactualizada.

## Mantenimiento y siguientes mejoras

Para que sea fácil de administrar, la web pública no permite modificar ni eliminar registros. Si una persona necesita corregir un viaje, un administrador puede hacerlo desde Supabase. Cuando el uso crezca, las mejoras naturales son: aprobación antes de publicar, expiración automática de viajes terminados, idiomas y una función de contacto que no exponga datos al navegador hasta que se soliciten.

## Estructura

```text
src/main.js          Rutas y componentes de las tres pantallas
src/lib/trips.js     Lectura, agrupación e inserción en Supabase
src/lib/supabase.js  Conexión mediante variables de entorno
src/styles.css       Diseño responsive
supabase/schema.sql  Tabla, índices y reglas de seguridad
.github/workflows/   Publicación automática en GitHub Pages
```
