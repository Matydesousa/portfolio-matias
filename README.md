# Portfolio de Matías De Sousa

Portfolio profesional en español e inglés, construido con Astro y TypeScript. Genera HTML estático: no requiere PHP, backend, base de datos ni servicios de contacto. Las interacciones usan enlaces y controles nativos; no se entrega un framework JavaScript al navegador.

**Autor:** [Matías De Sousa](https://github.com/Matydesousa) · **Repositorio:** [portfolio-matias](https://github.com/Matydesousa/portfolio-matias)

## Ejecutar en Windows

Requiere Node.js 22.12 o superior (versión par; ver `package.json` y las restricciones de Astro). Entorno inicial: Node 24.14.1 y npm 11.11.0.

```powershell
cd C:\programación\HTML\portfolio-matias
npm.cmd ci
npm.cmd run dev
```

Abrir **http://127.0.0.1:4321/**. En macOS/Linux se usa `npm` en lugar de `npm.cmd`.

La versión inglesa está en **http://127.0.0.1:4321/en/**. El selector **ES / EN** del encabezado conserva el proyecto abierto al cambiar de idioma. La portada, experiencia, detalles, leyendas, recorridos, metadatos y controles están traducidos. Las capturas originales conservan el idioma de las aplicaciones.

## Estructura

```text
src/
  data/profile.ts            Presentación, contacto, experiencia y formación
  data/projects.ts           Proyectos, funciones, flujos, ejemplos y galerías
  data/walkthroughs.ts       Elementos y mensajes de las visitas guiadas
  components/Walkthrough.astro  Foco visual y mensajes flotantes
  components/SculptureControl.astro  Agarre y controles accesibles de la figura
  components/ImageViewer.astro  Visor de capturas reales
  components/PortfolioPage.astro  Portada compartida por ambos idiomas
  components/ProjectPage.astro  Detalle compartido por ambos idiomas
  components/EmailCopy.astro   Correo con copia directa y confirmación
  components/NotFoundPage.astro  Página de error compartida
  i18n/ui.ts                  Textos de interfaz y rutas por idioma
  i18n/content.ts             Traducciones de contenido y experiencia
  layouts/Layout.astro       Navegación, pie y metadatos compartidos
  pages/index.astro          Página principal
  pages/proyectos/[slug].astro  Detalles generados para cada proyecto
  pages/en/index.astro       Portada inglesa
  pages/en/projects/[slug].astro  Detalles ingleses
  pages/404.astro            Página de error
  styles/global.css          Diseño, colores, tipografía y responsive
  scripts/motion.ts           Escena, cursor y control de efectos
  scripts/scroll-depth.ts     Entradas 3D vinculadas al avance del scroll
  scripts/page-arrival.ts     Entrada de contenido y ensamblado por interacción
  scripts/scene.ts            Geometría, proyección e iluminación 3D
  scripts/scene-worker.ts     Dibujo móvil en segundo plano con OffscreenCanvas
  scripts/sculpture-fragments.ts Fragmentos irregulares de la escultura
  scripts/scene-physics.ts    Velocidad angular e inercia con fricción
  scripts/discoveries.ts      Detalles visuales para descubrir al interactuar
  scripts/walkthrough.ts      Desplazamiento y controles de la visita
public/
  favicon.svg
  images/                    Capturas reales y miniaturas tipográficas
tests/                       Comprobaciones de navegador
```

## Actualizar contenido

- **Perfil y experiencia:** editar `src/data/profile.ts` y mantener su traducción inglesa en `src/i18n/content.ts`; la presentación de portada está en `src/i18n/ui.ts`.
- **Proyectos:** editar o agregar objetos en `src/data/projects.ts`. El campo `slug` define su URL. La plantilla genera automáticamente una página por proyecto y la visita guiada reutiliza sus datos y secciones. La portada muestra todos los proyectos del archivo en un listado uniforme, con miniatura y descripción; toda la fila lleva al detalle. Se incluyen los cinco proyectos públicos y se excluye el repositorio del README de perfil. El listado es estático y se actualiza editando este archivo.
- **Explicación:** `features` describe funciones reales, `workflow` explica su uso y `example` muestra un caso concreto. La página presenta el problema, las funciones y el flujo antes de la galería; después conserva participación, decisiones técnicas y alcance. Contrastar cada texto con el código y la ejecución del proyecto antes de publicarlo.
- **Idiomas:** los textos de interfaz se mantienen en `src/i18n/ui.ts`. Las traducciones de proyectos están indexadas por `slug` en `src/i18n/content.ts`; conservan las mismas URLs de repositorios, demos, imágenes y sus dimensiones. Actualizar ambos idiomas al cambiar el contenido. La compilación comprueba que cada proyecto tenga traducción y que coincidan las cantidades de funciones, pasos, decisiones y vistas. Los identificadores de secciones se mantienen iguales para conservar enlaces y recorridos.
- **Imágenes:** colocar imágenes en `public/images/` y actualizar `thumbnail` y `thumbnailAlt` para la portada. Los cinco proyectos usan miniaturas SVG tipográficas con el mismo diseño: JS para OAX, PHP para Notas, Py para el ferroviario, Java para el bancario y C para el hotel. Las imágenes del sistema se reservan para el detalle. `image`, `imageAlt` y `caption` definen la imagen principal; `imageWidth` y `imageHeight` permiten conservar sus dimensiones reales.
- **Sitio y galería:** `website` y `demo` son enlaces opcionales verificados; OAX usa su sitio público y `/demo`. `gallerySummary` explica la procedencia del conjunto; cada elemento de `gallery` tiene `src`, `title`, `alt`, `caption` y una `description` del funcionamiento mostrado. `width` y `height` son opcionales (1440 × 960 por defecto); Rail Board usa sus capturas originales de 1202 × 940. Las leyendas y proporciones se conservan al ampliar.

Las galerías reúnen 20 imágenes entre las vistas principales y adicionales, con datos de demostración. OAX conserva seis vistas de su sitio y demo; Notas incluye cuatro capturas de una ejecución aislada con SQLite; el ferroviario, cinco capturas reales de su aplicación Tkinter. Java tiene dos extractos y C tres extractos de la salida obtenida al compilar y ejecutar sus demos, presentados en un marco legible y rotulados como salida de consola: no representan interfaces gráficas. Las 13 imágenes nuevas y las cinco vistas adicionales de OAX se capturaron el 9 de octubre de 2026. No se modificó el código funcional de los proyectos ni se usaron bases originales, datos internos o credenciales.

- **Estilo:** diseño compacto en azul marino, con variables de color al inicio de `src/styles/global.css`. Manrope se sirve localmente mediante Fontsource; el navegador no consulta Google Fonts.
- **Contacto:** pulsar el texto del correo lo copia y muestra una confirmación accesible en ambos idiomas, sin botón ni icono separados. Funciona con clic, toque, Enter y espacio, usando el portapapeles del navegador (HTTPS o localhost). Si falla, selecciona el correo y explica cómo copiarlo manualmente. El href mailto original se conserva para clics modificados y navegación sin JavaScript. LinkedIn y GitHub mantienen sus enlaces. No hay formularios ni CV descargable; el usuario mantiene esa información en LinkedIn.

## Animaciones e interacción

La escena se prepara únicamente cuando está visible y los efectos están habilitados. Los valores fijos de las piezas y las órbitas se reutilizan. En pantallas pequeñas o táctiles se conserva la forma con una malla compacta de 144 piezas y una frecuencia de dibujo de aproximadamente 20 fps; escritorio mantiene las 384 piezas y la interacción de mayor frecuencia. En dispositivos táctiles con `transferControlToOffscreen`, un Web Worker dibuja la escena sin ocupar el hilo de navegación. Solo se permite un cuadro pendiente para evitar acumulación de trabajo. Sin esa API se utiliza la misma escena compacta en el hilo principal; si falla el worker se oculta la decoración y el contenido sigue disponible. La pausa, el movimiento reducido y la suspensión fuera de pantalla siguen vigentes. No se agregaron dependencias.

Todas las vistas comparten una cinta ovalada 3D antes del pie de página, con los cinco proyectos y sus enlaces reales en el idioma activo. En los detalles reemplaza la navegación inferior de todos los proyectos/siguiente; la última parada del recorrido presenta el acceso a los proyectos, con un mensaje válido también en la vista simple. Se acerca al contenido y aprovecha el ancho habitual de la página. Las tarjetas conservan sus proporciones y siguen la tangente del óvalo; 48 segmentos forman una superficie continua con profundidad. No hay títulos, explicaciones ni botones visibles.

Gira automáticamente hacia la izquierda incluso al pasar el mouse por encima. Agarrarla permite girar directamente en ambos sentidos; al soltar conserva el impulso, desacelera y recupera su velocidad habitual. Sostenerla quieta frena el impulso, pero al soltar vuelve el giro automático. El cursor en cualquier parte de la pantalla produce una respuesta leve de posición e inclinación. Con mouse, arrastrar arriba o abajo agrega una inclinación de hasta ±2,2° que vuelve suavemente al soltar, sin permitir vueltas verticales. En táctiles, el gesto vertical conserva el scroll de la página. Pulsar un hueco alterna azul marino limpio con una línea horizontal central, celeste translúcido con malla triangular y una apariencia transparente con trazos de circuito, bordes y reflejos blancos; pulsar una tarjeta abre el proyecto y terminar un arrastre no navega ni cambia el color.

Con efectos pausados o movimiento reducido, la cinta se reemplaza por una lista compacta de nombres y enlaces: dos columnas en escritorio y una en móvil, sin miniaturas, perspectiva, superficie 3D ni animaciones. Al reactivar efectos vuelve el óvalo, conservando los enlaces y el foco. Diálogos y visibilidad suspenden el movimiento. Con efectos activos se mantiene estable al usar teclado: izquierda/derecha giran o seleccionan enlaces, arriba/abajo sobre la superficie ajustan la inclinación limitada, Enter abre el proyecto y Enter/espacio sobre la superficie cambian el color; el enlace enfocado pasa al frente. En móvil conserva scroll vertical y zoom del navegador. Sin JavaScript se muestra la misma lista simple de cinco enlaces nativos, sin desplazamiento horizontal. No duplica enlaces, agrega dependencias ni modifica el listado principal.

El sitio conserva el listado compacto y suma una escultura geométrica 3D azul: una malla de nudo toroidal con iluminación, perspectiva, rotación, órbitas y luces en movimiento. Se calcula y proyecta en Canvas, sin descargar modelos ni bibliotecas de 3D. Responde al cursor y acompaña la presentación. Las miniaturas se elevan en capas; las capturas de detalle tienen inclinación y reflejos. También hay entradas tipográficas, aparición progresiva, iluminación en filas y reflejos en botones.

Al cargar cada página, la figura permanece desarmada en una nube de 384 fragmentos irregulares con volumen, órbitas y giros propios alrededor de un centro vacío. Las piezas están repartidas con más aire y menor tamaño/opacidad para distinguir sus formas sin resaltar demasiado. Las dos órbitas con luces permanecen visibles también durante la espera. El mouse modifica suavemente su orientación sin iniciar el armado por sí solo. Sin otros gestos, se arma automáticamente tras 5 segundos con la pestaña visible. El primer scroll, intento de desplazamiento con rueda, clic, toque o acción de teclado inicia un ensamblado más pausado de 1,8 segundos hasta recuperar exactamente la figura original. El clic que inicia el ensamblado solo arma la figura; el siguiente cambia su aspecto. Si ya se armó por otra interacción, el clic cambia su aspecto normalmente. Las piezas toman giros cortos incluso después de una espera larga. La nube usa el ciclo existente a 30 fps y el ensamblado a hasta 60 fps; no se agregan timers, librerías o pantallas de espera. Los textos visibles conservan una entrada breve, con zonas clickeables quietas. Ocultar la pestaña suspende la escena y conserva el tiempo restante de la espera automática; cambiar el tamaño no la termina. Pausa, movimiento reducido o apertura de un diálogo omiten/completan la animación. No se reinicia al volver a activar efectos ni al regresar desde la caché de navegación.

Las apariciones al hacer scroll acercan el contenido desde el fondo con perspectiva y una breve amortiguación para suavizar rueda y gestos. Textos, tarjetas e imágenes tienen distinta profundidad; miniaturas y leyendas se desplazan en capas y las galerías incorporan un zoom leve. Participan la presentación, información, experiencia desplegada con su línea luminosa, contactos, bloques de cada proyecto, cinta y pie. El contenido queda estable en la zona de lectura; al subir se aleja con la misma curva y reaparece al bajar. La cinta mantiene su geometría y física propia. El pie adapta el recorrido al scroll restante. En móvil se modera el efecto, sin desenfoque. El teclado revela inmediatamente el foco y los controles conservan su posición durante el clic. Pausa, movimiento reducido y diálogos mantienen geometría normal. Scroll nativo, sin dependencias nuevas y sin bucle permanente de animación.

La escultura tiene transparencia alta para acompañar el contenido. El fondo incorpora luces lentas y una trama de puntos muy tenue que aparece cerca del cursor, además de un pequeño pulso al hacer clic. Enlaces y botones reciben reflejos locales; las flechas responden con un desplazamiento corto, manteniendo quieta el área clickeable. Se conserva el cursor del sistema. Estas capas son decorativas, quedan detrás del contenido y no interceptan clics; en pantallas táctiles no aparecen los efectos del cursor.

El botón **Pausar efectos** detiene las animaciones y recuerda la elección en este navegador. Se respeta `prefers-reduced-motion`, los efectos de cursor solo funcionan con puntero preciso y la escultura reduce su intensidad en móviles y en los detalles para preservar la lectura. Canvas limita su resolución y trabaja aproximadamente a 30 fps en reposo y hasta 60 fps durante el agarre o un giro con inercia rápida; se suspende con la pestaña oculta y cuando la escena sale de pantalla. Sin JavaScript, el contenido y la navegación siguen disponibles.

En escritorio con mouse, **clic en la figura** alterna entre sólido y malla. **Mantener presionado y arrastrar** gira el objeto directamente en ambos ejes y detiene su movimiento automático mientras está agarrado. Un giro rápido conserva el impulso al soltar; la fricción lo reduce gradualmente hasta recuperar la velocidad habitual. Volver a agarrar la figura frena la inercia; sostenerla quieta antes de soltar evita que continúe un impulso anterior. Captura de puntero permite continuar aunque el cursor salga de la figura; el arrastre no dispara el clic de cambio de aspecto. Enter/espacio alternan el modo, las flechas giran y la tecla Inicio restablece la posición. No hay aro exterior ni mensaje visible; el foco de teclado usa una pequeña línea inferior. En diseños estrechos, táctiles, texto ampliado o efectos desactivados no aparece una superficie interactiva sobre los textos. Se conserva la transparencia original.

Los cinco proyectos tienen **Ampliar captura**: un visor que dedica casi toda la ventana a la imagen, con título y zoom en una cabecera compacta. La barra inferior reúne navegación, información y acceso al original; el botón de información despliega descripción y ayuda cuando se necesitan. Se cierra con su botón, Escape o clic fuera; el foco vuelve al activador. Se adapta a móvil y texto ampliado, y omite su animación si se pausan los efectos o se solicita movimiento reducido. Sin JavaScript la imagen habitual sigue visible y no aparece un botón inactivo. Los futuros proyectos sin imagen no muestran este visor.

El visor incorpora **zoom de 1× a 8×** respecto al encuadre inicial, botones **+/−** y **Encajar**, rueda centrada en el cursor, arrastre con límites, pellizco de dos dedos y doble clic/doble toque para alternar entre 2,5× y la imagen completa. **+**, **−** y **0** permiten usarlo con teclado. Con el área de imagen enfocada y ampliada, las flechas desplazan la captura; desde los demás controles siguen recorriendo la galería. El zoom vuelve al encuadre completo al cambiar de imagen, reabrir o redimensionar el visor. Conserva las proporciones originales y el porcentaje se refiere al encuadre inicial. Los gestos se limitan a la imagen; el resto del diálogo permite desplazamiento normal y no se agregaron dependencias.

Cada galería conserva la imagen principal y agrega vistas explicadas. Las tarjetas abren la imagen elegida en el mismo visor; **Anterior/Siguiente** y las flechas del teclado recorren las imágenes con título, descripción, contador y enlace original sincronizados. Al cerrar, el foco vuelve a la tarjeta elegida. Sin JavaScript o al abrir con Ctrl/clic, las tarjetas siguen siendo enlaces a los archivos originales. Los recorridos incluyen funciones, flujo de uso y galería de cada proyecto. OAX también ofrece **Visitar OAX** y **Probar demo**.

Hay detalles opcionales para descubrir: las letras del nombre responden con una onda al pasar el cursor; su punto final activa una constelación breve, también con Enter, espacio o tap. Quedarse sobre una miniatura durante 650 ms revela un circuito SVG decorativo; el foco de teclado ofrece la misma reacción y la fila sigue abriendo el proyecto. Un doble clic en una zona vacía del fondo dibuja otra constelación local que desaparece sola. Textos, imágenes, enlaces y la figura 3D conservan sus acciones normales. Son animaciones bajo demanda, sin bucles adicionales ni dependencias: se limpian al pausar, abrir un modal, desplazar la página o perder la ventana. Movimiento reducido las omite; sin JavaScript se mantiene el punto habitual del nombre.

En los detalles, las etiquetas de tecnologías dibujan pequeños corchetes azules al tocarlas o activarlas con Enter/espacio, sin cambiar su contenido ni filtrar proyectos. En las galerías, detener el cursor sobre una imagen durante 500 ms descubre una lupa pequeña que amplía los píxeles reales y sigue el puntero dentro de la imagen; el clic sigue abriendo el visor y en táctiles se conserva el toque habitual. Al desplegar **Experiencia y formación**, una línea fina de luz conecta sus apartados y permanece visible hasta cerrarlo; al pausar o reducir movimiento conserva su aspecto estático y se reajusta al tamaño de pantalla. Estas reacciones respetan las preferencias de movimiento; sin JavaScript las tecnologías siguen siendo etiquetas legibles y el desplegable funciona de forma nativa.

Al detener el cursor o enfocar con el teclado **mds.**, aparece un trazo breve alrededor de la marca. En **Hablemos**, los enlaces de contacto dibujan una pequeña señal de luz bajo el texto. Ambos detalles esperan 450 ms y desaparecen solos, sin repetición continua, mensajes ni cambios en los destinos de los enlaces. Salir del enlace, navegar, pausar o abrir un modal cancela la reacción; en táctiles se conserva la navegación directa habitual.

La pausa también oculta el fondo interactivo y cancela los pulsos y actualizaciones de cursor pendientes. La iluminación ambiental se suspende al ocultar la pestaña; los movimientos del cursor se agrupan por cuadro y no necesitan un bucle de render permanente.

La navegación tiene una superficie de vidrio en azul marino, con transparencia, blur local y borde fino. Flota al desplazarse en escritorio; en móvil y ventanas bajas permanece al inicio para no ocupar espacio de lectura. Los enlaces a secciones y las visitas guiadas reservan la altura real de la barra, también cuando cambia el tamaño del texto.

Un parallax limitado a 32 px desplaza las luces de fondo; la escultura usa una velocidad distinta. Solo afecta capas decorativas, con puntero preciso, y vuelve a cero al pausar. Textos, controles y filas mantienen su posición habitual. Entre páginas se usa una transición breve de fundido y entrada de 8 px, conservando la barra como elemento compartido. Son [transiciones nativas entre documentos](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document), sin convertir el sitio en una SPA ni agregar dependencias; donde no están disponibles se conserva la navegación normal. Pausa y movimiento reducido las omiten. Al volver con el historial se recupera la preferencia actual de efectos.

### Criterio para incorporar efectos

El listado uniforme de cinco proyectos y sus páginas de detalle siguen siendo el centro del sitio. Evaluación de la lista de efectos propuesta:

| Elementos                                                                                           | Decisión                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Glassmorphism (1), navbar flotante (14)                                                             | Incorporados en navegación; el recorrido ya tenía tarjeta translúcida.                                                                                                               |
| Bento Grid (2)                                                                                      | Reservado para una sección secundaria si aporta jerarquía. Mantener el listado de proyectos.                                                                                         |
| Dark Mode (3), degradados dinámicos (4)                                                             | Ya presentes en azul marino y luces ambientales suaves.                                                                                                                              |
| Scroll reveal (5), smooth scroll (7), texto animado (11)                                            | Ya presentes; respetan pausa y movimiento reducido.                                                                                                                                  |
| Parallax (6), transiciones entre páginas (15)                                                       | Incorporados de forma breve y limitada a decoración/navegación.                                                                                                                      |
| Microinteracciones (8), hover (9), spotlight (10), tarjetas interactivas (16), iconos animados (21) | Ya presentes en enlaces, miniaturas, capturas e indicadores.                                                                                                                         |
| Elementos 3D (12), partículas (13)                                                                  | Escultura interactiva con sólido/malla, agarre directo y luces orbitales; no sumar un fondo de partículas denso sobre el contenido.                                                  |
| Contadores (17), gráficos interactivos (18)                                                         | Solo con datos reales y útiles. No introducir estadísticas decorativas o porcentajes de habilidades.                                                                                 |
| Tipografía (19), responsive (20)                                                                    | Manrope autoalojada y comprobaciones de tamaños/zoom existentes.                                                                                                                     |
| Skeleton Loading (22)                                                                               | No aporta en las páginas estáticas actuales; reconsiderar si hay contenido remoto con espera real.                                                                                   |
| Modales (23), botones magnéticos (24), SVG/Lottie (25)                                              | Modal animado y conector SVG existentes. Magnetismo limitado a indicadores para conservar la zona clickeable estable. Preferir SVG/CSS antes de agregar Lottie para efectos simples. |

Para ajustar tamaño, intensidad y respuesta al cursor, editar `src/scripts/motion.ts`; la malla, luces y órbitas están en `src/scripts/scene.ts`. `src/scripts/scene-physics.ts` controla impulso y fricción con un cálculo independiente de la frecuencia de cuadros. `.scene-anchor` ubica la escultura sin reservar un bloque adicional en la portada. Las transiciones, entradas y efectos visuales se definen en `src/styles/global.css`.

Los botones **Recorrer el portfolio** y **Recorrer este proyecto** inician una visita por la página real: la vista se desplaza hacia el contenido, lo resalta con un foco y muestra un mensaje breve al lado. En la portada recorre los cinco proyectos, experiencia, formación, desarrollo actual y contacto. En los detalles recorre presentación, tecnologías, enlace al código, imagen, problema, funciones, flujo, galería, participación, decisiones, alcance y navegación final. La visita despliega experiencia y formación cuando corresponde y recupera su estado anterior al salir.

El desplazamiento, el marco de foco y la posición de la tarjeta se animan juntos con aceleración y frenado suaves. Al llegar aparece un conector fino hacia el contenido; los mensajes entran con una transición breve. La tarjeta usa una superficie translúcida y controles jerarquizados, sin desbordamiento horizontal. En los proyectos, cada función, parte del flujo y decisión tiene su propia parada; también se muestra el ejemplo concreto. El marco abarca el bloque completo y el mensaje se coloca al costado, a izquierda o derecha cuando hay lugar, o debajo. Las capturas se ajustan temporalmente al espacio disponible sin recortar ni deformar la imagen; recuperan su tamaño al cambiar de parada o cerrar. La galería encuadra la primera imagen completa.

Con texto muy ampliado o ventanas bajas, el texto del mensaje puede desplazarse verticalmente y los controles permanecen visibles. Si un bloque de contenido es demasiado alto, tiene su propio desplazamiento dentro del marco mediante rueda, arrastre/tacto o teclado (arriba/abajo y Page Up/Down); esa interacción pausa el avance para permitir la lectura. Un espacio temporal al final de la página permite encuadrar las últimas paradas y se retira al cerrar. Avanzar rápido cancela la transición anterior y cambiar el tamaño de ventana reajusta la posición inmediatamente.

**Siguiente / Terminar** permanece fijo en la esquina inferior derecha durante todos los recorridos, con fondo azul marino y borde azul claro. Los mensajes reservan espacio para ese botón, también en móvil y con texto ampliado. La tarjeta tiene pausa/continuación y dos flechas de 44 px para retroceder y avanzar.

Todos los recorridos avanzan automáticamente después de iniciarlos. Cada parada espera al menos 8,5 segundos, ajustados según las palabras del título y mensaje (340 ms por palabra más 2,5 segundos). Una barra azul de 2 px en el borde superior del mensaje se vacía según el tiempo restante. El tiempo de lectura y la barra comienzan después del desplazamiento; usar las flechas o Siguiente conserva el avance automático y reinicia ambos. Pausar congela el tiempo y Continuar retoma lo que faltaba. Se puede salir con Escape o cerrar. Al llegar al final queda disponible Terminar o Repetir. Los mensajes sobre proyectos ofrecen un enlace real para abrir su detalle. Al cerrar, el foco vuelve al contenido mostrado. Ocultar la pestaña pausa el avance; movimiento reducido o efectos desactivados omiten las animaciones de cámara y conservan el avance automático mediante saltos instantáneos, con la barra actualizada por intervalos de aproximadamente un segundo. Sin JavaScript no aparecen botones inactivos y todo el contenido habitual permanece accesible. Los selectores y mensajes están en `src/data/walkthroughs.ts`.

La información de experiencia y formación fue proporcionada por Matías. La descripción técnica se contrastó con los repositorios públicos. Adminanzas se menciona como proyecto en desarrollo, sin enlazar ni incluir su repositorio privado.

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

Pruebas específicas de efectos en teléfonos, sobre la compilación estática:

```powershell
npx.cmd playwright install webkit
npm.cmd run test:mobile
```

Esta suite utiliza Edge instalado y WebKit de Playwright, con dimensiones del iPhone 12 Pro Max, una pantalla de 320 px y orientación horizontal. Comprueba la cinta, caras traseras, colores, controles táctiles de la figura, detalles, recorridos y visor. Los arrastres y pellizcos nativos se verifican mediante CDP en Edge; WebKit comprueba toques y presentación, pero no sustituye Safari en un iPhone físico. El preview de pruebas utiliza el puerto 4399 y no modifica el servidor de desarrollo.

En pantallas táctiles la figura tiene un espacio propio bajo la presentación, con giro horizontal e inercia y cambio de aspecto al tocarla. Los gestos verticales conservan el scroll normal. La cinta conserva su óvalo 3D, rotación automática y colores; oculta explícitamente las caras traseras para evitar texto invertido y solo se detiene por foco de teclado, pausa o visor. Las miniaturas revelan sus circuitos al detener el scroll; el nombre responde al toque y el fondo vacío admite una constelación con doble toque. Las animaciones de entrada y scroll se mantienen en móvil; las transiciones nativas de documento completo se reservan para puntero preciso, evitando capturas adicionales de toda la página en teléfonos.

`npm.cmd run test:publication` verifica una compilación aislada con un dominio reservado para pruebas: canonical, vista previa social, alternates por idioma, XML del sitemap, robots y exclusión de las páginas de error. Usa el mismo navegador de Playwright (o `PLAYWRIGHT_BROWSER_PATH`). El dominio de prueba no se configura en `.env` ni en `dist`; la salida temporal se elimina al terminar. Ejecutar esta comprobación antes de la suite de navegador para evitar recompilaciones durante sus recorridos.

La cinta mantiene el giro durante las visitas guiadas, incluso si se pausa el avance del recorrido. Cerrar la guía devuelve el foco al contenido sin detener el giro del contenedor. Abrir el visor de imágenes, pausar los efectos, solicitar movimiento reducido o enfocar una tarjeta con teclado conserva las pausas correspondientes. Soltar el puntero fuera de la cinta antes del umbral de arrastre también libera el agarre.

## Dominio, SEO y despliegue

El sitio está publicado en **[portfolio.matydesousa.workers.dev](https://portfolio.matydesousa.workers.dev/)** mediante Cloudflare Workers con archivos estáticos. El código fuente está disponible en GitHub; todavía no hay un dominio propio conectado. Tiene títulos y descripciones por página, metadatos Open Graph/X y favicon. Las vistas previas `public/images/social-preview-es.png` y `social-preview-en.png` son imágenes de 1200 × 630 con tipografía, azul marino y geometría acordes al sitio. Su diseño se conserva en `scripts/render-social-preview.mjs`; para regenerarlas, ejecutar `node scripts/render-social-preview.mjs` con Chromium instalado para Playwright o con `PLAYWRIGHT_BROWSER_PATH` definido como en las pruebas.

Al elegir el hosting, definir `PUBLIC_SITE_URL` con su URL HTTPS real, incluso si todavía es la dirección inicial del proveedor. Se puede configurar en el hosting o copiar `.env.example` a `.env`; también se leen las variantes `.env.production` y `.env.development`. La variable del entorno tiene prioridad. Debe ser una URL raíz sin credenciales, subcarpetas, parámetros ni fragmentos; una configuración inválida detiene la compilación con un mensaje explicativo. No se publica un dominio inventado.

Con esa URL configurada, la compilación habilita canonical, `og:url`, `og:image`, la tarjeta grande de X y alternates `hreflang` ES/EN/x-default. Genera `sitemap.xml` y `robots.txt` dentro de `dist` mediante la integración local `config/publication.mjs`, sin dependencias adicionales: usa las páginas realmente compiladas y sus versiones por idioma. Las 404 se excluyen del sitemap, llevan `noindex, follow` y no anuncian canonical ni URL social. Sin `PUBLIC_SITE_URL` se puede trabajar localmente; no se generan URLs absolutas ni archivos de descubrimiento con direcciones ficticias.

Antes de compartir la publicación: abrir rutas de proyectos directamente y recargarlas, comprobar que una ruta inexistente devuelve HTTP 404 con la página de error, probar HTTPS, correo, idiomas, recorridos y galerías en un teléfono real. La respuesta HTTP de error depende del hosting; conservar `404.html` y evitar una regla que transforme todas las rutas desconocidas en una portada con HTTP 200. No se requiere una redirección de SPA.

La publicación actual sirve exclusivamente archivos estáticos, sin adaptador de servidor ni servicios de pago contratados para este despliegue. Carpeta de salida: `dist`. El resultado también puede alojarse en otros proveedores compatibles; GitHub Pages bajo una subcarpeta necesita las adaptaciones de rutas indicadas más abajo.

### Cloudflare Workers con archivos estáticos

`wrangler.jsonc` prepara la publicación de `dist` en el Worker `portfolio`. No utiliza código de servidor ni bindings de base de datos. La configuración conserva las rutas de Astro, sirve la página de error con HTTP 404 y desactiva las URLs de vista previa de versiones. `.wrangler/` permanece fuera de Git.

La herramienta de despliegue se ejecuta con una versión fijada, sin añadir dependencias de producción. Iniciar sesión en Cloudflare desde el navegador:

```powershell
npm.cmd exec --yes --package=wrangler@4.149.0 -- wrangler login --scopes account:read user:read workers_scripts:write
```

En una nueva copia local, crear `.env.production` con esta dirección real (el archivo permanece fuera de Git):

```dotenv
PUBLIC_SITE_URL=https://portfolio.matydesousa.workers.dev/
```

Actualizar ese valor al conectar un dominio propio. Para comprobar la configuración sin subir archivos:

```powershell
npm.cmd run check
npm.cmd exec --yes --package=wrangler@4.149.0 -- wrangler deploy --dry-run --autoconfig=false
```

Para publicar:

```powershell
npm.cmd exec --yes --package=wrangler@4.149.0 -- wrangler deploy --autoconfig=false
```

Wrangler vuelve a ejecutar `npm run build` antes de desplegar, por lo que la configuración de URL debe estar disponible también en ese proceso. Tras publicar, verificar la dirección real, el sitemap, robots, las rutas ES/EN, los recursos y HTTP 404. La publicación por CLI no conecta automáticamente el repositorio a Workers Builds. Este portfolio ya tiene esa conexión activa con `main`: el despliegue automático del commit `567ae7c` se verificó el 2026-10-11, con la versión nueva activa y sus archivos disponibles por HTTPS. Los próximos pushes a `main` iniciarán la compilación y publicación; revisar el resultado de “Workers Builds: portfolio” en GitHub. Conservar `PUBLIC_SITE_URL` en las variables de compilación de Workers Builds.

### Activar publicación automática desde GitHub

En el Worker existente `portfolio`, abrir Settings > Builds > Connect y autorizar la aplicación de Cloudflare en GitHub únicamente para `Matydesousa/portfolio-matias`. La autorización se completa personalmente desde el navegador; no copiar credenciales al repositorio.

Configurar estos valores:

| Ajuste                                    | Valor                                                  |
| ----------------------------------------- | ------------------------------------------------------ |
| Repositorio                               | `Matydesousa/portfolio-matias`                         |
| Rama de producción                        | `main`                                                 |
| Directorio raíz                           | Raíz del repositorio (`/`)                             |
| Build command                             | `npm run build:ci`                                     |
| Deploy command                            | `npx --yes wrangler@4.149.0 deploy --autoconfig=false` |
| Variable de compilación `PUBLIC_SITE_URL` | `https://portfolio.matydesousa.workers.dev/`           |

`build:ci` comprueba los tipos y compila antes de publicar. Workers Builds no utiliza el bloque `build` de Wrangler como sustituto del comando de compilación del panel. Conservar deshabilitadas las publicaciones de otras ramas si solo se desea publicar `main`. Después de conectar, comprobar que la primera compilación termina correctamente y corresponde al commit esperado; solo entonces considerar activo el despliegue automático. [Configuración oficial de Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

Para un dominio propio: agregar el dominio en el proveedor elegido, aplicar los registros DNS indicados por ese proveedor y comprobar HTTPS y redirección a una única versión del dominio. Si se usa GitHub Pages bajo una subcarpeta, configurar `base` en Astro y adaptar los enlaces/rutas de recursos; la versión actual está preparada para la raíz de un dominio.

La memoria local `.codex-memory/` se excluye mediante `.git/info/exclude` y nunca debe publicarse. En una nueva copia local, agregar `/.codex-memory/` a ese archivo antes de crear memoria o realizar staging. Tampoco deben subirse archivos `.env`, bases de datos, dependencias instaladas ni artefactos temporales; `.gitignore` excluye esos archivos habituales.
