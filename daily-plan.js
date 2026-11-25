import {today,esc,updateState,storageWarning} from './store.js';
import {tree} from './life-map.js';
import {addAction,contextFor,dayGroups,mainCount,personal,setSchedule} from './daily-model.js';

function choices(state){
  const options=[{label:'独立行动',ref:{}}];
  for(const v of state.visions.filter(personal)){
    options.push({label:v.title,ref:{visionId:v.id}});
    for(const st of (v.stages||[]).filter(st=>!st.done))options.push({label:v.title+' › '+st.title,ref:{visionId:v.id,stageId:st.id}});
  }
  for(const p of state.projects.filter(personal))options.push({label:p.title+(p.stage?' › '+p.stage:''),ref:{projectId:p.id}});
  for(const n of tree(state).values())if(n.path.length===1)options.push({label:n.path[0],ref:{lifeArea:n.path[0]}});
  return options;
}
function priorityOptions(priority){
  return ['main','side'].map((p,i)=>'<option value="'+p+'" '+(p===priority?'selected':'')+'>'+['主线行动','其他行动'][i]+'</option>').join('');
}
function taskRow(s,t,day){
  const context=contextFor(s,t),canCheck=t.date<=day;
  const label=esc(t.title),id=esc(t.id);
  return '<li class="action-row"><div class="action-line">'+(canCheck?'<button class="action-check" data-done="'+id+'" aria-label="'+(t.done?'撤销完成 ':'完成 ')+label+'" aria-pressed="'+!!t.done+'">'+(t.done?'✓':'○')+'</button>':'')+
    '<div><strong>'+label+'</strong><small>'+esc([t.date!==day?t.date:'',t.time,context].filter(Boolean).join(' · '))+'</small></div></div>'+
    (t.done?'':'<details class="adjust"><summary>调整安排</summary><form data-move="'+id+'"><label>执行日期<input type="date" name="date" value="'+esc(t.date<day?day:t.date)+'" required></label><label>优先级<select name="priority">'+priorityOptions(t.priority)+'</select></label><button class="ink">保存安排</button></form></details>')+'</li>';
}
export function renderDay(page,s,render){
  const day=today(),groups=dayGroups(s,day),refs=choices(s);
  const rows=items=>'<ul class="action-list">'+items.map(t=>taskRow(s,t,day)).join('')+'</ul>';
  const folded=(label,items)=>items.length?'<details class="day-fold"><summary>'+label+' · '+items.length+'</summary>'+rows(items)+'</details>':'';
  const habits=s.habits.filter(personal);
  const next=s.visions.filter(personal).flatMap(v=>(v.stages||[]).map(st=>({v,st}))).filter(({st})=>!st.done).sort((a,b)=>(a.st.targetDate||'9999').localeCompare(b.st.targetDate||'9999')).find(({st})=>!s.tasks.some(t=>personal(t)&&!t.done&&t.stageId===st.id));
  const candidate=s.projects.filter(p=>personal(p)&&p.status==='active').flatMap(p=>(p.milestones||[])
    .filter(m=>personal(m)&&!m.done&&!s.tasks.some(t=>personal(t)&&t.projectId===p.id&&(t.milestoneId===m.id||t.title===m.title)))
    .map(m=>({project:p,milestone:m})))[0];
  const suggestion=!groups.main.length&&!groups.done.some(t=>t.priority==='main')?(
    candidate?'<p class="day-suggest"><small>来自「'+esc(candidate.project.title)+'」的待办里程碑</small>'+esc(candidate.milestone.title)+' <button type="button" data-propose="milestone">拆成今天的一步 →</button></p>':
    next?'<p class="day-suggest"><small>待推进的阶段成果</small>'+esc(next.st.title)+' <button type="button" data-propose="stage">写下今天的一步 →</button></p>':''
  ):'';
  page.innerHTML='<div class="map-page day-page"><div class="map-crumb"><a href="#write">随手记</a> / '+esc(day)+'</div><h1>今日行动</h1>'+
    '<section><div class="day-head"><h2>今天的主线</h2><a href="#ideals">理想与阶段 ↗</a></div>'+
    (groups.main.length?rows(groups.main):'<p class="muted">'+(groups.done.some(t=>t.priority==='main')?'今天安排的主线已完成。':'今天还没有主线。选一件做完后，能让阶段目标往前走的事。')+'</p>')+'</section>'+
    '<details class="day-new"><summary>＋ 安排一个行动</summary><form data-new-action><label>具体做什么？<input name="title" maxlength="160" required></label><label>服务于哪个方向？<select name="ref">'+refs.map((o,i)=>'<option value="'+i+'">'+esc(o.label)+'</option>').join('')+'</select></label><label>哪一天做？<input type="date" name="date" value="'+day+'" required></label><label>优先级<select name="priority">'+priorityOptions(mainCount(s,day)>=3?'side':'main')+'</select></label><button class="ink">保存行动</button></form></details>'+
    suggestion+
    (groups.side.length?'<section><h2>今天的其他行动</h2>'+rows(groups.side)+'</section>':'')+
    (habits.length?'<section><h2>生活习惯</h2><ul class="action-list">'+habits.map(h=>'<li><button class="habit-tick" data-minute="'+esc(h.id)+'" aria-pressed="'+!!h.checks?.[day]+'">'+(h.checks?.[day]?'✓':'○')+' '+esc(h.title)+'</button><small>'+esc(h.minimum)+'</small></li>').join('')+'</ul></section>':'')+
    folded('已完成',groups.done)+folded('以前留下的行动',groups.overdue)+folded('未来已安排',groups.later)+
    '<p class="day-links"><a href="./#tasks?scope=all">管理任务与习惯 ↗</a><a href="#write">写一句复盘 ↗</a></p><p role="status">'+esc(storageWarning())+'</p></div>';
  const proposal=page.querySelector('[data-propose]');
  let proposedMilestone;
  if(proposal)proposal.onclick=()=>{
    const f=page.querySelector('[data-new-action]');
    f.closest('details').open=true;
    const fromProject=proposal.dataset.propose==='milestone';
    const ref=refs.findIndex(o=>fromProject?o.ref.projectId===candidate.project.id:o.ref.stageId===next.st.id);
    if(ref!==-1)f.elements.ref.value=String(ref);
    proposedMilestone=fromProject?candidate:undefined;
    f.elements.title.placeholder=fromProject?'为「'+candidate.milestone.title+'」先做什么？':'为「'+next.st.title+'」先做什么？';
    f.elements.title.focus();
  };
  function save(fn){
    try{updateState(fn);render();page.querySelector('[role=status]').textContent='已保存';}
    catch(e){page.querySelector('[role=status]').textContent=e.message;}
  }
  page.querySelectorAll('form').forEach(f=>f.onsubmit=e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(f));
    if(f.hasAttribute('data-move'))save(s=>setSchedule(s,f.dataset.move,data.date,data.priority));
    else save(s=>{
      const ref=refs[data.ref].ref;
      const task=addAction(s,{...data,...ref});
      if(proposedMilestone&&ref.projectId===proposedMilestone.project.id)task.milestoneId=proposedMilestone.milestone.id;
    });
  });
  page.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>save(s=>{
    const t=s.tasks.find(t=>t.id===b.dataset.done&&personal(t));
    if(t)t.done=b.getAttribute('aria-pressed')!=='true';
  }));
  page.querySelectorAll('[data-minute]').forEach(b=>b.onclick=()=>save(s=>{
    const h=s.habits.find(h=>h.id===b.dataset.minute&&personal(h));
    if(!h)return;
    h.checks??={};if(b.getAttribute('aria-pressed')==='true')delete h.checks[day];else h.checks[day]='minute';
  }));
}
