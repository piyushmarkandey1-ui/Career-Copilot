/**
 * test-analyzer.js
 * Tests the local analyzer with 4 different resume profiles
 * to verify distinct, content-specific results.
 *
 * Run: node test-analyzer.js
 */

const { analyzeLocally, detectResumeLocally } = require('./src/services/localAnalyzer');

const resumes = [
  {
    name: '🟢 Valid Resume (Should Pass)',
    role: 'Frontend Developer',
    text: `
John Doe | john@example.com | github.com/johndoe | linkedin.com/in/johndoe | +91-9876543210

EDUCATION
B.Tech in Computer Science — IIT Delhi (2020-2024) | CGPA: 8.7/10
Relevant Coursework: Data Structures, Algorithms, Web Development

SKILLS
Languages: JavaScript, TypeScript, HTML5, CSS3
Frameworks: React.js, Next.js, Redux, Tailwind CSS, Vite
Tools: Git, Webpack, Figma, Jest, Storybook

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

ACHIEVEMENTS
- Won 1st place at HackWithInterns 2023 (300+ participants)
- AWS Certified Cloud Practitioner (2023)
    `.repeat(2) // Repeat to easily pass the 150 word count
  },
  {
    name: '🔴 Story PDF (Should Fail)',
    role: 'Software Developer (SDE)',
    text: `
Chapter 1: The Beginning
Once upon a time, in a faraway land, there lived a young boy named Arthur. He loved to explore the enchanted forest near his village. 
One day, while wandering through the woods, he stumbled upon a mysterious cave hidden behind a waterfall. The characters in this story will face many challenges.
In conclusion, the journey was long but rewarding. The abstract concept of bravery was tested throughout the novel. 
This story is a great example of classic literature. 
    `.repeat(5) // Ensure word count is high enough to test the story detection, not just the length filter
  },
  {
    name: '🔴 Assignment PDF (Should Fail)',
    role: 'Backend Developer',
    text: `
CS101 Assignment 3: Database Systems
Student: Jane Smith
Question 1: Explain the difference between SQL and NoSQL databases.
Answer: SQL databases are relational, whereas NoSQL databases are non-relational. SQL databases use structured query language and have a predefined schema. 
Question 2: Write a SQL query to select all users who signed up in 2023.
Answer: SELECT * FROM users WHERE signup_date >= '2023-01-01';
Conclusion: This assignment covers basic database concepts and query writing. 
    `.repeat(5)
  },
  {
    name: '🔴 Empty / Short PDF (Should Fail)',
    role: 'UI/UX Designer',
    text: `
My Resume
Jane Doe
Just a quick summary of my skills.
    `
  },
  {
    name: '🔴 Certificate PDF (Should Fail)',
    role: 'Data Scientist / ML Engineer',
    text: `
Certificate of Completion
This is to certify that John Smith has successfully completed the course "Machine Learning A-Z".
Awarded on: 15th August 2023
Instructor: Dr. Alan Turing
This certificate verifies the completion of 40 hours of online instruction and practical exercises.
Congratulations on your achievement!
    `.repeat(6)
  },
  {
    name: '🟡 Missing Projects but Valid (Should Pass)',
    role: 'Backend Developer',
    text: `
Jane Smith | jane.smith@gmail.com | linkedin.com/in/janesmith | +1-555-0198

SUMMARY
Experienced Backend Developer with 3 years of industry experience building scalable APIs.

EDUCATION
B.E. Computer Science — VIT University (2019-2023) | CGPA: 7.2/10
Courses: Database Management Systems, Operating Systems, Computer Networks

SKILLS
Languages: Python, Java, JavaScript
Frameworks: Node.js, Express, Spring Boot
Databases: MySQL, MongoDB, PostgreSQL

EXPERIENCE
Software Engineer — TCS (Jan 2023 – Present)
- Worked on backend APIs for internal tools used by over 500 employees
- Helped with database migration tasks from on-prem to AWS Cloud
- Responsible for writing unit tests using Jest and JUnit
- Reduced API response time by 20% through caching strategies

CERTIFICATIONS
- AWS Certified Developer Associate (2023)
- Oracle Certified Java Programmer
    `.repeat(2)
  }
];

console.log('\n' + '='.repeat(70));
console.log('  LOCAL RESUME ANALYZER — TEST RESULTS');
console.log('='.repeat(70) + '\n');

resumes.forEach((resume, i) => {
  const validation = detectResumeLocally(resume.text);
  console.log(`\n[${i + 1}] ${resume.name}`);
  console.log(`    Is Resume: ${validation.is_resume} (Confidence: ${validation.confidence}%)`);
  console.log(`    Reason: ${validation.reason}`);
  console.log(`    Detected Type: ${validation.detected_document_type}`);
  console.log(`    Signals Found: [${validation.resume_signals_found.join(', ')}]`);
  
  if (validation.is_resume && validation.confidence >= 75) {
    const result = analyzeLocally(resume.text, resume.role);
    console.log(`    ✅ Validation Passed! Analyzing...`);
    console.log(`    Score: ${result.readiness_score}/100`);
    console.log(`    Strengths: ${result.strengths[0]}`);
  } else {
    console.log(`    ❌ Aborted: Validation Failed`);
    if (validation.non_resume_signals_found.length > 0) {
      console.log(`    Negative Signals: [${validation.non_resume_signals_found.join(', ')}]`);
    }
  }
  console.log('');
});

console.log('='.repeat(70));
console.log('  Testing complete ✓');
console.log('='.repeat(70) + '\n');
