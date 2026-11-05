const fs=require('fs');
eval(['data','era','pers','engine','choices'].map(f=>fs.readFileSync(__dirname+'/../src/'+f+'.js','utf8')).join('\n')+';globalThis.Life=Life;');
let errs={},stalls=0,N=+process.argv[2]||3000;
for(let i=0;i<N;i++){
  const y0=1950+Math.floor(Math.random()*77);
  const L=new Life(i*977+13,{auto:false,y0});
  let lastAge=-1,same=0,steps=0;
  try{
    while(!L.done && steps++<2000){
      const r=L.step();
      if(r.choice) L.choose(r.choice.id, Math.random()<.5?0:1);
      if(L.age===lastAge) { if(++same>40){stalls++; console.log('STALL y0',y0,'age',L.age,'pending',L.pending&&L.pending.id, Object.keys(L.flags).filter(k=>/need|pend|fail|xg|zq/.test(k)&&L.flags[k]).join(',')); break;} } else {same=0;lastAge=L.age;}
    }
  }catch(e){const k=e.message+' @'+(e.stack.split('\n')[1]||'').trim(); errs[k]=(errs[k]||0)+1;}
}
console.log('stalls',stalls,'errors',JSON.stringify(errs,null,1));
