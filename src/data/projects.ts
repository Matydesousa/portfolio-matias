export interface ProjectImage {
  src: string;
  title: string;
  alt: string;
  caption: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface ProjectExplanation {
  title: string;
  description: string;
}

export interface Project {
  slug: string;
  number: string;
  title: string;
  category: string;
  summary: string;
  stack: string[];
  repository: string;
  website?: string;
  demo?: string;
  gallery?: ProjectImage[];
  gallerySummary?: string;
  features: ProjectExplanation[];
  workflow: ProjectExplanation[];
  example: string;
  problem: string;
  contribution: string;
  decisions: string[];
  scope: string;
  thumbnail: string;
  thumbnailAlt: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  caption?: string;
  collaborator?: string;
}

export const projects: Project[] = [
  {
    slug: 'oax-demo',
    number: '01',
    title: 'OAX · Gestión comercial',
    thumbnail: '/images/javascript-project.svg',
    thumbnailAlt: 'Identificador gráfico JavaScript para la demo de OAX.',
    category: 'Demo interactiva',
    summary:
      'Una demo para explorar inventario, movimientos, sucursales y reportes desde el navegador.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    repository: 'https://github.com/Matydesousa/oax-business-management-demo',
    website: 'https://oax-sistemas.com.ar/',
    demo: 'https://oax-sistemas.com.ar/demo',
    features: [
      {
        title: 'Inventario y alertas',
        description:
          'Consulta productos, existencias por sucursal y mínimos de stock. La búsqueda, los filtros y el ordenamiento ayudan a encontrar productos y detectar faltantes.',
      },
      {
        title: 'Movimientos y transferencias',
        description:
          'Registra entradas y salidas de ejemplo y mueve existencias entre sucursales. Una transferencia descuenta el origen, acredita el destino y registra ambos movimientos.',
      },
      {
        title: 'Producción por recetas',
        description:
          'Calcula los insumos necesarios para un lote. Si hay existencias suficientes, consume materias primas y agrega el producto terminado al stock de la sucursal elegida.',
      },
      {
        title: 'Reportes de la sesión',
        description:
          'Recalcula indicadores y permite consultar movimientos por período y sucursal, además de descargar reportes CSV. La preferencia de tema se conserva en el navegador.',
      },
    ],
    workflow: [
      {
        title: 'Explorar el panel',
        description:
          'La demo abre con productos, sucursales, recetas y movimientos de ejemplo. El panel resume las existencias y los productos que necesitan atención.',
      },
      {
        title: 'Consultar y operar',
        description:
          'Desde el inventario se filtra el catálogo. Los formularios permiten simular movimientos, transferencias o producción y validan los datos antes de modificar el estado.',
      },
      {
        title: 'Ver el efecto de cada operación',
        description:
          'Las tablas, alertas e indicadores reflejan los cambios de la sesión. Los reportes muestran los movimientos resultantes y pueden exportarse a CSV.',
      },
    ],
    example:
      'Al transferir un producto entre dos sucursales, la cantidad sale del stock de origen y se incorpora al de destino. La demo conserva el total y registra una salida y una entrada. Los cambios de inventario viven en memoria: al recargar se vuelve a los datos de ejemplo.',
    gallerySummary:
      'El sitio institucional de OAX y las pantallas de su demo pública. Las vistas del sistema usan datos de ejemplo; cada imagen explica el módulo que muestra.',
    gallery: [
      {
        src: '/images/oax-sitio.jpg',
        title: 'Sitio institucional',
        alt: 'Página de inicio del sitio público de OAX Sistemas.',
        caption: 'Sitio público de OAX · presentación de soluciones de gestión',
        description:
          'Presentación institucional y acceso a las soluciones y a la demo. Esta página introduce la propuesta de OAX; no es el panel de gestión.',
      },
      {
        src: '/images/oax-soluciones.jpg',
        title: 'Soluciones de gestión',
        alt: 'Sección de soluciones del sitio OAX: stock, producción y gestión multisucursal.',
        caption: 'Sitio público de OAX · sección de soluciones',
        description:
          'La web explica las áreas de stock, producción y gestión multisucursal, antes de pasar a la demostración del sistema.',
      },
      {
        src: '/images/oax-stock.jpg',
        title: 'Stock de productos',
        alt: 'Vista de stock con productos y filtros en la demo pública de OAX.',
        caption: 'Demo pública de OAX · datos de ejemplo',
        description:
          'El catálogo muestra existencias y permite buscar y filtrar productos por categoría, sucursal y estado del stock.',
      },
      {
        src: '/images/oax-produccion.jpg',
        title: 'Producción',
        alt: 'Vista de producción con lotes y recetas en la demo pública de OAX.',
        caption: 'Demo pública de OAX · datos de ejemplo',
        description:
          'Recetas y lotes de ejemplo. La operación de producción verifica insumos, registra su consumo e incrementa el producto terminado.',
      },
      {
        src: '/images/oax-reportes.jpg',
        title: 'Reportes',
        alt: 'Vista de reportes e indicadores en la demo pública de OAX.',
        caption: 'Demo pública de OAX · datos de ejemplo',
        description:
          'Indicadores y movimientos filtrados por período o sucursal, con opciones para exportar los reportes en CSV.',
      },
    ],
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
    slug: 'notas-pendientes',
    number: '02',
    title: 'Notas y pendientes',
    thumbnail: '/images/php-project.svg',
    thumbnailAlt:
      'Identificador gráfico PHP y Laravel para Notas y pendientes.',
    category: 'Aplicación web',
    summary:
      'Un lugar para ordenar notas, seguir tareas y distinguir lo pendiente de lo resuelto.',
    stack: ['PHP', 'Laravel', 'Blade', 'AdminLTE', 'SQLite'],
    repository: 'https://github.com/Matydesousa/notas-pendientes',
    image: '/images/notas-pendientes.png',
    imageAlt:
      'Captura real de Notas y pendientes ejecutado localmente, con tareas de demostración.',
    caption:
      'Captura de ejecución local · datos preparados para la demostración',
    features: [
      {
        title: 'Notas con título y descripción',
        description:
          'Permite crear anotaciones, ver su contenido, editarlas y eliminarlas desde un listado. Las notas se guardan en la base de datos de la aplicación.',
      },
      {
        title: 'Pendientes con estado',
        description:
          'Cada tarea tiene título, descripción y un estado de cumplimiento. El botón de estado alterna entre pendiente y cumplida sin borrar la tarea.',
      },
      {
        title: 'Vistas por estado',
        description:
          'El módulo ofrece listados de todas las tareas, solo las cumplidas y solo las que quedan por cumplir. Desde cada vista se puede consultar o editar una tarea.',
      },
      {
        title: 'Validación y mensajes',
        description:
          'Los formularios exigen título y descripción de entre 3 y 255 caracteres. La interfaz muestra errores de validación y mensajes al crear, actualizar o cambiar el estado.',
      },
    ],
    workflow: [
      {
        title: 'Elegir el módulo',
        description:
          'El menú lateral separa Notas y Pendientes. Cada módulo tiene su propio listado y sus acciones de creación, consulta, edición y eliminación.',
      },
      {
        title: 'Completar el formulario',
        description:
          'Se ingresa un título y una descripción. Laravel valida la solicitud mediante Form Requests y los modelos Eloquent guardan el registro.',
      },
      {
        title: 'Organizar y dar seguimiento',
        description:
          'Una nota se consulta o actualiza desde su listado. En Pendientes se cambia el estado y se usan las vistas Por cumplir y Cumplidos para revisar qué falta hacer.',
      },
    ],
    example:
      'Una tarea como “Preparar el resumen mensual” puede marcarse como cumplida y pasa a la vista correspondiente. Si necesita retomarse, el mismo control vuelve a dejarla pendiente. El cambio conserva el título y la descripción en la base de datos.',
    gallerySummary:
      'Capturas reales de una copia local aislada con SQLite y datos creados para la demostración: alta de una nota, listado y pendientes cumplidos.',
    gallery: [
      {
        src: '/images/notas-crear.jpg',
        title: 'Crear una nota',
        alt: 'Formulario real de creación de una nota con título y descripción de demostración.',
        caption: 'Ejecución local aislada · formulario con datos de ejemplo',
        description:
          'El formulario captura título y descripción. Ambos campos son obligatorios y Laravel valida su longitud antes de guardar.',
      },
      {
        src: '/images/notas-listado.jpg',
        title: 'Listado de notas',
        alt: 'Listado real de notas con un registro de ejemplo y acciones de visualizar, editar y eliminar.',
        caption: 'Ejecución local aislada · nota creada para la demostración',
        description:
          'Después de guardar, la nota aparece en el listado con un mensaje de confirmación y sus acciones de consulta, edición y eliminación.',
      },
      {
        src: '/images/notas-completadas.jpg',
        title: 'Pendientes cumplidos',
        alt: 'Vista real de tareas cumplidas con datos sintéticos y controles para cambiar su estado.',
        caption: 'Ejecución local aislada · tareas sintéticas de demostración',
        description:
          'Esta vista filtra las tareas cuyo estado es cumplido. El botón de estado permite volver a dejarlas por cumplir.',
      },
    ],
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
      'Aplicación de gestión de notas y tareas con persistencia en una base relacional. Esta versión no incorpora inicio de sesión ni separación de registros por usuario. Las capturas usan SQLite aislado y datos sintéticos; no se presenta como un servicio de producción.',
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
    image: '/images/ferroviario-viaje.png',
    imageAlt:
      'Rail Board ejecutado en Tkinter: recorrido de San Miguel a Retiro, con próxima estación Muñiz y tiempo de 3 minutos.',
    imageWidth: 1202,
    imageHeight: 940,
    caption:
      'Captura real de Rail Board · línea y valores de ejemplo del proyecto',
    features: [
      {
        title: 'Líneas configurables',
        description:
          'Se puede cargar una línea manualmente o usar el ejemplo de San Martín con 15 estaciones. Se validan nombres, cantidad de tramos, distancias positivas y velocidad media.',
      },
      {
        title: 'Recorrido y carteles',
        description:
          'Al elegir origen y destino calcula la distancia y el tiempo en ambos sentidos. Los carteles muestran estación actual, próxima parada y tiempo del siguiente tramo, con avance manual o automático.',
      },
      {
        title: 'Tarifas parametrizadas',
        description:
          'Calcula el precio como tarifa base más distancia recorrida por tarifa por kilómetro. El resultado presenta el desglose para el tramo seleccionado.',
      },
      {
        title: 'Estadísticas e historial',
        description:
          'Muestra longitud total, promedio entre paradas y tramos extremos. Los viajes se registran durante la sesión y el historial puede ordenarse por distancia mediante burbuja.',
      },
    ],
    workflow: [
      {
        title: 'Configurar y confirmar la línea',
        description:
          'Se selecciona el ejemplo o se ingresan estaciones, distancias entre paradas y velocidad. La pantalla de confirmación permite revisar los datos antes de ir al menú.',
      },
      {
        title: 'Elegir un viaje',
        description:
          'Se indica estación de origen y destino. La lógica determina el sentido y suma los tramos correspondientes, calculando tiempos a partir de la velocidad media.',
      },
      {
        title: 'Recorrer y comparar resultados',
        description:
          'La interfaz reproduce carteles paso a paso o automáticamente. Desde el menú también se calcula la tarifa y se consultan los datos de la línea, las estadísticas y el historial.',
      },
    ],
    example:
      'En la línea de ejemplo, San Miguel → Muñiz tiene 3 km: a 60 km/h el cartel muestra 3 minutos. El recorrido completo de 63 km, con tarifa base de $50 y $15 por km, da $995. Son parámetros de simulación, no tiempos ni tarifas de un servicio real.',
    gallerySummary:
      'Capturas reales de la aplicación de escritorio Rail Board en Windows, usando la línea precargada y sus parámetros de demostración.',
    gallery: [
      {
        src: '/images/ferroviario-configuracion.png',
        title: 'Elegir la configuración',
        alt: 'Rail Board ofrece cargar una línea manual o usar la línea precargada de ejemplo.',
        caption: 'Rail Board en ejecución · selección inicial de datos',
        description:
          'El inicio separa la carga manual de la línea precargada, para probar el simulador o ingresar otra configuración.',
        width: 1202,
        height: 940,
      },
      {
        src: '/images/ferroviario-linea.png',
        title: 'Revisar la línea',
        alt: 'Confirmación real de una línea de ejemplo con 15 estaciones, 63 kilómetros y velocidad media de 60 kilómetros por hora.',
        caption: 'Rail Board en ejecución · datos precargados de ejemplo',
        description:
          'La confirmación muestra estaciones, distancias entre paradas, longitud total y velocidad antes de iniciar los cálculos.',
        width: 1202,
        height: 940,
      },
      {
        src: '/images/ferroviario-costos.png',
        title: 'Desglose de la tarifa',
        alt: 'Cálculo real de la tarifa San Miguel a Retiro: 63 kilómetros, base de 50, costo por kilómetro de 15 y total de 995.',
        caption:
          'Rail Board en ejecución · tarifa de simulación, no de un servicio real',
        description:
          'El precio combina $945 por los 63 km y una base de $50. Los valores se pueden cambiar en el formulario.',
        width: 1202,
        height: 940,
      },
      {
        src: '/images/ferroviario-estadisticas.png',
        title: 'Estadísticas de la línea',
        alt: 'Pantalla real de estadísticas de Rail Board con cantidad de estaciones, distancias, tramos extremos y tiempos.',
        caption:
          'Rail Board en ejecución · estadísticas de los datos de ejemplo',
        description:
          'Las métricas se calculan a partir de las estaciones, las distancias y la velocidad de la línea cargada.',
        width: 1202,
        height: 940,
      },
    ],
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
      'Aplicación educativa de escritorio con Tkinter y biblioteca estándar de Python. No consulta servicios ferroviarios reales: tiempos y tarifas se calculan con los parámetros cargados. La línea de ejemplo no representa información operativa vigente y el historial vive en la sesión.',
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
    image: '/images/bancario-extraccion.jpg',
    imageAlt:
      'Extracto de la salida real de Java: extracción correcta, saldo de cuenta de 100000, efectivo de cajero de 480000 y depósito posterior.',
    caption:
      'Salida real de Main presentada en un marco legible · datos ficticios · aplicación de consola',
    features: [
      {
        title: 'Banco, cajeros y cuentas',
        description:
          'El banco agrupa cajeros y cuentas en arreglos. Permite agregarlos, consultar sus datos y buscar entidades por número de serie o de cuenta.',
      },
      {
        title: 'Depósitos y consultas',
        description:
          'Una cuenta acepta depósitos positivos y devuelve su saldo. Los cajeros consultan esa misma cuenta; no mantienen copias independientes de su saldo.',
      },
      {
        title: 'Extracciones coordinadas',
        description:
          'El cajero verifica que tenga efectivo y delega el débito a la cuenta. Solo si la cuenta también tiene saldo suficiente se descuenta el efectivo del cajero.',
      },
      {
        title: 'Transferencias entre cuentas',
        description:
          'La cuenta de origen valida el importe mediante su extracción y, si tiene fondos, acredita el destino. Se rechazan destinos nulos y transferencias a la misma cuenta.',
      },
    ],
    workflow: [
      {
        title: 'Inicializar el modelo',
        description:
          'Main crea un banco, dos cajeros y cuentas con valores ficticios. Los agrega al banco y muestra la información en consola.',
      },
      {
        title: 'Ejecutar operaciones',
        description:
          'La demostración realiza una extracción, un depósito, una consulta desde otro cajero y una transferencia. Cada operación invoca métodos de las entidades.',
      },
      {
        title: 'Observar el estado compartido',
        description:
          'La consola imprime los saldos resultantes. También muestra que dos referencias a la misma cuenta ven el mismo saldo, y permite observar la búsqueda y recarga de un cajero.',
      },
    ],
    example:
      'Main extrae $20.000 de una cuenta con $120.000 usando un cajero con $500.000: quedan $100.000 y $480.000, respectivamente. Tras depositar $5.000, transfiere $20.000 a otra cuenta con $50.000: los saldos finales son $85.000 y $70.000.',
    gallerySummary:
      'Extractos de la salida obtenida al compilar y ejecutar Main, presentados como imágenes legibles. El proyecto funciona en consola; estos marcos no representan una interfaz gráfica de la aplicación.',
    gallery: [
      {
        src: '/images/bancario-transferencia.jpg',
        title: 'Transferencia entre cuentas',
        alt: 'Salida real de la transferencia en Java: origen pasa de 105000 a 85000 y destino de 50000 a 70000.',
        caption:
          'Extracto real de Main · datos ficticios · presentación de salida de consola',
        description:
          'La transferencia mueve $20.000 de la cuenta de origen a la de destino. La salida permite comparar ambos saldos antes y después.',
      },
    ],
    problem:
      'Representar operaciones bancarias y coordinar el saldo de las cuentas con el efectivo disponible en un cajero.',
    contribution:
      'Desarrollo del modelo educativo en Java para representar bancos, cuentas y cajeros mediante programación orientada a objetos.',
    decisions: [
      'Entidades Banco, Cajero y CuentaBancaria con responsabilidades diferenciadas.',
      'El cajero delega el débito a la cuenta después de verificar el efectivo disponible.',
      'Implementación con el JDK, sin frameworks ni base de datos.',
    ],
    scope:
      'Modelo académico en Java ejecutado en memoria y mostrado por consola. No incluye interfaz gráfica, autenticación, persistencia ni conexión con bancos reales. Los importes y cuentas de Main son de demostración.',
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
    image: '/images/hotel-inicio.jpg',
    imageAlt:
      'Salida real inicial de la demo C: Hotel Aurora sin huéspedes ni servicios cargados.',
    caption:
      'Salida real de main.c presentada en un marco legible · datos ficticios · demostración en consola',
    features: [
      {
        title: 'Composición del hotel',
        description:
          'La entidad Hotel guarda nombre, dirección y dos listas independientes: huéspedes y servicios. Su demostración comienza vacía y luego incorpora datos de ejemplo.',
      },
      {
        title: 'Huéspedes y servicios',
        description:
          'Cada huésped guarda DNI y apellido; cada servicio, nombre y precio. Los módulos exponen funciones para crear, consultar, modificar, mostrar y liberar sus entidades.',
      },
      {
        title: 'Lista enlazada reutilizable',
        description:
          'La biblioteca de listas usa punteros genéricos y callbacks. Ofrece inserción, consulta, búsqueda, eliminación, copia de nodos y ordenamiento por burbuja.',
      },
      {
        title: 'Propiedad y memoria',
        description:
          'Al agregar una entidad correctamente, el hotel asume su propiedad. Al finalizar libera huéspedes, servicios, nodos y listas; las cadenas se copian con límites de capacidad.',
      },
    ],
    workflow: [
      {
        title: 'Crear el hotel vacío',
        description:
          'main.c crea Hotel Aurora y sus listas. La primera impresión en consola muestra que todavía no hay huéspedes ni servicios.',
      },
      {
        title: 'Agregar datos de demostración',
        description:
          'La demo crea tres huéspedes y los servicios Desayuno buffet, Spa y Wi-Fi. Cada entidad se incorpora al final de la lista correspondiente.',
      },
      {
        title: 'Mostrar y liberar',
        description:
          'La segunda impresión recorre ambas listas usando callbacks de visualización. Antes de terminar, liberarHotel libera las entidades y las estructuras que administra.',
      },
    ],
    example:
      'La demostración pasa de dos listas vacías a tres huéspedes y tres servicios. Cada lista conserva sus propios nodos, aunque comparte la misma implementación genérica. Las imágenes muestran esa salida real, con los datos ficticios definidos en main.c.',
    gallerySummary:
      'Salida real de la demostración en C, dividida en extractos de huéspedes y servicios para facilitar su lectura. Es un ejercicio de consola y estructuras de datos, sin pantallas de reservas.',
    gallery: [
      {
        src: '/images/hotel-huespedes.jpg',
        title: 'Lista de huéspedes',
        alt: 'Extracto real de la consola C: lista de tres huéspedes con DNI y apellido ficticios definidos en main.c.',
        caption:
          'Extracto real de main.c · nombres y DNI ficticios del código de ejemplo',
        description:
          'El tamaño de la lista es tres. Un callback muestra los datos de cada huésped mientras se recorren los nodos enlazados.',
      },
      {
        src: '/images/hotel-servicios.jpg',
        title: 'Lista de servicios',
        alt: 'Extracto real de consola C con Desayuno buffet a 4500, Spa a 15000 y Wi-Fi a 2000.',
        caption:
          'Extracto real de main.c · servicios y precios ficticios de demostración',
        description:
          'La segunda lista contiene tres servicios con nombre y precio, mostrados con la función específica del módulo Servicios.',
      },
    ],
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
