const fs=require('fs');
eval(['data','era','pers','engine','choices'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n')+';globalThis.Life=Life;');
const [Y,seed]=[+process.argv[2],+process.argv[3]];
const L=new Life(seed,{auto:true,y0:Y});
let g=0; while(!L.done&&g++<300){const r=L.step(); }
for(const e of L.log) console.log(`${e.year} ${String(e.age).padStart(3)}岁 [${e.tag}] ${e.text}${e.fact?'  ('+e.fact+')':''}`);
console.log('choices:',Object.keys(L.resolved).join(','));
const s=L.summary(); console.log(s.name,s.prov,s.edu,s.jobs.join('/'),'earn',Math.round(s.earn/1e4)+'万','wealth',Math.round(s.wealth/1e4)+'万');
