const fs = require('fs');
let code = fs.readFileSync('src/data/challenges.ts', 'utf8');

function swapArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

let newCode = code.replace(/options:\s*\[([\s\S]*?)\]/g, (match, p1) => {
  let opts = [];
  let regex = /"(.*?)"/g;
  let m;
  while ((m = regex.exec(p1)) !== null) {
    opts.push(m[1]);
  }
  
  if (opts.length > 0) {
    swapArray(opts);
    return 'options: [\n      "' + opts.join('",\n      "') + '"\n    ]';
  }
  return match;
});

fs.writeFileSync('src/data/challenges.ts', newCode);
console.log("Shuffled successfully");
