/* FlowForge playtest reports: snapshots, concise diagnosis and user-approved sharing. */
(function(root) {
'use strict';
const boardSize=7;
const abbreviations={blue:'B',orange:'O'};
const shortTile=t=>t?abbreviations[t]:'.';
function snapshot(s,actingTeam,flow) {
 const rows=(arr,fn)=>Array.from({length:boardSize},(_,r)=>
   arr.slice(r*boardSize,(r+1)*boardSize).map(fn).join(''));
 const pieces={};
 for(const team of ['blue','orange']){
  pieces[team]=s.pieces[team].map(p=>({
   id:p.id,level:p.level,home:p.home,active:p.active,
   square:p.active?(p.r<0||p.r>=boardSize?'dock'+p.home:String.fromCharCode(65+p.c)+(p.r+1)):'lost'
  }));
 }
 return {
  turn:s.moves,actingTeam,action:s.lastAction||null,
  ai:actingTeam==='orange'&&s.mode==='ai'?(s.lastAiDecision||null):null,
  score:{...s.score},winner:s.winner||null,
  wetCount:{blue:s.wet.blue.filter(Boolean).length,orange:s.wet.orange.filter(Boolean).length},
  reachingJar:{blue:flow.sourceCount(s,'blue'),orange:flow.sourceCount(s,'orange')},
  grid:rows(s.grid,shortTile), wet:{
    blue:rows(s.wet.blue,x=>x?'W':'.'),
    orange:rows(s.wet.orange,x=>x?'F':'.')
  },
  generators:pieces
 };
}
function latest(s,archive){
 if(s && s.timeline && s.timeline.length)return {
  matchId:s.matchId,started:s.started,mode:s.mode,winner:s.winner,turn:s.moves,
  score:s.score,events:s.history,timeline:s.timeline
 };
 return (archive||[]).find(m=>m.timeline?.length)||(archive||[]).find(m=>m.events?.length>1)||null;
}
function summarize(match,options){
 const compact=!!(options&&options.compact);
 if(!match)return 'No match data yet. Play at least one turn first.';
 const line=[];
 const snapshots=match.timeline||[];
 const last=snapshots[snapshots.length-1]||null;
 const events=match.events||[];
 line.push('FLOWFORGE MATCH REVIEW');
 line.push('Match: '+match.matchId+' | Started: '+(match.started||'unknown'));
 line.push('Mode: '+(match.mode||'unknown')+' | Winner: '+(match.winner||'In progress'));
 line.push('Score: Blue '+(match.score?.blue||0)+'/12; Orange '+(match.score?.orange||0)+'/12');
 line.push('Moves completed: '+snapshots.length);
 if(last){
  line.push('Last position (B=blue pipe, O=orange pipe, .=empty):');
  line.push(...last.grid);
  line.push('Wet tiles: Blue '+last.wetCount.blue+', Orange '+last.wetCount.orange+
    ' | Sources supplying jars: B'+last.reachingJar.blue+' O'+last.reachingJar.orange);
  line.push('Generators: '+['blue','orange'].map(t=>t+': '+last.generators[t].filter(p=>p.active).map(p=>'#'+p.id+'G'+p.level+'@'+p.square).join(', ')).join(' | '));
 }
 line.push('TURN-BY-TURN SNAPSHOTS (oldest first):');
 const recent=snapshots.slice(-(compact?16:80));
 for(const x of recent){
  const a=x.action||{};
  const ai=x.ai?.diagnostics;
  line.push('T'+x.turn+' '+x.actingTeam+': '+(a.action||'action')+' '+(a.to||'')+
    ' B'+x.score.blue+'/O'+x.score.orange+' wet'+x.wetCount.blue+'/'+x.wetCount.orange+
    ' supply'+x.reachingJar.blue+'/'+x.reachingJar.orange+
    (ai?' AI:'+(x.ai.explanation||'')+' reply='+(ai.riskReply||'none'):''));
 }
 if(snapshots.length>recent.length)line.push('Earlier turns omitted: '+(snapshots.length-recent.length));
 if(!compact){
  line.push('EVENT LOG (oldest first):');
  for(const e of events.slice(-150))line.push('T'+e.turn+' '+e.team+': '+e.text);
  if(events.length>150)line.push('Earlier events omitted: '+(events.length-150));
 }
 line.push('Full data can be exported as JSON with Download match JSON.');
 return line.join('\n');
}
function issueUrl(match){
 const title='FlowForge playtest '+(match.matchId||'match')+' — '+(match.winner||'in progress');
 let body=summarize(match,{compact:true});
 if(body.length>3500)body=body.slice(0,3400)+'\n[report shortened; use full JSON for exhaustive analysis]';
 return 'https://github.com/Rakesh3016/FlowForge/issues/new?title='+
  encodeURIComponent(title.slice(0,120))+'&body='+encodeURIComponent(body);
}
root.FlowForgeReport={snapshot,latest,summarize,issueUrl};
})(window);
