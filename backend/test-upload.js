/**
 * Test script for PDF upload endpoint
 * 
 * Usage:
 * node test-upload.js <path-to-pdf> <target-role>
 * 
 * Example:
 * node test-upload.js sample-resume.pdf "Frontend Developer"
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

// Get command line arguments
const pdfPath = process.argv[2];
const targetRole = process.argv[3] || 'Software Developer (SDE)';

if (!pdfPath) {
  console.error('❌ Error: Please provide a PDF file path');
  console.log('\nUsage: node test-upload.js <path-to-pdf> [target-role]');
  console.log('Example: node test-upload.js sample-resume.pdf "Frontend Developer"');
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error(`❌ Error: File not found: ${pdfPath}`);
  process.exit(1);
}

console.log('📤 Testing PDF upload endpoint...');
console.log(`📄 File: ${path.basename(pdfPath)}`);
console.log(`🎯 Target Role: ${targetRole}\n`);

// Create form data
const form = new FormData();
form.append('resume', fs.createReadStream(pdfPath));
form.append('targetRole', targetRole);

// Make the request
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/resume/upload',
  method: 'POST',
  headers: form.getHeaders(),
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);
    
    try {
      const json = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n✅ Upload successful!');
        console.log(`📊 Extracted ${json.data.metadata.textLength} characters`);
        console.log(`📄 Pages: ${json.data.metadata.numPages}`);
      } else {
        console.log('\n❌ Upload failed:', json.message);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure the backend server is running on http://localhost:5000');
});

form.pipe(req);
