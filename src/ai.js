/* FlowForge AI V5. Pure search/evaluation module; can be replaced without editing game rules. */
(function(root) {
'use strict';
const N=7, GOAL=12, PORTS=[0,1,2,4,5,6], DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
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
 return root.FlowForgeFlow.sourceCount(s,t);
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
  const o={...s,grid:s.grid.slice(),wet:{blue:s.wet.blue.slice(),orange:s.wet.orange.slice()},pieces:{blue:s.pieces.blue.map(p=>({...p})),orange:s.pieces.orange.map(p=>({...p}))},score:{...s.score}};
  const p=action.action==='wait'?null:o.pieces[t][action.id],r=action.r,c=action.c,i=action.action==='wait'?-1:index(r,c);
  if(action.action==='build'){o.grid[i]=t;p.r=r;p.c=c;}
  else if(action.action==='move'){p.r=r;p.c=c;}
  else if(action.action==='merge') {const q=findPiece(o,t,r,c);if(!q)return o;q.active=false;q.r=-99;q.c=-99;p.r=r;p.c=c;p.level=2;}
  else if(action.action==='attack'){
    const foe=other(t),q=findPiece(o,foe,r,c);
    if(q&&q.level===2)q.level=1;
    else if(q){
      q.active=false;q.r=-99;q.c=-99;
      o.wet[foe][i]=false;
      o.grid[i]=t;
      p.r=r;p.c=c;
    } else {
      o.wet[foe][i]=false;
      o.wet[t][i]=false;
      o.grid[i]=t;
      p.r=r;p.c=c;
    }
  }
  root.FlowForgeFlow.tick(o,t);
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
  if(s.score.orange>=GOAL)return 1000000;
  if(s.score.blue>=GOAL)return -1000000;
  // Positive values favor Orange. Reachable flow is more valuable near the end.
  const orangeFlow=Math.min(2,sourceCount(s,'orange'));
  const blueFlow=Math.min(2,sourceCount(s,'blue'));
  const urgency=s.score.blue>=GOAL-4?2.0:1;
  let value=(s.score.orange-s.score.blue)*220;
  value+=(orangeFlow-blueFlow)*170*urgency;
  value+=(networkDistance(s,'blue')-networkDistance(s,'orange'))*42;
  const oPowered=connectivity(s,'orange'), bPowered=connectivity(s,'blue');
  value+=(oPowered.size-bPowered.size)*3.5;
  const orangePieces=active(s,'orange'),bluePieces=active(s,'blue');
  value+=(orangePieces.length-bluePieces.length)*185;
  value+=(orangePieces.reduce((a,p)=>a+(p.level-1),0)-bluePieces.reduce((a,p)=>a+(p.level-1),0))*60;
  for(const t of ['orange','blue']) {
    const enemies=active(s,other(t));
    const goal=target(t);
    let front=20,exposure=0;
    for(const p of active(s,t)) {
      if(!inside(p.r,p.c))continue;
      const d=Math.abs(p.r-goal.r)+Math.abs(p.c-goal.c);
      front=Math.min(front,d);
      const enemyDistance=enemies.reduce((best,q)=>inside(q.r,q.c)?Math.min(best,Math.abs(q.r-p.r)+Math.abs(q.c-p.c)):best,99);
      // An adjacent enemy can destroy a Gen1 immediately (Gen2 loses one level).
      if(enemyDistance===1)exposure+=p.level===1?250:105;
      else if(enemyDistance===2)exposure+=p.level===1?17:8;
      if(s.grid[index(p.r,p.c)]===t && !((t==='orange'?oPowered:bPowered).has(index(p.r,p.c))))exposure+=10;
    }
    if(front===20)front=10;
    const term=-front*19-exposure;
    value+=t==='orange'?term:-term;
  }
  return value;
}
function compareMoves(a,b){return a.id-b.id||a.r-b.r||a.c-b.c||a.action.localeCompare(b.action);}
function choose(state) {
  const actions=actionList(state,'orange');
  if(!actions.length)return {move:null,explanation:'No legal moves; passing turn.',diagnostics:{candidates:0,shortlist:0,riskReply:'none'}};
  const blueFlowBefore=sourceCount(state,'blue');
  const ranked=actions.map(a=>{
    const sim=apply(state,'orange',a);
    const value=evaluate(sim);
    const cut=blueFlowBefore>0 && sourceCount(sim,'blue')<blueFlowBefore;
    return {a,sim,value,cut};
  });
  ranked.sort((x,y)=>y.value-x.value||compareMoves(x.a,y.a));
  // Don't prune away a necessary pipe cut just because expansion scores well now.
  const shortlist=ranked.slice(0,Math.min(22,ranked.length));
  const included=new Set(shortlist.map(x=>x.a.id+':'+x.a.r+':'+x.a.c+':'+x.a.action));
  let extras=0;
  for(const item of ranked){
    if(extras>=8)break;
    const key=item.a.id+':'+item.a.r+':'+item.a.c+':'+item.a.action;
    if(item.cut&&!included.has(key)){shortlist.push(item);included.add(key);extras++;}
  }
  let best=null,bestValue=-Infinity,bestReply=null;
  for(const r of shortlist){
    // Blue can also choose to wait and collect water. Check this explicitly.
    const passState=apply(r.sim,'blue',{action:'wait'});
    let afterReply=evaluate(passState),reply={action:'wait'};
    for(const m of actionList(r.sim,'blue')) {
      const v=evaluate(apply(r.sim,'blue',m));
      if(v<afterReply){afterReply=v;reply=m;}
      if(afterReply<=-1000000)break;
    }
    const value=.20*r.value+.80*afterReply;
    if(value>bestValue+1e-6||(Math.abs(value-bestValue)<1e-6&&best&&compareMoves(r.a,best.a)<0)){
      best=r;bestValue=value;bestReply=reply;
    }
  }
  const a=best.a;
  let explanation='';
  if(best.cut)explanation='Cuts a powered Blue supply route';
  else if(a.action==='attack')explanation='Disrupts an enemy pipe or generator';
  else if(a.action==='merge')explanation='Combines two generators into a Gen2';
  else if(a.action==='move')explanation='Repositions along the connected network';
  else explanation='Expands its powered pipeline toward the jar';
  if(bestReply?.action==='attack')explanation+='; expects a Blue counterattack';
  return {move:a,explanation,diagnostics:{candidates:actions.length,shortlist:shortlist.length,immediate:Number(best.value.toFixed(1)),afterReply:Number(bestValue.toFixed(1)),riskReply:bestReply?.action||'none',threat:state.score.blue+'/'+GOAL}};
}
root.FlowForgeAI={version:'V5 · defensive planner',choose};
})(window);