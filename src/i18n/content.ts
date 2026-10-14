import { projects, type Project, type ProjectImage } from '../data/projects';
import { profile, experience } from '../data/profile';
import type { Locale } from './ui';

type Translation = Pick<
  Project,
  | 'title'
  | 'category'
  | 'summary'
  | 'thumbnailAlt'
  | 'imageAlt'
  | 'caption'
  | 'features'
  | 'workflow'
  | 'example'
  | 'gallerySummary'
  | 'problem'
  | 'contribution'
  | 'decisions'
  | 'scope'
> & {
  gallery: Pick<ProjectImage, 'title' | 'alt' | 'caption' | 'description'>[];
};

const english: Record<string, Translation> = {
  'oax-demo': {
    title: 'OAX · Business management',
    category: 'Interactive demo',
    summary:
      'A browser-based demo for exploring inventory, transactions, branches and reports.',
    thumbnailAlt: 'JavaScript graphic identifier for the OAX demo.',
    imageAlt:
      'Actual screenshot of the OAX demo showing its inventory dashboard and management indicators.',
    caption: 'Local demo screenshot · sample data',
    features: [
      {
        title: 'Inventory and alerts',
        description:
          'Browse products, stock levels by branch and minimum stock thresholds. Search, filters and sorting help find products and identify shortages.',
      },
      {
        title: 'Transactions and transfers',
        description:
          'Record sample stock entries and withdrawals, and move stock between branches. A transfer deducts stock from the source, credits the destination and records both transactions.',
      },
      {
        title: 'Recipe-based production',
        description:
          'Calculate the inputs required for a batch. When enough stock is available, production consumes raw materials and adds the finished product to the selected branch’s inventory.',
      },
      {
        title: 'Session reports',
        description:
          'Recalculate indicators, browse transactions by period and branch, and download CSV reports. The browser stores the selected theme.',
      },
    ],
    workflow: [
      {
        title: 'Explore the dashboard',
        description:
          'The demo starts with sample products, branches, recipes and transactions. The dashboard summarizes stock levels and products needing attention.',
      },
      {
        title: 'Browse and operate',
        description:
          'Filter the catalog from the inventory view. Forms simulate transactions, transfers or production, validating data before changing the state.',
      },
      {
        title: 'See each operation’s effect',
        description:
          'Tables, alerts and indicators reflect changes made during the session. Reports show the resulting transactions and can be exported as CSV.',
      },
    ],
    example:
      'When transferring a product between two branches, the quantity leaves the source inventory and enters the destination inventory. The demo preserves the total and records an outgoing and an incoming transaction. Inventory changes are held in memory: reloading restores the sample data.',
    gallerySummary:
      'The OAX company website and screens from its public demo. The system views use sample data; each image explains the module it shows.',
    gallery: [
      {
        title: 'Company website',
        alt: 'Home page of the public OAX Sistemas website.',
        caption: 'Public OAX website · management solutions overview',
        description:
          'Company presentation and access to the solutions and demo. This page introduces OAX’s offering; it is not the management dashboard.',
      },
      {
        title: 'Management solutions',
        alt: 'OAX website solutions section: inventory, production and multi-branch management.',
        caption: 'Public OAX website · solutions section',
        description:
          'The website explains inventory, production and multi-branch management before introducing the system demonstration.',
      },
      {
        title: 'Product inventory',
        alt: 'Inventory view with products and filters in the public OAX demo.',
        caption: 'Public OAX demo · sample data',
        description:
          'The catalog shows stock levels and supports searching and filtering products by category, branch and stock status.',
      },
      {
        title: 'Production',
        alt: 'Production view with batches and recipes in the public OAX demo.',
        caption: 'Public OAX demo · sample data',
        description:
          'Sample recipes and batches. Production checks inputs, records their consumption and increases the finished product inventory.',
      },
      {
        title: 'Reports',
        alt: 'Reports and indicators view in the public OAX demo.',
        caption: 'Public OAX demo · sample data',
        description:
          'Indicators and transactions filtered by period or branch, with options to export reports as CSV.',
      },
    ],
    problem:
      'Show how different business operations relate to each other in an experience that can be explored without installing a complete system.',
    contribution:
      'Development of the company website and portfolio demo, with an interface for inventory, transactions, transfers and reports.',
    decisions: [
      'Vanilla JavaScript: the simulation runs entirely in the browser.',
      'Transactions and transfers update the session state and the interface indicators.',
      'CSV report export and theme preference saved in localStorage.',
    ],
    scope:
      'A demonstration with sample data held in memory and no backend. OAX branding and resources are retained within the project’s context.',
  },
  'notas-pendientes': {
    title: 'Notes and tasks',
    category: 'Web application',
    summary:
      'A place to organize notes, track tasks and distinguish what is pending from what is complete.',
    thumbnailAlt: 'PHP and Laravel graphic identifier for Notes and tasks.',
    imageAlt:
      'Actual screenshot of Notes and tasks running locally with demonstration tasks.',
    caption: 'Local execution screenshot · data prepared for the demonstration',
    features: [
      {
        title: 'Notes with titles and descriptions',
        description:
          'Create notes, view their content, edit them and delete them from a list. Notes are saved in the application’s database.',
      },
      {
        title: 'Tasks with completion status',
        description:
          'Each task has a title, description and completion status. The status button switches between pending and complete without deleting the task.',
      },
      {
        title: 'Views by status',
        description:
          'The module provides lists of all tasks, completed tasks and pending tasks. Each view supports viewing or editing a task.',
      },
      {
        title: 'Validation and feedback',
        description:
          'Forms require titles and descriptions between 3 and 255 characters. The interface shows validation errors and feedback when creating, updating or changing the status.',
      },
    ],
    workflow: [
      {
        title: 'Choose the module',
        description:
          'The sidebar separates Notes and Tasks. Each module has its own list and actions for creating, viewing, editing and deleting records.',
      },
      {
        title: 'Complete the form',
        description:
          'Enter a title and description. Laravel validates the request through Form Requests, and Eloquent models save the record.',
      },
      {
        title: 'Organize and track progress',
        description:
          'View or update a note from its list. In Tasks, change the status and use the pending and completed views to review what remains to be done.',
      },
    ],
    example:
      'A task such as “Prepare the monthly summary” can be marked complete and moves to the corresponding view. If it needs more work, the same control makes it pending again. The change preserves its title and description in the database.',
    gallerySummary:
      'Actual screenshots of an isolated local copy using SQLite and data created for the demonstration: creating a note, the notes list and completed tasks.',
    gallery: [
      {
        title: 'Create a note',
        alt: 'Actual note creation form with a sample title and description.',
        caption: 'Isolated local execution · form with sample data',
        description:
          'The form captures a title and description. Both fields are required, and Laravel validates their length before saving.',
      },
      {
        title: 'Notes list',
        alt: 'Actual notes list with a sample record and view, edit and delete actions.',
        caption:
          'Isolated local execution · note created for the demonstration',
        description:
          'After saving, the note appears in the list with confirmation feedback and actions for viewing, editing and deleting it.',
      },
      {
        title: 'Completed tasks',
        alt: 'Actual completed tasks view with synthetic data and controls to change their status.',
        caption: 'Isolated local execution · synthetic demonstration tasks',
        description:
          'This view filters tasks marked complete. The status button can make them pending again.',
      },
    ],
    problem:
      'Centralize notes and tasks in an administrative interface with clear actions and views by status.',
    contribution:
      'Development of the application and its notes and tasks modules: CRUD operations, data validation, status changes and filters.',
    decisions: [
      'Two independent modules within a shared Blade and AdminLTE interface.',
      'Form Requests separate validation from controllers, while Eloquent handles data access.',
      'SQLite is the initial configuration for straightforward local execution; the project also includes MySQL configuration.',
    ],
    scope:
      'A notes and tasks management application with relational database persistence. This version does not include login or separate records by user. Screenshots use an isolated SQLite database and synthetic data; it is not presented as a production service.',
  },
  'simulador-ferroviario': {
    title: 'Railway simulator',
    category: 'Academic project · Python',
    summary:
      'Routes, estimated travel times and fares in a Tkinter desktop application.',
    thumbnailAlt: 'Python graphic identifier for the railway simulator.',
    imageAlt:
      'Rail Board running in Tkinter: journey from San Miguel to Retiro, next station Muñiz and a 3-minute segment time.',
    caption:
      'Actual Rail Board screenshot · sample line and values from the project',
    features: [
      {
        title: 'Configurable lines',
        description:
          'Enter a line manually or use the San Martín example with 15 stations. The application validates names, segment count, positive distances and average speed.',
      },
      {
        title: 'Routes and displays',
        description:
          'Choosing an origin and destination calculates distance and time in either direction. Displays show the current station, next stop and next segment’s time, with manual or automatic progression.',
      },
      {
        title: 'Parameterized fares',
        description:
          'Calculate the price as a base fare plus the traveled distance multiplied by the per-kilometer rate. The result shows a breakdown for the selected route.',
      },
      {
        title: 'Statistics and history',
        description:
          'Show total length, average distance between stops and the shortest and longest segments. Journeys are recorded during the session, and history can be sorted by distance using bubble sort.',
      },
    ],
    workflow: [
      {
        title: 'Configure and confirm the line',
        description:
          'Choose the example or enter stations, distances between stops and speed. The confirmation screen allows reviewing the data before opening the menu.',
      },
      {
        title: 'Choose a journey',
        description:
          'Set the origin and destination stations. The logic determines the direction and adds the corresponding segments, calculating times from average speed.',
      },
      {
        title: 'Follow the route and compare results',
        description:
          'The interface plays station displays step by step or automatically. The menu also offers fare calculation, line information, statistics and journey history.',
      },
    ],
    example:
      'In the sample line, San Miguel → Muñiz is 3 km: at 60 km/h the display shows 3 minutes. The full 63 km route, with a $50 base fare and $15 per km, costs $995. These are simulation parameters, not the times or fares of a real service.',
    gallerySummary:
      'Actual screenshots of the Rail Board desktop application on Windows, using the preloaded line and its demonstration parameters.',
    gallery: [
      {
        title: 'Choose the configuration',
        alt: 'Rail Board offers manual line entry or the preloaded sample line.',
        caption: 'Rail Board running · initial data selection',
        description:
          'The start screen separates manual entry from the preloaded line, allowing you to try the simulator or enter another configuration.',
      },
      {
        title: 'Review the line',
        alt: 'Actual confirmation of a sample line with 15 stations, 63 kilometers and a 60 km/h average speed.',
        caption: 'Rail Board running · preloaded sample data',
        description:
          'The confirmation shows stations, distances between stops, total length and speed before starting calculations.',
      },
      {
        title: 'Fare breakdown',
        alt: 'Actual fare calculation from San Miguel to Retiro: 63 kilometers, base fare 50, per-kilometer rate 15 and total 995.',
        caption: 'Rail Board running · simulated fare, not a real service fare',
        description:
          'The price combines $945 for 63 km with a $50 base fare. These values can be changed in the form.',
      },
      {
        title: 'Line statistics',
        alt: 'Actual Rail Board statistics screen with station count, distances, shortest and longest segments, and times.',
        caption: 'Rail Board running · sample data statistics',
        description:
          'Metrics are calculated from the stations, distances and speed of the loaded line.',
      },
    ],
    problem:
      'Model a railway line and calculate routes, fares and statistics from stations and distances.',
    contribution:
      'Development of the final Introduction to Programming project and its desktop interface.',
    decisions: [
      'Calculation logic separated from the graphical interface.',
      'Python standard library, including Tkinter and ttk.',
      'Bubble sort retained for journey history.',
    ],
    scope:
      'An educational desktop application using Tkinter and the Python standard library. It does not query real railway services: times and fares are calculated from the entered parameters. The sample line is not current operational information, and history is held within the session.',
  },
  'simulador-bancario': {
    title: 'Banking simulator',
    category: 'Academic project · Java',
    summary:
      'A model of banks, accounts and ATMs for exploring encapsulation and collaboration between objects.',
    thumbnailAlt: 'Java graphic identifier for the banking simulator.',
    imageAlt:
      'Excerpt of actual Java output: successful withdrawal, account balance 100000, ATM cash 480000 and a subsequent deposit.',
    caption:
      'Actual Main output presented in a readable frame · fictional data · console application',
    features: [
      {
        title: 'Bank, ATMs and accounts',
        description:
          'The bank groups ATMs and accounts in arrays. It supports adding them, viewing their data and finding entities by serial or account number.',
      },
      {
        title: 'Deposits and balance queries',
        description:
          'An account accepts positive deposits and returns its balance. ATMs query that same account; they do not keep independent copies of its balance.',
      },
      {
        title: 'Coordinated withdrawals',
        description:
          'The ATM checks its available cash and delegates the debit to the account. Its cash is reduced only if the account also has sufficient funds.',
      },
      {
        title: 'Transfers between accounts',
        description:
          'The source account validates the amount through its withdrawal method and, if it has funds, credits the destination. Null destinations and transfers to the same account are rejected.',
      },
    ],
    workflow: [
      {
        title: 'Initialize the model',
        description:
          'Main creates a bank, two ATMs and accounts with fictional values. It adds them to the bank and prints their information to the console.',
      },
      {
        title: 'Execute operations',
        description:
          'The demonstration performs a withdrawal, deposit, query from another ATM and transfer. Each operation calls methods on the entities.',
      },
      {
        title: 'Observe shared state',
        description:
          'The console prints the resulting balances. It also shows that two references to the same account see the same balance, and demonstrates finding and replenishing an ATM.',
      },
    ],
    example:
      'Main withdraws $20,000 from an account holding $120,000 through an ATM with $500,000: they retain $100,000 and $480,000 respectively. After a $5,000 deposit, it transfers $20,000 to another account holding $50,000: the final balances are $85,000 and $70,000.',
    gallerySummary:
      'Excerpts of the output obtained by compiling and running Main, presented as readable images. The project runs in the console; these frames are not a graphical application interface.',
    gallery: [
      {
        title: 'Transfer between accounts',
        alt: 'Actual Java transfer output: the source balance goes from 105000 to 85000 and the destination from 50000 to 70000.',
        caption:
          'Actual Main excerpt · fictional data · console output presentation',
        description:
          'The transfer moves $20,000 from the source account to the destination. The output allows comparing both balances before and after.',
      },
    ],
    problem:
      'Represent banking operations and coordinate account balances with the cash available in an ATM.',
    contribution:
      'Development of the educational Java model representing banks, accounts and ATMs through object-oriented programming.',
    decisions: [
      'Banco, Cajero and CuentaBancaria entities with distinct responsibilities.',
      'The ATM delegates the debit to the account after checking its available cash.',
      'Implemented with the JDK, without frameworks or a database.',
    ],
    scope:
      'An academic Java model running in memory and displayed through the console. It does not include a graphical interface, authentication, persistence or connections to real banks. Main’s amounts and accounts are demonstration data.',
  },
  'gestion-hotel': {
    title: 'Hotel management',
    category: 'Academic project · C',
    summary:
      'Guests and services as a starting point for exploring data structures and dynamic memory.',
    thumbnailAlt: 'C graphic identifier for Hotel management.',
    imageAlt:
      'Actual initial output of the C demo: Hotel Aurora with no guests or services loaded.',
    caption:
      'Actual main.c output presented in a readable frame · fictional data · console demonstration',
    features: [
      {
        title: 'Hotel composition',
        description:
          'The Hotel entity stores a name, address and two independent lists: guests and services. The demonstration starts empty and then adds sample data.',
      },
      {
        title: 'Guests and services',
        description:
          'Each guest stores an Argentine identity document number (DNI) and surname; each service stores a name and price. Modules expose functions to create, query, modify, display and free their entities.',
      },
      {
        title: 'Reusable linked list',
        description:
          'The list library uses generic pointers and callbacks. It provides insertion, querying, searching, deletion, node copying and bubble sorting.',
      },
      {
        title: 'Ownership and memory',
        description:
          'When an entity is added successfully, the hotel takes ownership of it. At the end, it frees guests, services, nodes and lists; strings are copied within capacity limits.',
      },
    ],
    workflow: [
      {
        title: 'Create the empty hotel',
        description:
          'main.c creates Hotel Aurora and its lists. The first console output shows that there are no guests or services yet.',
      },
      {
        title: 'Add demonstration data',
        description:
          'The demo creates three guests and the Desayuno buffet, Spa and Wi-Fi services. Each entity is added to the end of its corresponding list.',
      },
      {
        title: 'Display and free',
        description:
          'The second output traverses both lists using display callbacks. Before finishing, liberarHotel frees the entities and structures it manages.',
      },
    ],
    example:
      'The demonstration goes from two empty lists to three guests and three services. Each list keeps its own nodes while sharing the same generic implementation. The images show this actual output, with fictional data defined in main.c.',
    gallerySummary:
      'Actual output from the C demonstration, split into guest and service excerpts for readability. It is a console and data structures exercise, without booking screens.',
    gallery: [
      {
        title: 'Guest list',
        alt: 'Actual C console excerpt: three guests with fictional DNI numbers and surnames defined in main.c.',
        caption:
          'Actual main.c excerpt · fictional names and identity document numbers from the sample code',
        description:
          'The list contains three entries. A callback displays each guest’s data while traversing the linked nodes.',
      },
      {
        title: 'Service list',
        alt: 'Actual C console excerpt with Desayuno buffet at 4500, Spa at 15000 and Wi-Fi at 2000.',
        caption:
          'Actual main.c excerpt · fictional demonstration services and prices',
        description:
          'The second list contains three services with names and prices, displayed by the Servicios module’s specific function.',
      },
    ],
    problem:
      'Compose hotel entities and manage them through a reusable data structure.',
    contribution:
      'Development of the C programming and data structures exercise.',
    decisions: [
      'Separate .c/.h modules and opaque types to encapsulate structures.',
      'A generic linked list using void * and callbacks.',
      'Explicit ownership and memory deallocation.',
    ],
    scope:
      'An academic, in-memory demonstration of guests and services; it does not include bookings, rooms or persistence.',
  },
};

export function getProjects(locale: Locale = 'es'): Project[] {
  if (locale === 'es') return projects;
  return projects.map((project) => {
    const translated = english[project.slug];
    if (
      !translated ||
      translated.features.length !== project.features.length ||
      translated.workflow.length !== project.workflow.length ||
      translated.decisions.length !== project.decisions.length ||
      translated.gallery.length !== (project.gallery?.length ?? 0)
    )
      throw new Error(
        `Missing or incomplete English translation: ${project.slug}`,
      );
    return {
      ...project,
      ...translated,
      stack: project.stack.map((tag) =>
        tag === 'POO'
          ? 'OOP'
          : tag === 'Listas enlazadas'
            ? 'Linked lists'
            : tag,
      ),
      thumbnail: ['simulador-bancario', 'gestion-hotel'].includes(project.slug)
        ? project.thumbnail.replace('.svg', '-en.svg')
        : project.thumbnail,
      gallery: project.gallery?.map((image, index) => ({
        ...image,
        ...translated.gallery[index],
      })),
    };
  });
}

export function getDescription(locale: Locale = 'es') {
  return locale === 'es'
    ? profile.description
    : 'Matías De Sousa, Full Stack Developer and Computer Engineering student at UADE. Web applications and management systems. Projects and contact.';
}
export function getExperience(locale: Locale = 'es') {
  return locale === 'es'
    ? experience
    : [
        {
          organization: 'Argentine Army',
          role: 'IT technician',
          description:
            'Development and maintenance of internal web applications with PHP and Laravel: routes, controllers, validation and views, using Git to track changes. I also provide technical support and troubleshoot hardware and software issues.',
        },
        {
          organization: 'OAX Sistemas',
          role: 'Development of management solutions',
          description:
            'I contribute to solutions for shops and businesses, focusing on their management processes.',
        },
        {
          organization: 'UADE',
          role: 'Computer Engineering',
          description:
            'Computer Engineering student, with 11 completed courses and an overall average grade of 9. I apply my academic training to Java, Python and C projects.',
        },
      ];
}
