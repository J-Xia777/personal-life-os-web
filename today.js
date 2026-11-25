import { dailySummary, sijiURL } from './siji.js';
import { rememberRevision } from './store.js';
const colors = {'p-tea':['tea','sage'],'p-music':['music','lilac'],'p-x':['globe','blue'],'p-red':['pen','peach'],'p-ai':['sparkles','sage'],'p-vibe':['monitor','blue']};
const visibleTasks = state => state.tasks.filter(t=>!t.archivedAt);
function projectTag(c, task) {
  const p=c.state.projects.find(p=>p.id===task.projectId);
  if(!p) return '';
  const [glyph,tone]=colors[p.id]||['folder','sage'];
  return `<span class="project-tag ${tone}">${c.icon(glyph,13)}${c.esc(p.title)}</span>`;
}
const origin = item => item.source==='demo'?'演示':item.basedOnDemo?'改自演示':'我的';
function taskRow(c,t,manage=false) {
  return `<li class="task-row ${t.done?'is-done':''}">
    <button class="task-check" type="button" role="checkbox" aria-checked="${!!t.done}" aria-label="${c.esc(t.title)}" data-task-toggle="${c.esc(t.id)}">${t.done?c.icon('check',16):''}</button>
    <div class="task-copy"><button type="button" class="task-name" data-task-edit="${c.esc(t.id)}">${c.esc(t.title)}</button>
    <div class="task-meta">${projectTag(c,t)}${t.time?`<span class="small-time">${c.icon('clock',13)}${c.esc(t.time)}</span>`:''}${manage?`<span>${c.esc(t.date)} · ${origin(t)}</span>`:t.source==='user'?`<span>${origin(t)}</span>`:''}</div></div>
    ${manage?`<button class="icon-btn subtle" aria-label="编辑 ${c.esc(t.title)}" data-task-edit="${c.esc(t.id)}">${c.icon('pen',16)}</button>`:''}</li>`;
}
function todayTasks(c,tasks) {
  const main=tasks.filter(t=>t.priority==='main');
  const side=tasks.filter(t=>t.priority!=='main');
  return `<article class="panel work-card focus-card">
    <div class="card-head"><h2><span class="head-icon">${c.icon('target')}</span>主线任务</h2><button class="text-btn" data-go="tasks">管理任务 ${c.icon('chevron-right',14)}</button></div>
    <ul class="task-list">${main.length?main.map(t=>taskRow(c,t)).join(''):'<li class="empty">为今天选一件最重要的事。</li>'}</ul>
    <div class="task-foot"><button class="text-btn" data-new-task>${c.icon('plus',15)} 添加任务</button>
    <button class="text-btn side-link" data-sides aria-expanded="false">次要任务 <span>${side.length}</span>${c.icon('chevron-down',14)}</button></div>
    <div data-side-box hidden><ul class="task-list">${side.length?side.map(t=>taskRow(c,t)).join(''):'<li class="empty">今天没有次要任务。</li>'}</ul></div>
    </article>`;
}
function habits(c,manage=false) {
  const all=c.state.habits.filter(h=>!h.archivedAt);
  const day=c.today();
  const done=all.filter(h=>h.checks?.[day]).length;
  return `<article class="panel work-card habit-card"><div class="card-head"><h2><span class="head-icon">${c.icon('habit-loop')}</span>每日习惯</h2>
  <span class="count-meta"><b>${done}</b> / ${all.length}</span></div>
  <div class="habit-rows">${all.map(h=>{const checked=h.checks?.[day];return `<div class="habit-row"><span class="habit-icon ${c.esc(h.tone)}">${c.icon(h.glyph,20)}</span><div class="habit-copy"><span>${c.esc(h.title)}</span><small>${c.esc(h.minimum)}${manage?' · '+origin(h):''}</small></div>
  <button class="habit-check ${checked?'checked':''}" data-habit="${c.esc(h.id)}" aria-label="${c.esc(h.title)}：${checked?'已打卡':'打卡'}" aria-pressed="${!!checked}">${c.icon(checked?'check':'plus',15)}<span>${checked?(checked==='minute'?'一分钟':'已打卡'):'打卡'}</span></button></div>`}).join('')||'<p class="empty">添加一个可以从一分钟开始的习惯。</p>'}</div>
  <div class="habit-foot">${manage?`<button class="text-btn" data-new-habit>${c.icon('plus',15)} 添加习惯</button>`:`<button class="text-btn" data-minute>${c.icon('clock',14)} 最低一分钟</button>`}
  ${manage?'<button class="text-btn" data-minute>一分钟打卡</button>':'<span>小步也算数</span>'}</div></article>`;
}
function schedule(c,tasks) {
  const list=tasks.filter(t=>t.time).sort((a,b)=>a.time.localeCompare(b.time));
  return `<article class="panel work-card schedule-card"><div class="card-head"><h2><span class="head-icon">${c.icon('clock')}</span>时间安排</h2><button class="text-btn" data-new-task>${c.icon('plus',15)} 安排</button></div>
  <ol class="schedule-list">${list.map(t=>`<li><time>${c.esc(t.time)}</time><i></i><button data-task-edit="${c.esc(t.id)}">${c.esc(t.title)}</button></li>`).join('')||'<li class="empty">今天尚未安排具体时间。</li>'}</ol></article>`;
}
function siji(c) {
  const summary=dailySummary(c.state.sijiSnapshot,c.today());
  return `<article class="panel work-card siji-card"><div class="card-head"><h2><span class="head-icon">${c.icon('grid')}</span>四记概览</h2><span class="sample-chip">${summary.source==="demo"?"演示数据":"导入快照"}</span></div>
  <div class="siji-grid">${summary.measures.map(m=>`<div><span class="siji-label"><i class="color-dot ${m.tone}"></i>${m.title}</span><strong>${m.value}<small>${m.unit}</small></strong></div>`).join('')}</div>
  <div class="siji-actions"><a href="#guide">连接与导入</a><a href="${sijiURL}" target="_blank" rel="noopener noreferrer">打开四记 ${c.icon('external-link',14)}</a></div></article>`;
}
export function renderToday(c) {
  const tasks=visibleTasks(c.state).filter(t=>t.date===c.today());
  const done=tasks.filter(t=>t.done).length;
  const n=new Date(), hour=n.getHours();
  const greeting=hour<5?'夜深了':hour<11?'早上好':hour<14?'中午好':hour<18?'下午好':'晚上好';
  return `<section class="today-page">
    <header class="day-cover"><div class="cover-copy"><div class="cover-date"><span class="date-rule"></span>${n.getFullYear()} 年 ${n.getMonth()+1} 月 ${n.getDate()} 日 <span class="date-slash">/</span> 星期${'日一二三四五六'[n.getDay()]}</div>
    <h1>${greeting}，<span>专注当下。</span></h1>
    <p>先主线，再副线。白天执行，晚上思考。</p>
    <div class="day-progress"><span>今日进度</span><progress max="${Math.max(1,tasks.length)}" value="${done}" aria-label="今日任务完成进度"></progress><b>${done} / ${tasks.length}</b></div>
    </div></header>
    <div class="work-grid">${todayTasks(c,tasks)}${habits(c)}${schedule(c,tasks)}${siji(c)}</div>
    <div class="review-strip"><span class="icon-tile">${c.icon('moon',20)}</span><div><strong>晚间复盘</strong><small>留下一件成果，记住今天的收获。</small></div><button class="btn" data-go="review">写复盘</button></div>
    </section>`;
}
export function renderTasks(c){
  const scope=c.params.get('scope')==='all'?'all':'today';
  const tasks=visibleTasks(c.state).filter(t=>scope==='all'||t.date===c.today()).sort((a,b)=>a.date.localeCompare(b.date)||Number(a.done)-Number(b.done));
  return `<div class="page-head"><div><h1>任务与习惯</h1><p>安排时间，为今天保留一到三件主线任务。</p></div><button class="btn primary" data-new-task>${c.icon('plus',17)} 新增任务</button></div>
  <div class="work-grid"><article class="panel work-card"><div class="card-head"><h2>任务清单</h2><div class="seg"><button data-scope="today" aria-pressed="${scope==='today'}">今日</button><button data-scope="all" aria-pressed="${scope==='all'}">全部</button></div></div>
  ${['main','side'].map(p=>`<h3 class="list-label">${p==='main'?'主线任务':'次要任务'}</h3><ul class="task-list">${tasks.filter(t=>t.priority===p).map(t=>taskRow(c,t,true)).join('')||'<li class="empty">暂无任务</li>'}</ul>`).join('')}</article>${habits(c,true)}</div>`;
}
export function editTask(c,id='',projectId=''){
  const task=c.state.tasks.find(t=>t.id===id);
  if(id&&!task)return;
  const date=task?.date||c.today();
  const atLimit=c.state.tasks.filter(t=>!t.archivedAt&&t.date===date&&t.priority==='main').length>=3;
  const priority=task?.priority||(atLimit?'side':'main');
  c.modal(task?'编辑任务':'新增任务',`<form class="edit-form"><label class="field">任务名称<input name="title" value="${c.esc(task?.title)}" required maxlength="160" placeholder="具体要完成什么？"></label>
    <label class="field">任务优先级<select name="priority"><option value="main" ${priority==='main'?'selected':''}>主线任务（每天最多 3 项）</option><option value="side" ${priority==='side'?'selected':''}>次要任务</option></select></label>
    <div class="form-split"><label class="field">日期<input type="date" name="date" required value="${c.esc(date)}"></label><label class="field">时间（选填）<input type="time" name="time" value="${c.esc(task?.time)}"></label></div>
    <label class="field">关联项目<select name="projectId"><option value="">独立任务</option>${c.state.projects.map(p=>`<option value="${c.esc(p.id)}" ${p.id===(task?.projectId||projectId)?'selected':''}>${c.esc(p.title)}</option>`).join('')}</select></label><p data-err class="form-err" role="alert"></p>
    <div class="actions">${task?'<button type="button" class="btn danger" data-delete>删除任务</button>':''}<button class="btn primary" type="submit">保存任务</button></div></form>`,d=>{
    const form=d.querySelector('form');
    form.onsubmit=e=>{
      e.preventDefault();const obj=Object.fromEntries(new FormData(form));obj.title=obj.title.trim();
      if(!obj.title){form.querySelector('[data-err]').textContent='请输入任务名称。';return;}
      const saved=c.save(s=>{
        if(obj.priority==='main'&&s.tasks.filter(t=>!t.archivedAt&&t.id!==id&&t.date===obj.date&&t.priority==='main').length>=3)throw Error('这一天已有 3 项主线任务，请选次要任务或调整日期。');
        const live=s.tasks.find(t=>t.id===id);
        if(id&&!live)throw Error('这项任务已发生变化，请重新打开。');
        if(live){rememberRevision(live);Object.assign(live,obj,{basedOnDemo:live.basedOnDemo||live.source==='demo',source:'user'});}
        else s.tasks.push({...obj,id:c.uid(),source:'user',originalText:obj.title,revisions:[],done:false});
      });
      if(saved){c.closeModal();c.toast('任务已保存');}
    };
    const del=d.querySelector('[data-delete]');
    if(del)del.onclick=()=>{
      c.modal('删除这项任务？',`<p class="dialog-note">「${c.esc(task.title)}」将从任务清单和时间安排中移除。</p><div class="actions"><button class="btn" data-cancel>取消</button><button class="btn danger" data-confirm>确认删除</button></div>`,m=>{
        m.querySelector('[data-cancel]').onclick=c.closeModal;
        m.querySelector('[data-confirm]').onclick=()=>{
          if(c.save(s=>{const item=s.tasks.find(t=>t.id===id);if(item){rememberRevision(item);item.archivedAt=new Date().toISOString();}})){c.closeModal();c.toast('任务已移除');}
        };
      });
    };
  });
}
function minuteDialog(c){
  c.modal('最低一分钟',`<p class="dialog-note">完成最小的一步，就可以为今天打卡。</p><div class="minute-list">${c.state.habits.filter(h=>!h.archivedAt).map(h=>`<button class="minute-choice" data-mini="${c.esc(h.id)}"> <span class="habit-icon ${c.esc(h.tone)}">${c.icon(h.glyph)}</span><span><strong>${c.esc(h.title)}</strong><small>${c.esc(h.minimum)}</small></span><span>${h.checks?.[c.today()]?'已打卡':'完成打卡'}</span></button>`).join('')}</div>`,m=>{
      m.querySelectorAll('[data-mini]').forEach(b=>b.onclick=()=>{
        if(c.save(s=>{const h=s.habits.find(h=>h.id===b.dataset.mini);if(h)(h.checks??={})[c.today()]??='minute';})){c.closeModal();c.toast('今天的小步已记录');}
      });
  });
}
export function bindToday(c) {
  const host=document.querySelector('#main');
  host.querySelectorAll('[data-task-toggle]').forEach(b=>b.onclick=()=>c.save(s=>{const t=s.tasks.find(t=>t.id===b.dataset.taskToggle);if(t)t.done=!t.done;}));
  host.querySelectorAll('[data-task-edit]').forEach(b=>b.onclick=()=>editTask(c,b.dataset.taskEdit));
  host.querySelectorAll('[data-new-task]').forEach(b=>b.onclick=()=>editTask(c));
  host.querySelectorAll('[data-habit]').forEach(b=>b.onclick=()=>c.save(s=>{const h=s.habits.find(h=>h.id===b.dataset.habit);if(!h)return;h.checks??={};if(h.checks[c.today()])delete h.checks[c.today()];else h.checks[c.today()]='normal';}));
  host.querySelectorAll('[data-minute]').forEach(b=>b.onclick=()=>minuteDialog(c));
  host.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>c.go('tasks',{scope:b.dataset.scope}));
  const sub=host.querySelector('[data-sides]');
  if(sub)sub.onclick=()=>{const box=host.querySelector('[data-side-box]');box.hidden=!box.hidden;sub.setAttribute('aria-expanded',String(!box.hidden));};
  const add=host.querySelector('[data-new-habit]');
  if(add)add.onclick=()=>c.modal('新增习惯',`<form class="edit-form"><label class="field">习惯名称<input name="title" required maxlength="60" placeholder="例如，睡前阅读"></label><label class="field">最低一分钟动作<input name="minimum" required maxlength="90" placeholder="例如，读一页书"></label><div class="actions"><button class="btn primary">保存习惯</button></div></form>`,d=>{
    d.querySelector('form').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));if(!data.title.trim()||!data.minimum.trim()){c.toast('请填写习惯和最小动作');return;}if(c.save(s=>s.habits.push({id:c.uid(),title:data.title.trim(),minimum:data.minimum.trim(),glyph:'sprout',tone:'sage',source:'user',checks:{}}))){c.closeModal();c.toast('习惯已添加');}};
  });
}

