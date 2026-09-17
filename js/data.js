/* ============================================================
   PORTFOLIO CONFIGURATION
   ============================================================ */

const profile = {
  name: "Haneen Alrubaie",
  title: "Computer Science | Software • Data • AI",
  headline: "Building practical solutions with software, data, and AI.",
  description:
    "Computer Science graduate creating web applications, data-driven systems, and AI solutions.",
  location: "Saudi Arabia",
  email: "haneen1lrubaie@gmail.com",
  cvUrl: "[CV URL]",

  availability: {
    enabled: true,
    label: "Available for Opportunities",
  },

  about: [
    "I work across software development, data, and artificial intelligence, transforming ideas and real-world requirements into practical, well-structured digital solutions. My experience includes full-stack platforms, data-driven applications, and AI-powered systems.Through projects across diverse domains, I have developed a strong foundation in building reliable solutions, working with data, and applying emerging technologies to real-world challenges. I continuously expand my technical expertise through hands-on development and complex problem-solving.",
  ],
};


const socials = {
  github: {
    label: "GitHub",
    url: "[GITHUB URL]",
    username: "",
  },
  linkedin: {
    label: "LinkedIn",
    url: "www.linkedin.com/in/haneen-al-rubaie-4b98132a9",
   },
  
};


const stats = [
  { value: "6+", label: "Projects" },
  { value: "5+", label: "Industries" },
  { value: "10+", label: "Technologies" },
];


const CATEGORY = {
  ALL: "All",
  SOFTWARE: "Software",
  FULLSTACK: "Full Stack",
  FRONTEND: "Front End",
  DATA: "Data",
  AI: "AI",
  BUSINESS: "Business",
  EDTECH: "EdTech",
  PROPTECH: "PropTech",
  TOURISM: "Tourism",
};


/* ============================================================
   PROJECTS
   ============================================================ */

const projects = [

{
  id: "tarasd",
  slug: "tarasd",

  title: "Tarasd",
  subtitle: "AI-Powered Phishing Detection System",

  shortDescription:
    "A desktop application for detecting phishing attacks with an integrated RAG-based AI assistant.",

  fullDescription:
    "Tarasd is an AI-powered desktop application designed to detect phishing attacks and support users through an intelligent assistant built using Retrieval-Augmented Generation (RAG).",

  role: "AI Model Developer",

  category: [
    CATEGORY.AI,
    CATEGORY.SOFTWARE,
  ],

  technologies: [
    "Python",
    "Machine Learning",
    "RAG",
  ],

  contributions: [
    "Developed AI models for phishing detection.",
    "Developed a RAG-based intelligent assistant.",
    "Contributed to integrating AI capabilities into the desktop application.",
  ],

  features: [
    "Phishing attack detection",
    "RAG-based AI assistant",
    "AI model integration",
    "Desktop application",
  ],

  challenge: "",
  solution: "",

    image: "assets/images/projects/tarasd.jpg",
  screenshots: [],

  liveUrl: "",
  githubUrl: "",

  featured: true,
  status: "Completed",
},






  {
    id: "milha",
    slug: "milha",

    title: "Milha",
    subtitle: "Business & Innovation Website",

    shortDescription:
      "Corporate platform with integrated contact and inquiry handling.",

    fullDescription:
      "A responsive business website connecting company services, communication channels, and backend inquiry processing.",

    role: "Front-End Development & Backend Integration",

    category: [
      CATEGORY.SOFTWARE,
      CATEGORY.BUSINESS,
      CATEGORY.FULLSTACK,
    ],

    technologies: [
       
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Python",
      "Git",
      "GitHub",
    ],

    contributions: [
      "Developed responsive interfaces.",
      "Implemented contact and inquiry forms.",
      "Connected frontend forms with backend services.",
    ],

    features: [
      "Responsive website",
      "Inquiry processing",
      "Backend integration",
    ],

    challenge: "",
    solution: "",

    image: "assets/images/projects/milha-web.png",
    screenshots: [],

    liveUrl: "",
    githubUrl: "",

    featured: false,
    status: "Live",
  },


  {
    id: "technical-passport",
    slug: "technical-passport",

    title: "Young Innovators Technical Passport",
    subtitle: "Student Progress Tracking Platform",

    shortDescription:
      "Tracks student attendance, progress, achievements, and certificates.",

    fullDescription:
      "A full-stack platform giving parents an updated view of each child's training journey.",

    role: "Full-Stack Developer",

    category: [
      CATEGORY.SOFTWARE,
      CATEGORY.DATA,
      CATEGORY.EDTECH,
      CATEGORY.FULLSTACK,
    ],

    technologies: [
      
      "TypeScript",
      "Python",
      "SQLite",
      "PostgreSQL",
      "Tailwind CSS",
      "Git",
      "GitHub",
    ],

    contributions: [
      "Developed the frontend and backend.",
      "Designed and integrated the database.",
      "Built student profiles and progress tracking.",
      "Implemented attendance, notes, achievements, and certificates.",
    ],

    features: [
      "Student profiles",
      "Attendance tracking",
      "Progress updates",
      "Achievement records",
      "Certificates",
    ],

    challenge: "",
    solution: "",

    image: "assets/images/projects/tech-passport.png",
    screenshots: [],

    liveUrl: "",
    githubUrl: "",

    featured: true,
    status: "Live",
  },


  {
    id: "rafd",
    slug: "rafd",

    title: "Rafd Platform",
    subtitle: "Full-Stack Web Platform",

    shortDescription:
      "A full-stack platform spanning frontend, backend, and database layers.",

    fullDescription:
      "A complete web platform developed across the user interface, application logic, backend, and database.",

    role: "Full-Stack Developer",

    category: [
      CATEGORY.SOFTWARE,
      CATEGORY.FULLSTACK,
    ],

    technologies: [
     
      "TypeScript",
      "JavaScript",
      "Python",
      "PostgreSQL",
      "Tailwind CSS",
      "Git",
      "GitHub",
    ],

    contributions: [
      "Developed frontend and backend functionality.",
      "Designed and integrated the database.",
      "Connected application layers and logic.",
    ],

    features: [],

    challenge: "",
    solution: "",

    image: "assets/images/projects/rafed.png",
    screenshots: [],

    liveUrl: "",
    githubUrl: "",

    featured: true,
    status: "In Progress",
  },

    {
    id: "spotn",
    slug: "spotn",

    title: "SpotN",
    subtitle: "Tourism & Local Discovery Platform",

    shortDescription:
      "Discover notable attractions and destinations across Aseer.",

    fullDescription:
      "A tourism platform for exploring attractions through organized visual and location data.",

    role: "Front-End Development & Data Management",

    category: [
      CATEGORY.SOFTWARE,
      CATEGORY.DATA,
      CATEGORY.TOURISM,
    ],

    technologies: [
      "Python",
      "JavaScript",
      "TypeScript",
      "Tailwind CSS",
      "SQLite",
      "Git",
      "GitHub",
    ],

    contributions: [
      "Developed responsive front-end interfaces.",
      "Collected and structured destination data.",
      "Managed location records and visual assets.",
    ],

    features: [
      "Destination discovery",
      "Structured location data",
      "Responsive interface",
    ],

    challenge: "",
    solution: "",

    image: "assets/images/projects/spotin.png",
    screenshots: [],

    liveUrl: "",
    githubUrl: "",

    featured: true,
    status: "Live",
  },

  {
    id: "aqaar-meter",
    slug: "aqaar-meter",

    title: "Aqaar Meter",
    subtitle: "Real Estate & Price Prediction Platform",

    shortDescription:
      "Real estate discovery with data-driven property price prediction.",

    fullDescription:
      "A real estate platform combining property discovery with a data-driven price prediction experience.",

    role: "Front-End Developer",

    category: [
      CATEGORY.SOFTWARE,
      CATEGORY.DATA,
      CATEGORY.PROPTECH,
    ],

    technologies: [
       "JavaScript",
      "TypeScript",
      "Tailwind CSS",
      "Git",
      "GitHub",
    ],

    contributions: [
      "Developed the front-end experience.",
      "Built property listing interfaces.",
      "Created UI components for price prediction.",
    ],

    features: [
      "Property discovery",
      "Price prediction interface",
      "Responsive design",
    ],

    challenge: "",
    solution: "",

    image: "assets/images/projects/aqaar.png",
    screenshots: [],

    liveUrl: "",
    githubUrl: "",

    featured: true,
    status: "Live",
  },



];


/* ============================================================
   SKILLS
   ============================================================ */

const skillGroups = [

  {
    title: "Software Development",
    items: [
      "Python",
      "Java",
      "C++",
      "React",
      "TypeScript",
      "JavaScript",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
    ],
  },

  {
    title: "Data Analysis",
    items: [
      "Pandas",
      "Matplotlib",
      "Excel",
      "Data Visualization",
      "Data Management",
    ],
  },

  {
    title: "AI & Machine Learning",
    items: [
      "PyTorch",
      "Scikit-learn",
      "Machine Learning",
    ],
  },

  {
    title: "Databases & Tools",
    items: [
      "PostgreSQL",
      "SQLite",
      "Git",
      "GitHub",
    ],
  },

];


const techStack = [
  "Python",
  "React",
  "TypeScript",
  "JavaScript",
  "Pandas",
  "PyTorch",
  "Scikit-learn",
  "PostgreSQL",
  "SQLite",
  "Git",
  "GitHub",
];




/* ============================================================
   NAVIGATION
   ============================================================ */

const navLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];


/* ============================================================
   ICONS
   ============================================================ */

const TECH_ICON_MAP = {
  HTML5: "code-2",
  CSS3: "palette",
  JavaScript: "file-code",
  TypeScript: "file-type",
  React: "atom",
  "Tailwind CSS": "wind",

  Python: "terminal-square",
  Java: "coffee",
  "C++": "code",

  PostgreSQL: "database",
  SQLite: "database-zap",

  Git: "git-branch",
  GitHub: "github",

  Pandas: "table",
  Matplotlib: "bar-chart-3",
  Excel: "sheet",

  PyTorch: "brain-circuit",
  "Scikit-learn": "brain",
};

const CAP_ICONS = [];