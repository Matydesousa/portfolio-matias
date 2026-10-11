export type Locale = 'es' | 'en';

export const ui = {
  es: {
    skip: 'Saltar al contenido',
    home: 'inicio',
    backHome: 'Volver al inicio',
    navigation: 'Navegación principal',
    projects: 'Proyectos',
    about: 'Sobre mí',
    contact: 'Hablemos',
    languages: 'Idioma',
    newTab: ' (abre en otra pestaña)',
    footer: 'Desarrollo de software',
    motionPause: 'Pausar efectos',
    motionResume: 'Activar efectos',
    motionReduced: 'Movimiento reducido',
    animateName: 'Animar mi nombre',
    animateTechnology: 'Animar tecnología',
    sculptureLabel: 'Cambiar aspecto de la figura 3D',
    sculptureHelp:
      'Mantené presionado y arrastrá para girar. Clic, Enter o espacio alternan el aspecto. Las flechas giran la figura y la tecla Inicio restablece su posición.',
    intro:
      'Desarrollo aplicaciones web y sistemas de gestión. Estudio Ingeniería Informática en UADE.',
    availability: 'Oportunidades remotas y proyectos freelance.',
    publicProjects: 'Proyectos públicos',
    ribbonTitle: 'Proyectos en movimiento',
    ribbonHelp:
      'Arrastrá hacia los lados y soltá para dejarla girar. Con mouse, arriba y abajo inclinan suavemente la cinta. Pulsá entre proyectos para cambiar su aspecto. Tocá un proyecto para explorarlo.',
    ribbonKeyboard:
      'Izquierda y derecha giran la cinta. Arriba y abajo la inclinan cuando su superficie tiene foco. Enter abre el proyecto seleccionado. Enter o espacio cambian el aspecto cuando la cinta tiene foco. El movimiento se detiene mientras usás el teclado.',
    ribbonColorChanged: 'Aspecto de la cinta actualizado.',
    ribbonOpen: 'Explorar proyecto:',
    ribbonPrevious: 'Mover cinta hacia la derecha',
    ribbonNext: 'Mover cinta hacia la izquierda',
    ribbonPause: 'Pausar cinta de proyectos',
    ribbonResume: 'Activar cinta de proyectos',
    ribbonStatic: 'Movimiento pausado',
    projectCount: 'proyectos',
    detail: 'Ver detalle',
    aboutText:
      'Soy técnico informático en el Ejército Argentino, con experiencia en desarrollo y mantenimiento de sistemas internos. Participo en OAX Sistemas, desarrollando soluciones para comercios y empresas.',
    experience: 'Experiencia y formación',
    development: 'En desarrollo: Adminanzas.',
    developmentText:
      'Mi proyecto personal de administración financiera colaborativa con Laravel, Inertia y React.',
    contactText: '¿Un proyecto o una oportunidad? Podés escribirme.',
    copyEmail: 'Copiar correo',
    copied: 'Correo copiado.',
    copyFailed:
      'No pude copiarlo automáticamente. Podés copiar el correo seleccionado.',
    backProjects: 'Volver a proyectos',
    technologies: 'Tecnologías del proyecto',
    repository: 'Ver repositorio en GitHub',
    visitOax: 'Visitar OAX',
    demo: 'Probar demo',
    expand: 'Ampliar captura',
    expandImage: 'Ampliar',
    problem: 'El problema',
    features: 'Funciones principales',
    workflow: 'Cómo funciona',
    example: 'Un ejemplo concreto',
    gallery: 'Galería del proyecto',
    views: 'vistas',
    contribution: 'Mi participación',
    decisions: 'Decisiones técnicas',
    scope: 'Alcance',
    moreProjects: 'Más proyectos',
    allProjects: 'Todos los proyectos',
    nextProject: 'Siguiente',
    defaultCaption:
      'Captura de ejecución local · datos preparados para la demostración',
    originalInterface: '',
    closeImage: 'Cerrar captura ampliada',
    close: 'Cerrar',
    originalImage: 'Abrir imagen original',
    imageZoom: 'Zoom de la imagen',
    imageDetails: 'Información y ayuda de la imagen',
    zoomIn: 'Acercar imagen',
    zoomOut: 'Alejar imagen',
    zoomLevel: 'Zoom respecto al encuadre inicial',
    fitImage: 'Encajar',
    zoomHelp:
      'Rueda o dos dedos para acercar; arrastrá para explorar. Doble clic o doble toque alternan el zoom. Teclado: +, − y 0; flechas sobre la imagen ampliada para moverla.',
    galleryNavigation: 'Navegación de la galería',
    previousImage: 'Imagen anterior',
    nextImage: 'Imagen siguiente',
    previous: 'Anterior',
    next: 'Siguiente',
    of: 'de',
    tourPortfolio: 'Recorrer el portfolio',
    tourProject: 'Recorrer este proyecto',
    tourLabel: 'Visita guiada',
    closeTour: 'Cerrar recorrido',
    pause: 'Pausar',
    resume: 'Continuar',
    repeat: 'Repetir',
    finish: 'Terminar',
    previousStop: 'Parada anterior',
    nextStop: 'Parada siguiente',
    highlighted: 'Contenido resaltado del proyecto',
    openProject: 'Ver este proyecto',
    openRepository: 'Abrir repositorio',
    tourHello: 'Hola, soy Matías',
    tourIntro:
      'Desarrollo software y sistemas de gestión. Te acompaño a conocer los proyectos y el resto del portfolio.',
    tourAbout: 'Un poco sobre mí',
    tourAboutText:
      'Acá resumo mi experiencia como técnico informático y mi participación en OAX Sistemas.',
    tourExperience:
      'Esta sección se despliega para mostrar mi trabajo y mis estudios de Ingeniería Informática en UADE.',
    tourDevelopment: 'Lo que estoy construyendo',
    tourDevelopmentText:
      'Adminanzas es mi proyecto personal en desarrollo. Su código permanece privado.',
    tourContact: 'Sigamos en contacto',
    tourContactText:
      'Estos enlaces te llevan a mi correo, LinkedIn y GitHub. Podés escribirme por proyectos freelance u oportunidades remotas.',
    tourTechnologies: 'Con qué está hecho',
    tourTechnologiesText: 'Estas son las tecnologías del proyecto',
    tourCode: 'Explorá el código',
    tourCodeText:
      'Este enlace abre el repositorio público original en GitHub para revisar el proyecto en detalle.',
    tourVisit: 'Visitá el proyecto',
    tourVisitText:
      'Podés abrir el sitio de OAX y explorar su demo pública desde estos enlaces.',
    tourImage: 'Una mirada a la aplicación',
    tourImageText:
      'Esta imagen muestra el proyecto en ejecución con datos de ejemplo. Su leyenda indica la procedencia; podés ampliarla al cerrar la guía.',
    tourProblem: 'El punto de partida',
    tourGallery: 'Más vistas del proyecto',
    tourGalleryText:
      'Estas imágenes muestran distintas partes del proyecto. Cada vista explica lo que estás viendo; al cerrar el recorrido podés ampliarlas y pasar de una a otra.',
    tourDecision: 'Una decisión técnica',
    tourScope: 'Hasta dónde llega',
    tourNext: 'Seguí explorando',
    tourNextText:
      'Acá tenés acceso a los cinco proyectos. Abrí cualquiera de ellos para seguir explorando.',
    notFound: 'Página no encontrada',
    notFoundDescription:
      'Esta página no existe. Volvé al portfolio de Matías De Sousa.',
    notFoundText: 'Este enlace no lleva a una página del portfolio.',
  },
  en: {
    skip: 'Skip to content',
    home: 'home',
    backHome: 'Back to home',
    navigation: 'Main navigation',
    projects: 'Projects',
    about: 'About me',
    contact: 'Get in touch',
    languages: 'Language',
    newTab: ' (opens in a new tab)',
    footer: 'Software development',
    motionPause: 'Pause effects',
    motionResume: 'Enable effects',
    motionReduced: 'Reduced motion',
    animateName: 'Animate my name',
    animateTechnology: 'Animate technology',
    sculptureLabel: 'Change the appearance of the 3D shape',
    sculptureHelp:
      'Press and drag to rotate. Click, Enter or Space switch its appearance. The arrow keys rotate the shape and Home resets its position.',
    intro:
      'I develop web applications and management systems. I study Computer Engineering at UADE.',
    availability: 'Remote opportunities and freelance projects.',
    publicProjects: 'Public projects',
    ribbonTitle: 'Projects in motion',
    ribbonHelp:
      'Drag sideways and release to keep it moving. With a mouse, drag up or down to gently tilt the ribbon. Click between projects to change its appearance. Tap a project to explore it.',
    ribbonKeyboard:
      'Left and right rotate the ribbon. Up and down tilt it when its surface has focus. Enter opens the selected project. Enter or Space changes its appearance when the ribbon has focus. Motion stops while you use the keyboard.',
    ribbonColorChanged: 'Ribbon appearance updated.',
    ribbonOpen: 'Explore project:',
    ribbonPrevious: 'Move ribbon to the right',
    ribbonNext: 'Move ribbon to the left',
    ribbonPause: 'Pause project ribbon',
    ribbonResume: 'Enable project ribbon',
    ribbonStatic: 'Motion paused',
    projectCount: 'projects',
    detail: 'View project',
    aboutText:
      'I work as an IT technician in the Argentine Army, with experience developing and maintaining internal systems. I contribute to OAX Sistemas, developing solutions for shops and businesses.',
    experience: 'Experience and education',
    development: 'In development: Adminanzas.',
    developmentText:
      'My personal project for collaborative financial management, built with Laravel, Inertia and React.',
    contactText: 'A project or an opportunity? Feel free to get in touch.',
    copyEmail: 'Copy email',
    copied: 'Email copied.',
    copyFailed:
      'Automatic copying failed. You can copy the selected email address.',
    backProjects: 'Back to projects',
    technologies: 'Project technologies',
    repository: 'View repository on GitHub',
    visitOax: 'Visit OAX',
    demo: 'Try the demo',
    expand: 'Enlarge screenshot',
    expandImage: 'Enlarge',
    problem: 'The problem',
    features: 'Main features',
    workflow: 'How it works',
    example: 'A concrete example',
    gallery: 'Project gallery',
    views: 'views',
    contribution: 'My contribution',
    decisions: 'Technical decisions',
    scope: 'Scope',
    moreProjects: 'More projects',
    allProjects: 'All projects',
    nextProject: 'Next',
    defaultCaption:
      'Local execution screenshot · data prepared for the demonstration',
    originalInterface:
      'Screenshots retain the original Spanish-language interface and output.',
    closeImage: 'Close enlarged screenshot',
    close: 'Close',
    originalImage: 'Open original image',
    imageZoom: 'Image zoom',
    imageDetails: 'Image information and help',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomLevel: 'Zoom relative to the fitted image',
    fitImage: 'Fit',
    zoomHelp:
      'Use the wheel or pinch to zoom; drag to explore. Double-click or double-tap toggle zoom. Keyboard: +, − and 0; arrow keys on the zoomed image to pan.',
    galleryNavigation: 'Gallery navigation',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    previous: 'Previous',
    next: 'Next',
    of: 'of',
    tourPortfolio: 'Explore the portfolio',
    tourProject: 'Explore this project',
    tourLabel: 'Guided tour',
    closeTour: 'Close tour',
    pause: 'Pause',
    resume: 'Continue',
    repeat: 'Restart',
    finish: 'Finish',
    previousStop: 'Previous stop',
    nextStop: 'Next stop',
    highlighted: 'Highlighted project content',
    openProject: 'View this project',
    openRepository: 'Open repository',
    tourHello: 'Hi, I’m Matías',
    tourIntro:
      'I develop software and management systems. Let me show you the projects and the rest of the portfolio.',
    tourAbout: 'A little about me',
    tourAboutText:
      'Here I describe my experience as an IT technician and my contribution to OAX Sistemas.',
    tourExperience:
      'This section expands to show my work and my Computer Engineering studies at UADE.',
    tourDevelopment: 'What I’m building',
    tourDevelopmentText:
      'Adminanzas is my personal project in development. Its source code remains private.',
    tourContact: 'Let’s get in touch',
    tourContactText:
      'These links lead to my email, LinkedIn and GitHub. You can contact me about freelance projects or remote opportunities.',
    tourTechnologies: 'Built with',
    tourTechnologiesText: 'These are the project’s technologies',
    tourCode: 'Explore the code',
    tourCodeText:
      'This link opens the original public repository on GitHub so you can explore the project in detail.',
    tourVisit: 'Visit the project',
    tourVisitText: 'These links open the OAX website and its public demo.',
    tourImage: 'A look at the application',
    tourImageText:
      'This image shows the project running with sample data. The caption explains its source; you can enlarge it after closing the tour.',
    tourProblem: 'The starting point',
    tourGallery: 'More project views',
    tourGalleryText:
      'These images show different parts of the project. Each view explains what you are seeing; after closing the tour you can enlarge them and browse the gallery.',
    tourDecision: 'A technical decision',
    tourScope: 'What it covers',
    tourNext: 'Keep exploring',
    tourNextText:
      'All five projects are available here. Open any of them to keep exploring.',
    notFound: 'Page not found',
    notFoundDescription:
      'This page does not exist. Return to Matías De Sousa’s portfolio.',
    notFoundText: 'This link does not lead to a page in the portfolio.',
  },
} as const;

export function getUI(locale: Locale = 'es') {
  return ui[locale];
}
export function documentLocale(): Locale {
  return document.documentElement.lang === 'en' ? 'en' : 'es';
}
export function homePath(locale: Locale = 'es') {
  return locale === 'en' ? '/en/' : '/';
}
export function projectPath(slug: string, locale: Locale = 'es') {
  return locale === 'en' ? `/en/projects/${slug}/` : `/proyectos/${slug}/`;
}
export function languagePaths(pathname: string) {
  const project = pathname.match(/^\/(?:en\/projects|proyectos)\/([^/]+)/);
  if (project)
    return {
      es: projectPath(project[1], 'es'),
      en: projectPath(project[1], 'en'),
    };
  if (pathname.includes('/404')) return { es: '/404.html', en: '/en/404/' };
  return { es: homePath('es'), en: homePath('en') };
}
