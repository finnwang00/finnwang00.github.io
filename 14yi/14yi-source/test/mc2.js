const fs=require('fs');
const src=['data','era','pers','engine','choices'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n');
eval(src+';globalThis.Life=Life;globalThis.PROVS=PROVS;globalThis.BIRTHS_BY_YEAR=BIRTHS_BY_YEAR;');
const Y=+process.argv[2]||2026, N=+process.argv[3]||3000;
const S={n:0,age:0,u5:0,i0:0,edu:{},tier:{},mar:0,kids:0,c46:0,earn:[],wealth:[],cause:{},jobs:{},ch:{},ev:0,err:0,abroad:0,c25:0,out:0,c30:0,uniq:new Set()};
const t0=Date.now();
for(let i=0;i<N;i++){
  let L;
  try{ L=new Life(1000+i*7919+Y,{auto:true,y0:Y}).runToEnd(); }catch(e){S.err++; if(S.err<3) console.error(e.stack.split('\n').slice(0,4).join('\n')); continue;}
  const s=L.summary(); S.n++; S.age+=s.age; if(s.age<5)S.u5++; if(s.age===0)S.i0++;
  if(s.age>=30){S.edu[s.edu]=(S.edu[s.edu]||0)+1;S.c25++; if(s.tier) S.tier[s.tier]=(S.tier[s.tier]||0)+1; S.out+=L.cities.some(c=>!PROVS[L.home.p].cities.includes(c))?1:0;}
  if(s.age>=46){S.mar+=s.married?1:0;S.kids+=s.kids;S.c46++;}
  if(s.age>=60){S.earn.push(s.earn);S.wealth.push(s.wealth);}
  S.cause[s.cause]=(S.cause[s.cause]||0)+1;
  for(const j of s.jobs) S.jobs[j]=(S.jobs[j]||0)+1;
  for(const k in L.resolved) S.ch[k]=(S.ch[k]||0)+1;
  S.ev+=L.log.length; if(s.abroad) S.abroad++;
  S.uniq.add(L.log.filter(e=>!['birth','family'].includes(e.tag)).slice(0,12).map(e=>e.text.slice(0,6)).join('|'));
}
const pc=x=>(100*x).toFixed(1)+'%';
console.log(`Y=${Y} n=${S.n} time ${Date.now()-t0}ms errs ${S.err}`);
console.log('LE',(S.age/S.n).toFixed(1),'IMR‰',(1000*S.i0/S.n).toFixed(1),'U5‰',(1000*S.u5/S.n).toFixed(1),'events/life',(S.ev/S.n).toFixed(1),'abroad',pc(S.abroad/S.n));
console.log('edu30+',Object.entries(S.edu).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+pc(v/S.c25)).join(' '));
console.log('tier',Object.entries(S.tier).map(([k,v])=>k+':'+pc(v/S.c25)).join(' '),' lived outside home prov',pc(S.out/S.c25));
console.log('married46+',pc(S.mar/S.c46),'kids',(S.kids/S.c46).toFixed(2));
const q=(a,f)=>{a.sort((x,y)=>x-y);return (a[Math.floor(f*a.length)]/1e4).toFixed(0)+'万'};
console.log('earn p10/50/90',q(S.earn,.1),q(S.earn,.5),q(S.earn,.9),' wealth p10/50/90',q(S.wealth,.1),q(S.wealth,.5),q(S.wealth,.9));
console.log('causes',Object.entries(S.cause).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>k+':'+pc(v/S.n)).join(' '));
console.log('jobs',Object.entries(S.jobs).sort((a,b)=>b[1]-a[1]).slice(0,22).map(([k,v])=>k+':'+v).join(' '));
console.log('choices',Object.entries(S.ch).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+pc(v/S.n)).join(' '));
console.log('choices/life',(Object.values(S.ch).reduce((a,b)=>a+b,0)/S.n).toFixed(1),' unique first-12 paths',S.uniq.size,'/',S.n);
