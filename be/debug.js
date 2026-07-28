require('dotenv').config();
console.log('CWD:', process.cwd());
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_SECRET value:', process.env.JWT_SECRET);
