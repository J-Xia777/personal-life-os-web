import {today,readState,updateState,uid,esc,storageWarning,storageKey} from './store.js';
import {icon} from './icons.js';
import {writeNote,replyToNote,arrangeNote,questionFor,datedAction,changeBody,relatedNote} from './now-model.js';

const page=document.querySelector('#paper');
const draftKey='personal-life-os.quick-draft';
const prompts=['今天有什么事，值得你留下一句？','刚才的一幕里，哪个细节最鲜明？','有什么想试的小事，怕转头就忘了？'];
let cue=-1,latest='',replyId='',query='',draft='',message='',shown=30;
const replies=new Map();
try{draft=sessionStorage.getItem(draftKey)||'';}catch{}
function remember(text){
  draft=text;
  try{if(text)sessionStorage.setItem(draftKey,text);else sessionStorage.removeItem(draftKey);}catch{}
}
const mine=s=>s.entries.filter(e=>e.source!=='demo').sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
function row(e){
  return '<details class="memory"><summary><time>'+esc(e.date)+'</time><strong>'+esc(e.title)+'</strong>'+icon('chevron-down',15)+'</summary><p>'+esc(e.body)+'</p><button class="reflect" data-edit="'+esc(e.id)+'">编辑文字</button></details>';
}
function followup(s,e){
  if(!e)return '';
  const action=datedAction(e),task=s.tasks.find(t=>t.captureId===e.id&&!t.archivedAt);
  const question=questionFor(e.body);
  const related=relatedNote(e,mine(s));
  const echo=related?'<section class="echo"><h2>以前也写过 · '+esc(related.words.join('、'))+'</h2>'+row(related.entry)+'</section>':'';
  const plan=task?'<a class="soft" href="./#tasks?scope=all">已加入 '+esc(task.date)+' 的任务 ↗</a>':action?'<div class="proposal"><span>'+esc(action.date.slice(5))+' · '+esc(action.title)+'</span><button data-plan>加入任务</button></div>':'';
  return '<section class="after"><div class="saved">'+icon('check',16)+' 已记下</div><p class="excerpt">'+esc(e.body)+'</p>'+plan+
    (replyId===e.id?'<form id="reply"><label for="answer">'+esc(question)+'</label><textarea id="answer" rows="2" placeholder="再写一句…">'+esc(replies.get(e.id)||'')+'</textarea><button class="ink">存入这条记录</button> <button type="button" data-dismiss>收起</button></form>':'<button class="reflect" data-reflect>'+icon('journal',16)+' 接着想一想</button>')+echo+'</section>';
}
function render(){
  const recall=location.hash==='#recall';
  const state=readState(),items=mine(state),e=items.find(n=>n.id===latest);
  for(const a of document.querySelectorAll('nav a')){
    if(a.hash===(recall?'#recall':'#write'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  }
  const error=storageWarning();
  if(recall){
    page.innerHTML='<div class="date">我的记录</div><h1>回看</h1><input id="search" type="search" aria-label="搜索我的记录" placeholder="找一句话、一个人、一件事…" value="'+esc(query)+'"><div id="results"></div><div role="alert">'+esc(error)+'</div>';
    function results(){
      const matches=items.filter(n=>(n.title+' '+n.body).toLowerCase().includes(query.trim().toLowerCase()));
      document.querySelector('#results').innerHTML=matches.slice(0,shown).map(row).join('')+(matches.length>shown?'<button data-more>再看一些</button>':'')+(!matches.length?'<p class="muted">'+(query?'没有找到这句话。':'你写下的第一句话会出现在这里。')+'</p>':'');
      const more=page.querySelector('[data-more]');if(more)more.onclick=()=>{shown+=30;results();};
    }
    page.querySelector('#search').oninput=ev=>{query=ev.target.value;shown=30;results();};results();return;
  }
  const date=new Date();
  const day=date.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
  const pending=state.tasks.filter(t=>t.source!=='demo'&&!t.archivedAt&&!t.done&&t.date===today()).sort((a,b)=>Number(b.priority==='main')-Number(a.priority==='main'))[0];
  const recent=items.filter(x=>x.id!==latest).slice(0,3);
  page.innerHTML='<div class="date"><span></span>'+esc(day)+'</div><h1>此刻，想记下什么？</h1><form id="capture"><label class="sr" for="note">随手记</label><textarea id="note" rows="4" placeholder="'+esc(cue<0?'想到哪儿，就写到哪儿…':prompts[cue])+'">'+esc(draft)+'</textarea><div class="compose-foot"><button type="button" data-cue>'+icon('bulb',16)+' 给我一个开头</button><button class="ink" type="submit">记下 '+icon('arrow-right',16)+'</button></div></form><p role="status" id="msg">'+esc(message||error)+'</p>'+
    followup(state,e)+(pending?'<section class="single"><h2>今天的一件事</h2><button class="task" data-done="'+esc(pending.id)+'" aria-label="完成 '+esc(pending.title)+'">○ <span>'+esc(pending.title)+'</span></button></section>':'')+(recent.length?'<section class="single"><h2>最近写下</h2>'+recent.map(row).join('')+'</section>':'');
  const note=page.querySelector('#note');
  const notice=text=>{message=text;page.querySelector('#msg').textContent=text;};
  const save=(change,done)=>{try{updateState(change);}catch(err){notice(err.name==='QuotaExceededError'?'设备空间不足，这段文字仍在输入框中。':err.message);return;}done();render();};
  note.oninput=()=>remember(note.value);
  page.querySelector('#capture').onsubmit=ev=>{
    ev.preventDefault();if(!note.value.trim()){note.focus();return;}
    const id=uid();save(s=>writeNote(s,note.value,id,today()),()=>{remember('');latest=id;replyId='';message='';cue=-1;});
  };
  note.onkeydown=ev=>{if(!ev.isComposing&&ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)){ev.preventDefault();note.form.requestSubmit();}};
  page.querySelector('[data-cue]').onclick=()=>{cue=(cue+1)%prompts.length;note.placeholder=prompts[cue];notice(prompts[cue]);note.focus();};
  const plan=page.querySelector('[data-plan]');if(plan)plan.onclick=()=>save(s=>arrangeNote(s,e.id,uid()),()=>{message='已加入任务。';});
  const reflect=page.querySelector('[data-reflect]');if(reflect)reflect.onclick=()=>{replyId=e.id;render();page.querySelector('#answer').focus();};
  const form=page.querySelector('#reply');
  if(form){
    const answer=form.querySelector('textarea');
    answer.oninput=()=>replies.set(e.id,answer.value);
    form.onsubmit=ev=>{ev.preventDefault();if(!answer.value.trim()){answer.focus();return;}save(s=>replyToNote(s,e.id,questionFor(e.body),answer.value),()=>{replyId='';replies.delete(e.id);message='补充已存入原记录。';});};
    form.querySelector('[data-dismiss]').onclick=()=>{replyId='';render();};
  }
  const done=page.querySelector('[data-done]');if(done)done.onclick=()=>save(s=>{const t=s.tasks.find(t=>t.id===done.dataset.done&&!t.archivedAt);if(t)t.done=true;},()=>{message='这件事完成了。';});
}
window.addEventListener('hashchange',()=>{message='';render();window.scrollTo(0,0);});
window.addEventListener('storage',e=>{if(e.key===storageKey&&!page.contains(document.activeElement))render();});
render();

page.addEventListener('click',event=>{
  const button=event.target.closest('[data-edit]');
  if(!button)return;
  const entry=readState().entries.find(item=>item.id===button.dataset.edit);
  if(!entry)return;
  const dialog=document.querySelector('#edit-note'),field=dialog.querySelector('textarea'),err=dialog.querySelector('[role=alert]');
  field.value=entry.body;err.textContent='';dialog.showModal();field.focus();
  dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
  field.form.onsubmit=ev=>{
    ev.preventDefault();
    try{updateState(s=>changeBody(s,entry.id,entry.body,field.value));dialog.close();render();}
    catch(error){err.textContent=error.message;}
  };
});
