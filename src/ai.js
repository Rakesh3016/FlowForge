/* FlowForge AI V4. Pure search/evaluation module; can be replaced without editing game rules. */
(function(root) {
'use strict';
const N=7, GOAL=6, PORTS=[0,1,2,4,5,6], DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const index=(r,c)=>r*N+c;
const inside=(r,c)=>r>=0&&r<N&&c>=0&&c<N;
const other=t=>t==='blue'?'orange':'blue';
const edge=t=>t==='blue'?6:0;
const target=t=>({r:t==='blue'?0:6,c:3});
const active=(s,t)=>s.pieces[t].filter(p=>p.active);
const dock=(t,p)=>p.active&&p.r===(t==='blue'?7:-1);
const findPiece=(s,t,r,c)=>active(s,t).find(p=>p.r===r&&p.c===c);
const adjacent=(p,r,c)=>Math.abs(p.r-r)+Math.abs(p.c-c)===1;
function connectivity(s,t) {
  const seen=new Set(),q=[];
  for(const c of PORTS){const r=edge(t),i=index(r,c);if(s.grid[i]===t&&!seen.has(i)){seen.add(i);q.push(i);}}
  for(let k=0;k<q.length;k++){
    const i=q[k],r=(i/N)|0,c=i%N;
    for(const [dr,dc] of DIRS){const rr=r+dr,cc=c+dc,ii=index(rr,cc);if(inside(rr,cc)&&!seen.has(ii)&&s.grid[ii]===t){seen.add(ii);q.push(ii);}}
  }
  return seen;
}
function connected(s,t,a,b) {
  if(!inside(a.r,a.c)||!inside(b.r,b.c))return false;
  const end=index(b.r,b.c),start=index(a.r,a.c);
  if(s.grid[start]!==t||s.grid[end]!==t)return false;
  const seen=new Set([start]),q=[start];
  for(let k=0;k<q.length;k++){
    const i=q[k];if(i===end)return true;
    const r=(i/N)|0,c=i%N;
    for(const [dr,dc] of DIRS){const rr=r+dr,cc=c+dc,ii=index(rr,cc);if(inside(rr,cc)&&!seen.has(ii)&&s.grid[ii]===t){seen.add(ii);q.push(ii);}}
  }
  return false;
}
function sourceCount(s,t) {
  const goal=target(t),i=index(goal.r,goal.c);if(s.grid[i]!==t)return 0;
  const seen=new Set([i]),q=[i],ports=new Set();
  for(let k=0;k<q.length;k++){
    const r=(q[k]/N)|0,c=q[k]%N;
    if(r===edge(t)&&PORTS.includes(c))ports.add(c);
    for(const [dr,dc] of DIRS){const rr=r+dr,cc=c+dc,ii=index(rr,cc);if(inside(rr,cc)&&!seen.has(ii)&&s.grid[ii]===t){seen.add(ii);q.push(ii);}}
  }
  return ports.size;
}
function legal(s,t,p,r,c) {
  if(!p.active||!inside(r,c))return null;
  const what=s.grid[index(r,c)],entrance=dock(t,p)&&r===edge(t)&&c===p.home;
  if(what===null&&(adjacent(p,r,c)||entrance))return 'build';
  if(what===other(t)&&adjacent(p,r,c))return 'attack';
  if(what===t&&!findPiece(s,t,r,c)){
    const a=dock(t,p)?{r:edge(t),c:p.home}:p;
    if(connected(s,t,a,{r,c}))return 'move';
  }
  return null;
}
function actionList(s,t) {
  const result=[];
  for(const p of active(s,t)) {
    // Ordinary building/attacks: only neighbors; moves along friendly pipe network.
    const done=new Set();
    const add=(r,c)=>{if(!inside(r,c)||done.has(index(r,c)))return;done.add(index(r,c));const type=legal(s,t,p,r,c);if(type)result.push({id:p.id,r,c,action:type});};
    for(const [dr,dc] of DIRS)add(p.r+dr,p.c+dc);
    if(dock(t,p))add(edge(t),p.home);
    if(!dock(t,p))for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(s.grid[index(r,c)]===t)add(r,c);
    if(p.level===1) {
      for(const q of active(s,t)) {
        if(q.id===p.id||q.level!==1||!inside(q.r,q.c))continue;
        const a=dock(t,p)?{r:edge(t),c:p.home}:p;
        if(connected(s,t,a,q))result.push({id:p.id,r:q.r,c:q.c,action:'merge'});
      }
    }
  }
  return result;
}
function apply(s,t,action) {
  const o={...s,grid:s.grid.slice(),pieces:{blue:s.pieces.blue.map(p=>({...p})),orange:s.pieces.orange.map(p=>({...p}))},score:{...s.score}};
  const p=o.pieces[t][action.id],r=action.r,c=action.c,i=index(r,c);
  if(action.action==='build'){o.grid[i]=t;p.r=r;p.c=c;}
  else if(action.action==='move'){p.r=r;p.c=c;}
  else if(action.action==='merge') {const q=findPiece(o,t,r,c);if(!q)return o;q.active=false;q.r=-99;q.c=-99;p.r=r;p.c=c;p.level=2;}
  else if(action.action==='attack'){
    const foe=other(t),q=findPiece(o,foe,r,c);
    if(q&&q.level===2)q.level=1;
    else {o.grid[i]=null;if(q){q.active=false;q.r=-99;q.c=-99;}}
  }
  const flow=Math.min(2,sourceCount(o,t));
  o.score[t]=Math.min(GOAL,o.score[t]+flow);
  return o;
}
// Number of additional construction/attack operations needed to reach the target
// from any permanently live source.  A tile already owned by the team costs zero.
function networkDistance(s,t) {
  const dist=new Float64Array(N*N).fill(1e6),used=new Uint8Array(N*N);
  for(const c of PORTS){const i=index(edge(t),c);dist[i]=s.grid[i]===t?0:1;}
  for(let k=0;k<N*N;k++){
    let node=-1,best=1e6;
    for(let i=0;i<N*N;i++)if(!used[i]&&dist[i]<best){best=dist[i];node=i;}
    if(node<0)break;
    used[node]=1;
    const r=(node/N)|0,c=node%N;
    for(const [dr,dc] of DIRS){const rr=r+dr,cc=c+dc;if(!inside(rr,cc))continue;
      const i=index(rr,cc),p=findPiece(s,other(t),rr,cc);
      const cost=s.grid[i]===t?0:s.grid[i]===null?1:(p?(p.level===2?3:2):2);
      if(dist[node]+cost<dist[i])dist[i]=dist[node]+cost;
    }
  }
  const g=target(t);return dist[index(g.r,g.c)];
}
function evaluate(s) {
  if(s.score.orange>=GOAL)return 100000;
  if(s.score.blue>=GOAL)return -100000;
  // Higher is better for Orange AI.
  let value=(s.score.orange-s.score.blue)*145;
  const orangeFlow=Math.min(2,sourceCount(s,'orange'));
  const blueFlow=Math.min(2,sourceCount(s,'blue'));
  value+=(orangeFlow-blueFlow)*95;
  value+=(networkDistance(s,'blue')-networkDistance(s,'orange'))*23;
  const oPowered=connectivity(s,'orange'),bPowered=connectivity(s,'blue');
  value+=(oPowered.size-bPowered.size)*2.4;
  const orangePieces=active(s,'orange'),bluePieces=active(s,'blue');
  // Protect limited, permanently destroyable builders.
  value+=(orangePieces.length-bluePieces.length)*122;
  value+=(orangePieces.reduce((a,p)=>a+(p.level-1),0)-bluePieces.reduce((a,p)=>a+(p.level-1),0))*26;
  for(const t of ['orange','blue']) {
    let danger=0,front=99;
    const enemies=active(s,other(t));
    const goal=target(t);
    for(const p of active(s,t)) {
      if(inside(p.r,p.c)){
        front=Math.min(front,Math.abs(p.r-goal.r)+Math.abs(p.c-goal.c));
        if(enemies.some(q=>adjacent(q,p.r,p.c))) danger+=p.level===1?88:42;
        // Extra protection for the generator currently maintaining a route.
        if(s.grid[index(p.r,p.c)]===t && !connectivity(s,t).has(index(p.r,p.c)))danger+=6;
      }
    }
    if(front===99)front=7;
    const term=-1.25*front-danger;
    value+=t==='orange'?term:-term;
  }
  return value;
}
function compareMoves(a,b){return a.id-b.id||a.r-b.r||a.c-b.c||a.action.localeCompare(b.action);}
function choose(state) {
  const actions=actionList(state,'orange');
  if(!actions.length)return {move:null,explanation:'No legal moves; passing turn.',diagnostics:{candidates:0}};
  const ranked=actions.map(a=>({a,sim:apply(state,'orange',a)}));
  for(const r of ranked)r.value=evaluate(r.sim);
  ranked.sort((x,y)=>y.value-x.value||compareMoves(x.a,y.a));
  // Look ahead at the human's strongest response for the best immediate options.
  // Keep this bounded to avoid stalls on mobile devices.
  const shortlist=ranked.slice(0,Math.min(14,ranked.length));
  let best=null, bestValue=-Infinity, bestReply=null;
  for(const r of shortlist){
    const responses=actionList(r.sim,'blue');
    let afterReply=r.value,reply=null;
    for(const m of responses){const v=evaluate(apply(r.sim,'blue',m));if(v<afterReply){afterReply=v;reply=m;}}
    const value=.34*r.value+.66*afterReply;
    if(value>bestValue+0.000001||(Math.abs(value-bestValue)<0.000001&&best&&compareMoves(r.a,best.a)<0)){
      best=r;bestValue=value;bestReply=reply;
    }
  }
  // Clear, human-readable diagnostics help debug choices and compare strengths.
  const a=best.a;
  let explanation='';
  if(a.action==='attack')explanation='Disrupts an enemy pipe or generator';
  else if(a.action==='merge')explanation='Protects a generator with a Gen2 merge';
  else if(a.action==='move')explanation='Repositions along the connected pipeline';
  else explanation='Expands toward the opponent’s jar';
  if(bestReply && bestReply.action==='attack') explanation+='; anticipates a Blue counterattack';
  return {move:a,explanation,diagnostics:{candidates:actions.length,shortlist:shortlist.length,immediate:Number(best.value.toFixed(1)),afterReply:Number(bestValue.toFixed(1)),riskReply:bestReply?.action||'none'}};
}
root.FlowForgeAI={version:'V4 · reply-aware',choose};
})(window);