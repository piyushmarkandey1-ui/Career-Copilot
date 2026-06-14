/**
 * Test Claude API Analysis (without PDF upload)
 * 
 * Usage: node test-claude-analysis.js [target-role]
 * 
 * Example: node test-claude-analysis.js "Frontend Developer"
 */

const http = require('http');

const targetRole = process.argv[2] || 'Frontend Developer';

// Sample resume text for testing
const sampleResumeText = `
JOHN DOE
Software Engineer
john.doe@email.com | linkedin.com/in/johndoe | github.com/johndoe

EXPERIENCE

Software Developer | Tech Company | 2020 - Present
- Worked on various web applications using React
- Improved application performance
- Collaborated with team members on projects
- Fixed bugs and implemented features

Junior Developer | Another Company | 2018 - 2020
- Developed web pages using HTML, CSS, and JavaScript
- Participated in code reviews
- Learned about software development best practices

EDUCATION

Bachelor of Science in Computer Science
State University | 2014 - 2018

SKILLS

JavaScript, React, HTML, CSS, Git, Node.js
`;

console.log('🧪 Testing Claude Analysis Endpoint...');
console.log(`🎯 Target Role: ${targetRole}\n`);

const postData = JSON.stringify({
  resumeText: sampleResumeText,
  targetRole: targetRole,
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/resume/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}\n`);

    try {
      const json = JSON.parse(data);

      if (json.success && json.data.analysis) {
        const analysis = json.data.analysis;

        console.log('✅ Analysis Complete!\n');
        console.log('=' .repeat(60));
        console.log(`🎯 READINESS SCORE: ${analysis.readiness_score}/100`);
        console.log('='.repeat(60));

        console.log('\n🔥 BRUTAL GAPS:');
        analysis.brutal_gaps.forEach((gap, i) => {
          console.log(`\n${i + 1}. ${gap}`);
        });

        console.log('\n\n📋 FIX-IT ROADMAP:');
        analysis.fix_it_roadmap.forEach((item, i) => {
          console.log(`\n${item.week}:`);
          console.log(`   Action: ${item.action}`);
          console.log(`   Why: ${item.why}`);
        });

        console.log('\n\n💡 ONE-LINER:');
        console.log(`   "${analysis.one_liner}"`);

        console.log('\n' + '='.repeat(60));
      } else {
        console.log('❌ Analysis failed:', json.message);
        if (json.error) {
          console.log('Error:', json.error);
        }
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. Backend server is running (npm run dev)');
  console.log('   2. ANTHROPIC_API_KEY is set in .env file');
});

req.write(postData);
req.end();
