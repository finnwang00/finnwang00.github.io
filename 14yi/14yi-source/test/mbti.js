const fs=require('fs');
eval(['data','era','pers','engine','choices'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n')+';globalThis.Life=Life;');
const N=+process.argv[2]||2000; const T={},F={},stats={n:0,same:0,d1:0,d2:0,ch12:0,ch23:0,letters:[0,0,0,0,0]},axisCh={ei:0,sn:0,tf:0,jp:0};
for(let i=0;i<N;i++){
  const y0=1950+Math.floor(Math.random()*77);
  const L=new Life(i*313+7,{auto:true,y0}).runToEnd();
  const m=L.mbti; if(m.length<3) continue;
  stats.n++; const a=m[0].type,b=m[1].type,c=m[2].type;
  T[a]=(T[a]||0)+1; F[c]=(F[c]||0)+1;
  const diff=(x,y)=>[...x].filter((ch,k)=>ch!==y[k]).length;
  if(a===b&&b===c) stats.same++;
  stats.ch12+=diff(a,b); stats.ch23+=diff(b,c); stats.letters[diff(a,c)]++;
  ['ei','sn','tf','jp'].forEach((ax,k)=>{ if(a[k]!==c[k]) axisCh[ax]++; });
}
const pc=x=>(100*x/stats.n).toFixed(1)+'%';
console.log('lives w/3 snaps',stats.n,'never changed',pc(stats.same),'avg letters changed 14→27',(stats.ch12/stats.n).toFixed(2),'27→end',(stats.ch23/stats.n).toFixed(2));
console.log('14岁 vs 最后 letters diff dist',stats.letters.map(pc).join(' '),' axis change',JSON.stringify(axisCh));
const show=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+pc(v)).join(' ');
console.log('teen types',show(T)); console.log('final types',show(F));
