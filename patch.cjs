const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  /await Promise\.race\(\[\s*\(\s*async\s*\(\)\s*=>\s*\{([\s\S]*?)\}\)\(\),\s*new Promise\(\(\_,\s*reject\)\s*=>\s*setTimeout\(\(\)\s*=>\s*reject\(new Error\('timeout'\)\),\s*5000\)\)\s*\]\);/g,
  '$1'
);
fs.writeFileSync('src/App.tsx', content);
