import {esc} from './store.js';
import {types,stages,labProjects,labRecords,metrics,learningLinks} from './lab-model.js';
import {editRecord,projectEditor,convertAction,confirmLab,option} from './lab-editor.js';
import {editTask} from './today.js';
import {openNote,openLibraryRecord} from './library.js';

const sections={overview:'创业总览',projects:'项目空间',idea:'机会库',validation:'市场验证',experiment:'验证实验',research:'行业研究',canvas:'商业模式',finance:'创业财务',risk:'风险管理',decision:'战略决策',review:'创业复盘',learning:'创业知识',contact:'资源人脉'};
const act=(name,label,id='',style='btn')=>'<button class="'+style+'" data-lab="'+name+'" data-id="'+esc(id)+'">'+label+'</button>';
const link=(params,label,cls='')=>'<a class="'+cls+'" href="#startup?'+esc(new URLSearchParams(Object.entries(params).filter(([,v])=>v)).toString())+'">'+label+'</a>';
const titleOf=(s,r)=>r.kind==='learning'?(s.notes.find(n=>n.id===r.noteId)?.title||r.title):r.title;
const labelFor=p=>({active:'进行中',done:'已完成',paused:'暂停',future:'未来考虑'})[p.status]||'待确认';
const empty=msg=>'<p class="lab-empty">'+msg+'</p>';
const price=v=>v==null?'待核实':'¥'+v.toLocaleString('zh-CN',{maximumFractionDigits:2});
const heading=(name,extra='')=>'<div class="lab-cardhead"><h2>'+name+'</h2>'+extra+'</div>';
function projectList(c,list){
 return list.length?list.map(p=>link({tab:'projects',p:p.id},'<div class="lab-project-icon">'+c.icon(p.theme==='music'?'music':p.theme==='tea'?'leaf':'layers',20)+'</div><div><strong>'+esc(p.title)+'</strong>'+(p.stage?'<small>'+esc(p.stage)+'</small>':'')+'<small>'+esc(p.startup?.stage||'阶段待设定')+' · '+labelFor(p)+(p.source==='demo'?' · 示例项目':'')+'</small></div>'+c.icon('chevron-right',15),'lab-project-row')).join(''):empty('尚未建立创业项目。');
}
function row(c,r){
 const project=c.state.projects.find(p=>p.id===r.projectId);
 return act('view','<span class="lab-record-icon">'+c.icon(types[r.kind].icon,17)+'</span><span><strong>'+esc(titleOf(c.state,r))+'</strong><small>'+esc(project?.title||'跨项目')+' · '+esc(r.nature)+'</small></span><em>'+esc(r.status)+'</em>',r.id,'lab-record-row');
}
function tasksList(c,tasks){
 return tasks.length?tasks.map(t=>act('task','<time>'+esc(t.date)+(t.time?' '+esc(t.time):'')+'</time> '+esc(t.title)+(t.source==='demo'?' <small>示例</small>':''),t.id,'lab-task')).join(''):empty('暂无已安排的行动。');
}
function panel(title,body,extra=''){return '<section class="panel lab-card">'+heading(title,extra)+body+'</section>';}
function overview(c){
 const s=c.state,ps=labProjects(s),rs=labRecords(s),ids=new Set(ps.map(p=>p.id));
 const month=c.today().slice(0,7),active=ps.filter(p=>p.status==='active');
 const reporting=active.filter(p=>p.source!=='demo'||rs.some(r=>r.kind==='finance'&&r.projectId===p.id));
 const reports=reporting.map(p=>rs.find(r=>r.projectId===p.id&&r.kind==='finance'&&r.fields.month===month&&r.status==='已核实'));
 const exp=rs.filter(r=>r.kind==='experiment'&&r.status!=='已结束'&&r.fields.decision!=='停止'&&ids.has(r.projectId));
 const end=new Date(c.today()+'T12:00:00');end.setDate(end.getDate()+(7-end.getDay())%7);
 const weekEnd=c.today(end),start=new Date(end);start.setDate(start.getDate()-6);
 const activeIds=new Set(active.map(p=>p.id));
 const week=s.tasks.filter(t=>activeIds.has(t.projectId)&&!t.archivedAt&&!t.done&&t.date>=c.today(start)&&t.date<=weekEnd).sort((a,b)=>a.date.localeCompare(b.date)||Number(b.priority==='main')-Number(a.priority==='main')||(a.time||'24:00').localeCompare(b.time||'24:00'));
 const sum=k=>{const vs=reports.map(r=>metrics(r?.fields)[k]);return vs.length&&vs.every(Number.isFinite)?vs.reduce((a,b)=>a+b,0):null;};
 const risks=rs.filter(r=>r.kind==='risk'&&r.status!=='已关闭'&&ids.has(r.projectId));
 const steps=active.filter(p=>p.startup?.next);
 const total=rs.filter(r=>r.kind==='experiment').length;
 const hero='<header class="lab-hero"><div><div class="lab-wordmark">'+c.icon('activity',17)+' STARTUP LAB</div><h1>创业实验室</h1><p>从一个真实问题开始，用小实验决定下一步投入。</p><div class="lab-hero-actions">'+act('new','记录机会','idea','btn')+act('new','设计实验','experiment','btn')+'</div></div><div class="lab-orbit" aria-hidden="true"><i></i><b></b><span></span></div></header>';
 return hero+'<div class="lab-kpis">'+[['进行中项目',active.length,'项目'],['待验证假设',exp.length,'实验'],['本月营业收入',price(sum('revenue')),month],['本月净利润',price(sum('net')),'人民币']].map(([n,v,m])=>'<div><small>'+n+'</small><strong>'+v+'</strong><span>'+m+'</span></div>').join('')+'</div><div class="lab-grid">'+
 panel('创业项目',projectList(c,ps),link({tab:'projects'},'管理','text-btn'))+
 panel('下一步行动',steps.length?steps.map(p=>link({tab:'projects',p:p.id},'<strong>'+esc(p.startup.next)+'</strong><small>'+esc(p.title)+'</small>','lab-next')).join(''):week.length?tasksList(c,week.slice(0,1)):empty('在项目空间填写优先下一步，或安排一个实践任务。'))+
 panel('本周重点行动',tasksList(c,week.slice(0,5)))+
 panel('待验证的假设',exp.length?exp.slice(0,4).map(r=>act('view',esc(r.fields.hypothesis||r.title),r.id,'lab-task')).join(''):empty('尚未登记实验假设。创建实验时，先写下能被检验的成功标准。'),link({tab:'experiment'},'全部实验','text-btn'))+
 panel('实验进展',types.experiment.statuses.map(k=>{const n=rs.filter(r=>r.kind==='experiment'&&r.status===k).length;return '<div class="lab-bar"><span>'+k+'</span><progress max="'+Math.max(total,1)+'" value="'+n+'"></progress><b>'+n+'</b></div>';}).join(''))+
 panel('风险与经营', '<p>本月总成本 <b>'+price(sum('cost'))+'</b></p><small>已核实月报：'+reports.filter(Boolean).length+' / '+reporting.length+' 个纳入统计的进行中项目。示例项目从首次录入月报起计入。</small>'+ (risks.length?risks.slice(0,3).map(r=>row(c,r)).join(''):empty('暂无已登记的开放风险。')),link({tab:'finance'},'查看财务','text-btn'))+
 panel('最近创业进展',rs.length?rs.slice().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,4).map(r=>row(c,r)).join(''):empty('保存机会、验证或实验后，将在这里形成时间线。'))+'</div>';
}
function workspace(c,p){
 const rs=labRecords(c.state).filter(r=>r.projectId===p.id);
 const phase=p.startup?.stage,goals=c.state.goals.filter(g=>p.goalIds?.includes(g.id));
 return '<div class="lab-space"><div class="lab-back">'+link({tab:'projects'},'‹ 全部创业项目')+'</div><div class="page-head"><div><small>'+labelFor(p)+(p.source==='demo'?' · 示例项目':'')+'</small><h1>'+esc(p.title)+'</h1><p>'+esc(p.stage||p.description||'核心目标待设定')+'</p></div>'+act('edit-project','编辑项目',p.id)+'</div>'+
 '<div class="lab-grid">'+panel('生命周期','<p>'+esc(phase||'阶段待设定')+'</p><div class="lab-stages">'+stages.map((stage,i)=>'<span title="'+stage+'" class="'+(phase===stage?'on':'')+'">'+(i+1)+'</span>').join('')+'</div><small>在「编辑项目」中可直接选择任一阶段。</small>')+
 panel('方向与行动','<p>长期目标 · '+esc(goals.map(g=>g.title).join('、')||'尚未关联')+'</p><p>下一步 · '+esc(p.startup?.next||'待设定')+'</p>','<a class="text-btn" href="#projects?id='+encodeURIComponent(p.id)+'">任务、资料与里程碑</a>')+
 panel('项目任务与日程',tasksList(c,c.state.tasks.filter(t=>t.projectId===p.id&&!t.archivedAt)),act('new-task','添加任务',p.id,'text-btn'))+
 panel('项目研究档案','<div class="lab-files">'+Object.entries(types).map(([k,d])=>link({tab:k,p:p.id},c.icon(d.icon,16)+' '+d.label+' <b>'+rs.filter(r=>r.kind===k).length+'</b>')).join('')+'</div>')+'</div>'+act('detach','移出创业工作台',p.id,'text-btn')+'</div>';
}
function practiceMethods(pid){
 const methods=[
  ['斯坦福 · 设计思维','观察用户完成一件事，记录卡住的环节和原话。','validation'],
  ['MIT · 系统化创业','从 24 步框架的市场细分入手，估算一个细分市场，并注明估算依据。','research'],
  ['哈佛 · 案例决策','围绕同一个经营问题列出备选方案，写下取舍和预期。','decision'],
  ['伯克利 · 客户开发','在访谈中了解过去的行为，用真实交易检验购买意愿。','validation'],
  ['清华 x-lab · 跨学科创新','为研究成果寻找产业场景，记录需要联系的合作伙伴。','contact'],
  ['YC · 快速验证','用最小可行产品服务第一批用户，观察使用和付费后再迭代。','experiment']
 ];
 return '<details class="lab-details"><summary>把创业方法用于当前项目</summary>'+methods.map(([name,description,tab])=>link({tab,p:pid},'<strong>'+name+'</strong><small>'+description+'</small>','lab-next')).join('')+'</details>';
}
function collection(c,k,pid){
 const projects=labProjects(c.state),d=types[k],isProjects=k==='projects';
 const p=projects.find(x=>x.id===pid);if(isProjects&&p)return workspace(c,p);
 const states=isProjects?['进行中','暂停','未来考虑','已完成']:d.statuses;
 let list=isProjects?projects:labRecords(c.state).filter(r=>r.kind===k&&(!pid||r.projectId===pid));
 const searchUI='<div class="lab-filter"><label>搜索<input type="search" data-search placeholder="名称、内容或关联项目"></label><label>状态<select data-filter><option value="">全部状态</option>'+states.map(v=>option(v,v,'')).join('')+'</select></label>'+(!isProjects?'<label>所属项目<select data-project>'+option('','全部项目',pid)+projects.map(p=>option(p.id,p.title,pid)).join('')+'</select></label>':'')+'</div>';
 const itemRow=r=>{const key=isProjects?r.title+' '+r.stage+' '+(r.startup?.stage||''):[titleOf(c.state,r),r.nature,Object.values(r.fields).join(' '),projects.find(p=>p.id===r.projectId)?.title].join(' ');
 return '<div data-lab-item data-query="'+esc(key.toLowerCase())+'" data-status="'+esc(isProjects?labelFor(r):r.status)+'">'+(isProjects?projectList(c,[r]):row(c,r))+'</div>';};
 const board=['idea','experiment','validation'].includes(k), isBoard=board&&c.params.get('view')==='board';
 const panelBody=isBoard?'<div class="lab-board">'+states.map(v=>'<section><h3>'+esc(v)+'</h3>'+list.filter(r=>r.status===v).map(itemRow).join('')+'</section>').join('')+'</div>':list.map(itemRow).join('');
 const title=isProjects?'创业项目空间':sections[k];
 const extra=k==='learning'?act('new-note','新建知识笔记'):'';
 const label=isProjects?'建立项目':k==='learning'?'关联知识':'新增'+d.label;
 return '<div class="page-head"><div><h1>'+title+'</h1><p>'+esc(isProjects?'项目、长期目标和每日任务共享同一份数据。':d.hint)+'</p></div><div class="lab-controls">'+extra+act(isProjects?'add-project':'new',label,k,'btn primary')+'</div></div>'+searchUI+
 '<section class="panel lab-card">'+heading(isProjects?'工作空间':title+'记录',(board?link({tab:k,p:pid,view:isBoard?'list':'board'},isBoard?'切换列表':'切换看板','text-btn'):'')+'<span data-count>'+list.length+' 条</span>')+panelBody+'<p data-empty class="lab-empty" '+(list.length?'hidden':'')+'>没有符合条件的条目。</p></section>'+
 (k==='research'?panel('初始研究领域','<div class="lab-fields-info">人工智能与自动化 · AI Agents · 虚拟世界与元宇宙 · 音乐与艺术产业 · 电子商务 · 自定义领域</div>'):'')+
 (k==='learning'?panel('课程与学习入口','<div class="lab-files">'+learningLinks.map(([n,v,url])=>'<a href="'+url+'" target="_blank" rel="noopener noreferrer"><span>'+n+'<small>'+v+'</small></span>'+c.icon('external-link',14)+'</a>').join('')+'</div>'+practiceMethods(pid)):'');
}
export function renderStartup(c){
 const raw=c.params.get('tab'),k=Object.hasOwn(sections,raw)?raw:'overview',p=c.params.get('p')||'';
 const nav='<nav class="lab-nav" aria-label="创业实验室导航">'+Object.keys(sections).slice(0,5).map(id=>link({tab:id},sections[id],k===id?'active':'')).join('')+'<label><span class="lab-sr">其他创业工具</span><select data-lab-jump>'+option('','研究与工具',k)+Object.entries(sections).slice(5).map(([id,n])=>option(id,n,k)).join('')+'</select></label></nav>';
 return '<div class="lab">'+nav+(k==='overview'?overview(c):collection(c,k,p))+'</div>';
}
function recordDetail(c,r){
 const d=types[r.kind],s=c.state;
 const values=d.fields.map(f=>'<div><dt>'+esc(f.label)+'</dt><dd>'+esc(r.fields[f.key]||(f.type==='number'?'待核实':'待补充'))+'</dd></div>').join('');
 const linked=[['projectId','项目',s.projects],['goalId','长期目标',s.goals],['taskId','任务',s.tasks],['noteId','知识',s.notes],['entryId','记录',s.entries],['reviewId','成长复盘',s.reviews],['contactId','人脉',labRecords(s)]].filter(([k])=>r[k]).map(([k,n,arr])=>{
 const target=arr.find(x=>x.id===r[k]);return target?act('ref',esc(n+' · '+target.title),k,'btn'):'<small>'+n+' · 原记录已移除</small>';}).join('');
 const fin=r.kind==='finance'?metrics(r.fields):null;
 const derived=fin?'<div class="lab-fin">'+[['总成本','cost'],['毛利润','gross'],['净利润','net'],['经营现金净流量','cash'],['月净消耗','burn'],['投资回报率','roi']].map(([n,k])=>'<div><small>'+n+'</small><b>'+(k==='roi'?(fin[k]==null?'待核实':fin[k]+'%'):price(fin[k]))+'</b></div>').join('')+'</div>':'';
 c.modal(titleOf(s,r),'<div class="lab"><div class="lab-controls"><span class="pill">'+esc(r.nature)+'</span><span class="pill">'+esc(r.status)+'</span></div>'+derived+
 '<dl class="lab-spec '+(r.kind==='canvas'?'lab-canvas':'')+'">'+values+'</dl><div class="lab-controls">'+linked+'</div>'+
 (r.sijiDay?'<p>四记参考日期：'+esc(r.sijiDay)+' · <a href="#guide?day='+encodeURIComponent(r.sijiDay)+'">查看导入汇总</a></p>':'')+
 '<div class="actions">'+act('remove','删除',r.id,'btn danger')+(r.kind==='idea'&&r.status==='正式立项'&&!r.convertedId?act('convert','转化为项目',r.id):'')+act('edit','编辑',r.id,'btn primary')+'</div></div>',dialog=>{
 dialog.querySelectorAll('[data-lab]').forEach(b=>b.onclick=()=>{
 if(b.dataset.lab==='edit')editRecord(c,r.kind,r);
 if(b.dataset.lab==='convert')convertAction(c,r);
 if(b.dataset.lab==='remove')confirmLab(c,'删除'+d.label+'？','移除「'+titleOf(s,r)+'」。相关项目、任务和原始知识仍保留。',()=>c.save(state=>{const found=state.labRecords.find(x=>x.id===r.id);if(found?.updatedAt!==r.updatedAt)throw Error('记录已变化，请重新打开。');state.labRecords=state.labRecords.filter(x=>x.id!==r.id);for(const o of state.labRecords)if(o.contactId===r.id)o.contactId='';}));
 if(b.dataset.lab==='ref'){const k=b.dataset.id;c.closeModal();if(k==='projectId')c.go('projects',{id:r[k]});if(k==='goalId')c.go('vision',{section:'route'});if(k==='taskId')editTask(c,r[k]);if(k==='contactId')recordDetail(c,labRecords(s).find(x=>x.id===r[k]));const kind={noteId:'note',entryId:'entry',reviewId:'review'}[k];if(kind)openLibraryRecord(c,kind,r[k]);}
 });
 });
}
export function bindStartup(c){
 const root=document.querySelector('#main .lab'),pid=c.params.get('p')||'';
 root.querySelector('[data-lab-jump]').onchange=e=>{if(e.target.value)c.go('startup',{tab:e.target.value});};
 root.querySelectorAll('[data-lab]').forEach(b=>b.onclick=()=>{
 const {lab:op,id}=b.dataset, p=c.state.projects.find(x=>x.id===id);
 if(op==='new')editRecord(c,id,null,pid);
 if(op==='view')recordDetail(c,labRecords(c.state).find(x=>x.id===id));
 if(op==='new-note')openNote(c);
 if(op==='add-project'||op==='edit-project')projectEditor(c,p);
 if(op==='new-task')editTask(c,'',id);
 if(op==='task')editTask(c,id);
 if(op==='detach')confirmLab(c,'移出创业工作台？','保留原事业项目、任务及档案，可随时重新关联。',()=>{if(!c.save(s=>{const pr=s.projects.find(x=>x.id===id);pr.startup={...pr.startup,enabled:false};}))return false;c.go('startup',{tab:'projects'});return true;});
 });
 const search=root.querySelector('[data-search]'),filter=root.querySelector('[data-filter]'),ps=root.querySelector('[data-project]');
 if(ps)ps.onchange=()=>c.go('startup',{tab:c.params.get('tab'),p:ps.value});
 if(search){const update=()=>{let n=0;for(const row of root.querySelectorAll('[data-lab-item]')){row.hidden=!(row.dataset.query.includes(search.value.trim().toLowerCase())&&(!filter.value||row.dataset.status===filter.value));if(!row.hidden)n++;}root.querySelector('[data-count]').textContent=n+' 条';root.querySelector('[data-empty]').hidden=!!n;};search.oninput=update;filter.onchange=update;}
}
