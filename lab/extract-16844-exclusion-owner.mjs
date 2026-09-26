import fs from 'node:fs';
const lines = fs.readFileSync('index.html','utf8').split(/\r?\n/);
for (const [a,b] of [[11690,11755],[11820,11870],[11920,11980]]) {
  console.log(`\n===== L${a}-L${b} =====`);
  for (let n=a;n<=b;n++) console.log(`${n}: ${lines[n-1] ?? ''}`);
}
