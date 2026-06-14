require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀  Career Copilot API running`);
  console.log(`   ENV  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT : http://localhost:${PORT}\n`);
});
