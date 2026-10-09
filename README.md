# Portfolio de Matías De Sousa

Portfolio profesional en español, construido con Astro y TypeScript. Genera HTML estático: no requiere PHP, backend, base de datos ni servicios de contacto. Las interacciones usan enlaces y controles nativos; no se entrega un framework JavaScript al navegador.

**Autor:** [Matías De Sousa](https://github.com/Matydesousa) · **Repositorio:** [portfolio-matias](https://github.com/Matydesousa/portfolio-matias)

## Ejecutar en Windows

Requiere Node.js 22.12 o superior (versión par; ver `package.json` y las restricciones de Astro). Entorno inicial: Node 24.14.1 y npm 11.11.0.

```powershell
cd C:\programación\HTML\portfolio-matias
npm.cmd ci
npm.cmd run dev
```

Abrir **http://127.0.0.1:4321/**. En macOS/Linux se usa `npm` en lugar de `npm.cmd`.

## Estructura

```text
src/
  data/profile.ts            Presentación, contacto, experiencia y formación
  data/projects.ts           Proyectos, textos, tecnologías y decisiones
  layouts/Layout.astro       Navegación, pie y metadatos compartidos
  pages/index.astro          Página principal
  pages/proyectos/[slug].astro  Detalles generados para cada proyecto
  pages/404.astro            Página de error
  styles/global.css          Diseño, colores, tipografía y responsive
  scripts/motion.ts           Fondo 3D, cursor, entradas y control de efectos
public/
  favicon.svg
  images/                    Capturas reales y miniaturas tipográficas
tests/                       Comprobaciones de navegador
```

## Actualizar contenido

- **Perfil y experiencia:** editar `src/data/profile.ts`.
- **Proyectos:** editar o agregar objetos en `src/data/projects.ts`. El campo `slug` define su URL. La plantilla genera automáticamente una página por proyecto. La portada muestra todos los proyectos del archivo en un listado uniforme, con miniatura y descripción; toda la fila lleva al detalle. Se incluyen los cinco proyectos públicos y se excluye el repositorio del README de perfil. El listado es estático y se actualiza editando este archivo.
- **Imágenes:** colocar imágenes en `public/images/` y actualizar `thumbnail` y `thumbnailAlt` para la portada. `image`, `imageAlt` y `caption` se usan para capturas ampliadas en los detalles. Notas y OAX tienen capturas reales de ejecuciones locales con datos de demostración. Los otros tres proyectos tienen miniaturas SVG tipográficas de sus lenguajes, que no se presentan como capturas de pantalla.
- **Estilo:** diseño compacto en azul marino, con variables de color al inicio de `src/styles/global.css`. Manrope se sirve localmente mediante Fontsource; el navegador no consulta Google Fonts.
- **Contacto:** enlaces funcionales de correo, LinkedIn y GitHub. No hay formularios ni CV descargable.

## Animaciones e interacción

El sitio conserva el listado compacto y suma una red tridimensional de puntos en Canvas, órbitas y señales en movimiento, entrada del nombre por letras, aparición progresiva al recorrer la página y filas con iluminación y profundidad al pasar el cursor. No requiere bibliotecas de animación.

El botón **Pausar efectos** detiene las animaciones y recuerda la elección en este navegador. Se respeta `prefers-reduced-motion`, los efectos de cursor solo funcionan con puntero preciso y el fondo reduce su intensidad en móviles. Canvas limita su resolución y trabaja como máximo a 30 fps; se suspende con la pestaña oculta. Sin JavaScript, el contenido y la navegación siguen disponibles.

Para ajustar la intensidad, cantidad de puntos o velocidad del fondo, editar `src/scripts/motion.ts`. Las transiciones, entradas y efectos visuales están al final de `src/styles/global.css`.

La información de experiencia y formación fue proporcionada por Matías. La descripción técnica se contrastó con los repositorios públicos. El simulador bancario conserva el reconocimiento a Nahue Campos. Adminanzas se menciona como proyecto en desarrollo, sin enlazar ni incluir su repositorio privado.

El código está formateado con Prettier y su plugin de Astro. Después de editar, usar `npm.cmd run format` para mantener el estilo, o `npm.cmd run format:check` para comprobarlo sin modificar archivos.

## Verificar y generar producción

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

La salida estática queda en `dist/`. `preview` sirve esa compilación en http://127.0.0.1:4321/; detener primero el servidor de desarrollo si está usando ese puerto. No es un servidor de producción.

Pruebas de navegador (una instalación estándar de Chromium para Playwright):

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

También se puede reutilizar un navegador existente sin descargar otro:

```powershell
$env:PLAYWRIGHT_BROWSER_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm.cmd run test:e2e
```

Las pruebas verifican páginas, imágenes, navegación, enlaces internos, ausencia de errores JavaScript, accesibilidad básica por teclado, movimiento reducido y desbordamientos en distintos tamaños. No sustituyen una auditoría completa de accesibilidad.

## Dominio, SEO y despliegue futuro

El código fuente está disponible en GitHub. **El sitio web todavía no está desplegado en internet ni tiene un dominio conectado.** No se configuró un dominio ficticio. Tiene títulos y descripciones por página, idioma, metadatos Open Graph/X y favicon. No se generó una imagen social ficticia ni un CV.

Cuando el dominio esté confirmado, definir `PUBLIC_SITE_URL` con su URL HTTPS real (copiar `.env.example` a `.env`, o configurar la variable en el hosting) y recompilar. Esto habilita las URLs canónicas y `og:url`. Incorporar entonces un sitemap con ese mismo dominio y revisar la indexación.

El resultado puede alojarse como sitio estático en GitHub Pages, Netlify, Vercel o Cloudflare Pages. Comando de construcción: `npm ci && npm run build`; carpeta de salida: `dist`. No hace falta un adaptador de servidor para este sitio. Antes de elegir proveedor, verificar sus condiciones vigentes; no se contrató ningún servicio.

Para un dominio propio: agregar el dominio en el proveedor elegido, aplicar los registros DNS indicados por ese proveedor y comprobar HTTPS y redirección a una única versión del dominio. Si se usa GitHub Pages bajo una subcarpeta, configurar `base` en Astro y adaptar los enlaces/rutas de recursos; la versión actual está preparada para la raíz de un dominio.

La memoria local `.codex-memory/` se excluye mediante `.git/info/exclude` y nunca debe publicarse. En una nueva copia local, agregar `/.codex-memory/` a ese archivo antes de crear memoria o realizar staging. Tampoco deben subirse archivos `.env`, bases de datos, dependencias instaladas ni artefactos temporales; `.gitignore` excluye esos archivos habituales.
