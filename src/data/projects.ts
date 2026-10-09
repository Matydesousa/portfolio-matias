export interface Project {
  slug: string;
  number: string;
  title: string;
  category: string;
  summary: string;
  stack: string[];
  repository: string;
  problem: string;
  contribution: string;
  decisions: string[];
  scope: string;
  thumbnail: string;
  thumbnailAlt: string;
  image?: string;
  imageAlt?: string;
  caption?: string;
  collaborator?: string;
}

export const projects: Project[] = [
  {
    slug: 'notas-pendientes',
    number: '01',
    title: 'Notas y pendientes',
    thumbnail: '/images/notas-pendientes.png',
    thumbnailAlt: 'Miniatura de la captura real de Notas y pendientes.',
    category: 'Aplicación web',
    summary:
      'Un lugar para ordenar notas, seguir tareas y distinguir lo pendiente de lo resuelto.',
    stack: ['PHP', 'Laravel', 'Blade', 'AdminLTE', 'SQLite'],
    repository: 'https://github.com/Matydesousa/notas-pendientes',
    problem:
      'Centralizar anotaciones y tareas en una interfaz administrativa, con acciones claras y vistas por estado.',
    contribution:
      'Desarrollo de la aplicación y sus módulos de notas y pendientes: operaciones CRUD, validación de datos, cambio de estado y filtros.',
    decisions: [
      'Dos módulos independientes bajo una misma interfaz con Blade y AdminLTE.',
      'Form Requests para separar las validaciones de los controladores y Eloquent para acceder a los datos.',
      'SQLite como configuración inicial para facilitar la ejecución local; el proyecto también incluye configuración para MySQL.',
    ],
    scope:
      'Aplicación de gestión de notas y tareas. No se presenta como un servicio alojado ni como un sistema de producción con usuarios reales.',
  },
  {
    slug: 'oax-demo',
    number: '02',
    title: 'OAX · Gestión comercial',
    thumbnail: '/images/oax-demo.png',
    thumbnailAlt: 'Miniatura de la captura real de la demo OAX.',
    category: 'Demo interactiva',
    summary:
      'Una demo para explorar inventario, movimientos, sucursales y reportes desde el navegador.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    repository: 'https://github.com/Matydesousa/oax-business-management-demo',
    problem:
      'Mostrar cómo se relacionan distintas operaciones de un comercio en una experiencia que se puede recorrer sin instalar un sistema completo.',
    contribution:
      'Desarrollo del sitio institucional y de la demo de portfolio, con interfaz de inventario, movimientos, transferencias y reportes.',
    decisions: [
      'JavaScript sin framework: la simulación se ejecuta íntegramente en el navegador.',
      'Los movimientos y transferencias actualizan el estado de la sesión y los indicadores de la interfaz.',
      'Exportación de reportes CSV y preferencia de tema guardada en localStorage.',
    ],
    scope:
      'Es una demostración con datos de ejemplo en memoria, sin backend. La marca y los recursos de OAX se conservan en el contexto del proyecto.',
    image: '/images/oax-demo.png',
    imageAlt:
      'Captura real de la demo OAX con su panel de inventario e indicadores de gestión.',
    caption: 'Captura de la demo local · datos de ejemplo',
  },
  {
    slug: 'simulador-ferroviario',
    number: '03',
    title: 'Simulador ferroviario',
    thumbnail: '/images/python-project.svg',
    thumbnailAlt: 'Identificador gráfico Python para el simulador ferroviario.',
    category: 'Proyecto académico · Python',
    summary:
      'Recorridos, tiempos estimados y tarifas en una aplicación de escritorio con Tkinter.',
    stack: ['Python', 'Tkinter', 'ttk'],
    repository: 'https://github.com/Matydesousa/simulador-ferroviario',
    problem:
      'Modelar una línea ferroviaria y calcular recorridos, tarifas y estadísticas a partir de estaciones y distancias.',
    contribution:
      'Desarrollo del proyecto final de Introducción a la Programación y su interfaz de escritorio.',
    decisions: [
      'Lógica de cálculo separada de la interfaz gráfica.',
      'Biblioteca estándar de Python, con Tkinter y ttk.',
      'Conservación del algoritmo de ordenamiento por burbuja en el historial.',
    ],
    scope:
      'Simulación educativa, sin conexión con servicios ferroviarios reales.',
  },
  {
    slug: 'simulador-bancario',
    number: '04',
    title: 'Simulador bancario',
    thumbnail: '/images/java-project.svg',
    thumbnailAlt: 'Identificador gráfico Java para el simulador bancario.',
    category: 'Proyecto académico · Java',
    summary:
      'Un modelo de bancos, cuentas y cajeros para trabajar encapsulamiento y colaboración entre objetos.',
    stack: ['Java', 'POO'],
    repository: 'https://github.com/Matydesousa/simulador-bancario-java',
    problem:
      'Representar operaciones bancarias y coordinar el saldo de las cuentas con el efectivo disponible en un cajero.',
    contribution:
      'Desarrollo del modelo educativo en Java, con aportes de Nahue Campos reconocidos en el repositorio.',
    decisions: [
      'Entidades Banco, Cajero y CuentaBancaria con responsabilidades diferenciadas.',
      'El cajero delega el débito a la cuenta después de verificar el efectivo disponible.',
      'Implementación con el JDK, sin frameworks ni base de datos.',
    ],
    scope:
      'Modelo académico ejecutado en memoria; no es una plataforma bancaria real.',
    collaborator: 'Con aportes de Nahue Campos.',
  },
  {
    slug: 'gestion-hotel',
    number: '05',
    title: 'Gestión de hotel',
    thumbnail: '/images/c-project.svg',
    thumbnailAlt: 'Identificador gráfico C para Gestión de hotel.',
    category: 'Proyecto académico · C',
    summary:
      'Huéspedes y servicios como punto de partida para explorar estructuras de datos y memoria dinámica.',
    stack: ['C11', 'Listas enlazadas'],
    repository: 'https://github.com/Matydesousa/gestion-hotel-c',
    problem:
      'Componer entidades de un hotel y administrarlas mediante una estructura de datos reutilizable.',
    contribution:
      'Desarrollo del ejercicio de programación en C y estructuras de datos.',
    decisions: [
      'Módulos .c/.h y tipos opacos para encapsular las estructuras.',
      'Lista enlazada genérica con void * y callbacks.',
      'Gestión explícita de propiedad y liberación de memoria.',
    ],
    scope:
      'Demostración académica en memoria de huéspedes y servicios; no incluye reservas, habitaciones ni persistencia.',
  },
];
