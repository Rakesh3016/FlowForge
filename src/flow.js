/* Shared water/fire simulation for the FlowForge 7x7 playtest. */
(function(root){
'use strict';
const N=7, ports=[0,1,2,4,5,6], dirs=[[1,0],[-1,0],[0,1],[0,-1]];
const idx=(r,c)=>r*N+c,inside=(r,c)=>r>=0&&r<N&&c>=0&&c<N,edge=t=>t==='blue'?6:0;
function connected(s,t){
 const seen=new Set(),q=[];
 for(const c of ports){const i=idx(edge(t),c);if(s.grid[i]===t&&!seen.has(i)){seen.add(i);q.push(i);}}
 for(let p=0;p<q.length;p++){
  const i=q[p],r=(i/N)|0,c=i%N;
  for(const [dr,dc] of dirs){const rr=r+dr,cc=c+dc,j=idx(rr,cc);
   if(inside(rr,cc)&&!seen.has(j)&&s.grid[j]===t){seen.add(j);q.push(j);}}
 }
 return seen;
}
// Removes water/fire from all wet segments that lost every live source.
function spill(s){
 const spilled={blue:0,orange:0};
 for(const t of ['blue','orange']){
  const live=connected(s,t),wet=s.wet[t];
  for(let i=0;i<N*N;i++)if(wet[i]&&!live.has(i)){wet[i]=false;spilled[t]++;}
 }
 return spilled;
}
// At most one new pipe hop per owner's completed turn, simultaneously on branches.
function tick(s,t){
 const spilled=spill(s),powered=connected(s,t),wet=s.wet[t],previous=wet.slice(),next=new Set();
 for(const c of ports){const i=idx(edge(t),c);if(powered.has(i))next.add(i);}
 for(let i=0;i<N*N;i++){
  if(!previous[i]||!powered.has(i))continue;
  const r=(i/N)|0,c=i%N;
  for(const [dr,dc] of dirs){const rr=r+dr,cc=c+dc,j=idx(rr,cc);
   if(inside(rr,cc)&&powered.has(j))next.add(j);}
 }
 let filled=0;for(const i of next)if(!wet[i]){wet[i]=true;filled++;}
 return {spilled,filled};
}
// Score only for sources reaching the goal through a continuous WET route.
function sourceCount(s,t){
 const start=idx(t==='blue'?0:6,3);
 if(s.grid[start]!==t||!s.wet[t][start])return 0;
 const seen=new Set([start]),q=[start],sources=new Set();
 for(let p=0;p<q.length;p++){
  const i=q[p],r=(i/N)|0,c=i%N;
  if(r===edge(t)&&ports.includes(c))sources.add(c);
  for(const [dr,dc] of dirs){const rr=r+dr,cc=c+dc,j=idx(rr,cc);
   if(inside(rr,cc)&&!seen.has(j)&&s.grid[j]===t&&s.wet[t][j]){seen.add(j);q.push(j);}}
 }
 return sources.size;
}
root.FlowForgeFlow={connected,spill,tick,sourceCount};
})(window);
