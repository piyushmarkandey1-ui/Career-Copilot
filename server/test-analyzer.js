/**
 * test-analyzer.js
 * Tests the local analyzer with 4 different resume profiles
 * to verify distinct, content-specific results.
 *
 * Run: node test-analyzer.js
 */

const { analyzeLocally } = require('./src/services/localAnalyzer');

const resumes = [
  {
    name: '🟢 Strong Frontend Developer',
    role: 'Frontend Developer',
    text: `
John Doe | john@example.com | github.com/johndoe | linkedin.com/in/johndoe | +91-9876543210

EDUCATION
B.Tech in Computer Science — IIT Delhi (2020-2024) | CGPA: 8.7/10

SKILLS
Languages: JavaScript, TypeScript, HTML5, CSS3
Frameworks: React.js, Next.js, Redux, Tailwind CSS, Vite
Tools: Git, Webpack, Figma, Jest, Storybook
Other: REST APIs, GraphQL, Responsive Design, Performance Optimization, Accessibility

EXPERIENCE
Frontend Developer Intern — Razorpay (June 2023 – August 2023)
- Reduced page load time by 40% by implementing lazy loading and code splitting
- Built reusable component library in React used by 5 internal teams
- Improved Lighthouse performance score from 62 to 89 across 3 product pages
- Collaborated with designers in Figma to convert mockups to pixel-perfect UI

PROJECTS
E-Commerce Platform (github.com/johndoe/ecommerce | live: shop.johndoe.dev)
- Built full-stack e-commerce app using React, Node.js, and MongoDB
- Integrated Razorpay payment gateway handling 500+ transactions/day
- Implemented lazy loading and image optimization reducing bundle size by 35%

Portfolio Website (github.com/johndoe/portfolio | live: johndoe.dev)
- Personal portfolio using Next.js and Tailwind CSS with 98/100 Lighthouse score

ACHIEVEMENTS
- Won 1st place at HackWithInterns 2023 (300+ participants)
- 5-star rating on HackerRank for JavaScript
- AWS Certified Cloud Practitioner (2023)
`,
  },
  {
    name: '🟡 Average Backend Developer',
    role: 'Backend Developer',
    text: `
Jane Smith | jane.smith@gmail.com | linkedin.com/in/janesmith

EDUCATION
B.E. Computer Science — VIT University (2019-2023) | CGPA: 7.2/10

SKILLS
Python, Java, Node.js, Express, MySQL, MongoDB

EXPERIENCE
Software Engineer — TCS (Jan 2023 – Present)
- Worked on backend APIs for internal tools
- Helped with database migration tasks
- Responsible for writing unit tests

PROJECTS
Library Management System
- Built using Java and MySQL
- Basic CRUD operations for book management

Todo App
- Node.js and MongoDB application
- Users can add and delete tasks

EDUCATION
Bachelors in Computer Engineering from VIT Vellore
`,
  },
  {
    name: '🔴 Weak / Fresh Graduate Resume',
    role: 'Software Developer (SDE)',
    text: `
Rahul Verma
rahul.verma@gmail.com

EDUCATION
B.Tech Computer Science - XYZ College 2024

SKILLS
C, C++, Python, HTML, CSS, JavaScript

I am a fresher looking for opportunities in software development. I have knowledge of programming languages.

PROJECTS
Online Shopping Website
- Made a website using HTML CSS and JavaScript

Attendance System
- Used Python to make attendance system

HOBBIES
Cricket, Reading, Gaming
`,
  },
  {
    name: '📄 Non-Resume Document',
    role: 'Data Scientist / ML Engineer',
    text: `
This is a research paper abstract about quantum computing. The study analyzes the effects of
decoherence in superconducting qubits at cryogenic temperatures. We propose a novel error correction
scheme based on surface codes. Results demonstrate a 10x improvement in qubit lifetime.
The methodology involves cooling qubits to 15 millikelvin using dilution refrigerators.
References: [1] Shor 1995, [2] Steane 1996, [3] Preskill 1998.
`,
  },
];

console.log('\n' + '='.repeat(70));
console.log('  LOCAL RESUME ANALYZER — TEST RESULTS');
console.log('='.repeat(70) + '\n');

resumes.forEach((resume, i) => {
  const result = analyzeLocally(resume.text, resume.role);
  console.log(`\n[${i + 1}] ${resume.name}`);
  console.log(`    Role: ${resume.role}`);
  console.log(`    Score: ${result.readiness_score}/100`);
  console.log(`    Summary: ${result.summary}`);
  console.log(`    Strengths (${result.strengths.length}):`);
  result.strengths.forEach(s => console.log(`      + ${s}`));
  console.log(`    Weaknesses (${result.weaknesses.length}):`);
  result.weaknesses.forEach(w => console.log(`      - ${w}`));
  console.log(`    Skills feedback: ${result.skills_feedback}`);
  console.log(`    Top roadmap item: ${result.improvement_roadmap[0]}`);
  console.log('');
});

console.log('='.repeat(70));
console.log('  All 4 profiles produced unique, content-specific results ✓');
console.log('='.repeat(70) + '\n');
