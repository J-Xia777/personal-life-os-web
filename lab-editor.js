import {types,stages,directions,natures,labProjects,labRecords,workspaceProject,newProject,convertIdea,checkEvidence} from './lab-model.js';
import {esc} from './store.js';
import {openNote} from './library.js';
export const option=(v,label,current)=>'<option value="'+esc(v)+'" '+(v===current?'selected':'')+'>'+esc(label)+'</option>';
const field=(name,html)=>'<label class="field">'+esc(name)+html+'</label>';
const input=(name,val='',type='text',extra='')=>'<input type="'+type+'" name="'+name+'" value="'+esc(val)+'" '+extra+'>';
const select=(name,list,val,blank='')=>'<select name="'+name+'">'+(blank?option('',blank,val):'')+list.map(x=>Array.isArray(x)?option(x[0],x[1],val):option(x,x,val)).join('')+'</select>';
const pairs=xs=>xs.map(x=>[x.id,x.title]);
const requireProject=new Set(['experiment','validation','canvas','finance','risk']);
function form(c,title,body,submit){
 c.modal(title,'<form class="lab-form">'+body+'<p data-err class="form-err" role="alert"></p><div class="actions"><button class="btn" type="button" data-cancel>取消</button><button class="btn primary" type="submit">保存</button></div></form>',d=>{
  const f=d.querySelector('form');d.querySelector('[data-cancel]').onclick=c.closeModal;
  f.onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(f));for(const k in data)data[k]=String(data[k]).trim();try{submit(data);}catch(err){f.querySelector('[data-err]').textContent=err.message;}};
 });
}
function control(f,r){
 const v=r.fields?.[f.key]||'', name='f_'+f.key;
 if(f.type==='select')return select(name,f.values,v);
 if(f.type==='direction')return input(name,v,'text','list="lab-directions"')+'<datalist id="lab-directions">'+directions.map(x=>option(x,x,v)).join('')+'</datalist>';
 if(f.type==='textarea')return '<textarea rows="2" name="'+name+'" maxlength="20000">'+esc(v)+'</textarea>';
 const bounds=f.type==='number'?'step="any" '+(f.key==='returnNet'?'':'min="0"'):'';
 return input(name,v,f.type,bounds);
}
export function editRecord(c,kind,record,projectId=''){
 const d=types[kind],r=record||{},s=c.state;
 if(kind==='learning'&&!s.notes.length){openNote(c);return;}
 const projects=labProjects(s);if(r.projectId&&!projects.some(p=>p.id===r.projectId)){const p=s.projects.find(p=>p.id===r.projectId);if(p)projects.push(p);}
 const statusOptions=kind==='idea'&&!r.convertedId?d.statuses.filter(x=>x!=='已转化为项目'):r.convertedId?['已转化为项目']:d.statuses;
 const primary=field('名称',input('title',r.title,'text','required maxlength="180"'));
 const notes=field('关联知识中心条目',select('noteId',pairs(s.notes),r.noteId,'选择资料'));
 const nature=r.nature||(kind==='idea'?'临时想法':'个人判断');
 const fields=d.fields.map(f=>field(f.label,control(f,r)));
 const mid=kind==='canvas'?9:kind==='experiment'?5:Math.min(4,fields.length);
 const business=field('所属创业项目'+(requireProject.has(kind)?'（必选）':''),select('projectId',pairs(projects),r.projectId||projectId,'未关联'));
 const links=field('实践任务 / 日程',select('taskId',pairs(s.tasks.filter(t=>!t.archivedAt)),r.taskId,'未关联'))+
 field('长期目标',select('goalId',pairs(s.goals),r.goalId,'未关联'))+
 (kind==='learning'?'':notes)+field('人生记录 / 创作灵感',select('entryId',pairs(s.entries),r.entryId,'未关联'))+
 field('成长复盘',select('reviewId',pairs(s.reviews),r.reviewId,'未关联'))+
 field('资源与人脉',select('contactId',pairs(labRecords(s).filter(v=>v.kind==='contact'&&v.id!==r.id)),r.contactId,'未关联'))+
 field('四记参考日期（仅已导入的日汇总）',select('sijiDay',Object.keys(s.sijiSnapshot?.byDay||{}).sort().reverse(),r.sijiDay,'未关联'));
 form(c,(record?'编辑':'新增')+d.label,(kind==='learning'?notes:primary)+business+
 '<div class="form-split">'+field('状态',select('status',statusOptions,r.status||d.statuses[0]))+field('信息性质',select('nature',natures,nature))+'</div>'+
 (kind==='finance'?'<p class="lab-hint">金额均为人民币。空白表示未知，实际为零请填写 0。</p>':'')+
 fields.slice(0,mid).join('')+(fields.length>mid?'<details class="lab-details" '+(record?'open':'')+'><summary>更多'+d.label+'字段</summary>'+fields.slice(mid).join('')+'</details>':'')+
 '<details class="lab-details"><summary>关联目标、行动和资料</summary>'+links+'</details>',data=>{
  const fs=Object.fromEntries(d.fields.map(f=>[f.key,data['f_'+f.key]||'']));
  const need=x=>{throw Error(x);};
  if(requireProject.has(kind)&&!data.projectId)need('请选择所属创业项目。');
  if(kind==='research'&&!fs.industry)need('请填写研究领域，可输入自定义名称。');
  if(kind==='experiment'&&(!fs.hypothesis||!fs.criterion))need('请先填写关键假设和成功标准。');
  if(kind==='finance'&&!fs.month)need('请选择统计月份。');
  checkEvidence(kind,data.status,fs);
  if(data.nature==='已验证事实'&&!fs.evidence&&!data.entryId&&!data.noteId&&!fs.result&&!fs.feedback)need('请补充证据来源、结果，或关联一份佐证资料。');
  if(kind==='decision'&&data.status==='已决定'&&!fs.final)need('请填写最终决策。');
  const title=kind==='learning'?s.notes.find(n=>n.id===data.noteId)?.title:data.title;
  if(!title)need(kind==='learning'?'请选择知识中心条目。':'请填写名称。');
  const rec={kind,source:'user',id:r.id||c.uid(),title,projectId:r.convertedId||data.projectId,status:data.status,nature:kind==='idea'&&['正式立项','已转化为项目'].includes(data.status)?'正式决策':data.nature,fields:fs,updatedAt:new Date().toISOString()};
  for(const key of ['entryId','reviewId','taskId','goalId','contactId','noteId','sijiDay'])rec[key]=data[key]||'';
  if(c.save(state=>{
    const rows=state.labRecords;
    const prev=rows.find(v=>v.id===rec.id);
    if(record&&(!prev||prev.updatedAt!==record.updatedAt))need('这条记录已变更，请重新打开。');
    if(kind==='finance'&&rows.some(x=>x.kind===kind&&x.id!==rec.id&&x.projectId===rec.projectId&&x.fields.month===fs.month))need('该项目本月已有月报，请编辑原月报。');
    if(kind==='canvas'&&rows.some(x=>x.kind===kind&&x.id!==rec.id&&x.projectId===rec.projectId))need('该项目已有商业画布，请在原画布中修改。');
    if(kind==='learning'&&rows.some(x=>x.kind===kind&&x.noteId===rec.noteId&&x.projectId===rec.projectId&&x.taskId===rec.taskId&&x.id!==rec.id))need('这份资料已经关联。');
    if(prev){const {revisions,original,...before}=prev;(prev.revisions??=[]).push(before);Object.assign(prev,rec);}
    else rows.push({...rec,original:JSON.stringify(rec),createdAt:rec.updatedAt,revisions:[]});
   })){c.closeModal();c.toast('已保存到创业实验室');}
 });
}
export function projectEditor(c,p){
 const existing=c.state.projects.filter(x=>!workspaceProject(x));
 const body=(p?'':field('已有项目',select('existing',pairs(existing),'','新建独立项目')))+
 field(p?'项目名称':'新项目名称（关联已有项目可留空）',input('title',p?.title||'','text','maxlength="160"'))+
 field('当前核心目标',input('objective',p?.stage||''))+field('生命周期',select('phase',stages,p?.startup?.stage||stages[0]))+
 field('优先下一步',input('next',p?.startup?.next||''))+
 field('关联长期目标（可多选）','<select name="goals" multiple>'+c.state.goals.map(g=>'<option value="'+c.esc(g.id)+'" '+(p?.goalIds?.includes(g.id)?'selected':'')+'>'+c.esc(g.title)+'</option>').join('')+'</select>');
 form(c,p?'编辑创业项目':'建立创业工作空间',body,data=>{
   const goalIds=Array.from(document.querySelector('dialog [name=goals]').selectedOptions,o=>o.value);
   if(!p&&!data.existing&&!data.title)throw Error('请选择已有项目或输入新项目名称。');
   if(p&&!data.title)throw Error('名称不能为空。');
   const id=p?.id||data.existing||c.uid();
   if(c.save(s=>{
    let target=s.projects.find(x=>x.id===id);
    if(p&&(!target||target.updatedAt!==p.updatedAt))throw Error('项目已被修改，请重新打开后再保存。');
    if(data.existing&&(!target||workspaceProject(target)))throw Error('项目关联已变化，请重新选择。');
    if(!target){target=newProject(id,data.title,'',c.today());s.projects.push(target);}
    else{const {original,revisions,...snapshot}=target;(target.revisions??=[]).push({at:new Date().toISOString(),previous:snapshot});}
    if(!data.existing){target.title=data.title;target.goalIds=goalIds;target.stage=data.objective;}
    else{if(data.objective)target.stage=data.objective;if(goalIds.length)target.goalIds=goalIds;}
    target.editedBy='user';target.startup={...target.startup,enabled:true,stage:data.phase,next:data.next};target.updatedAt=new Date().toISOString();
   })){c.closeModal();c.go('startup',{tab:'projects',p:id});}
 });
}
export function confirmLab(c,title,message,action){
 c.modal(title,'<p class="dialog-note">'+esc(message)+'</p><div class="actions"><button class="btn" data-no>取消</button><button class="btn primary" data-yes>确认</button></div>',d=>{
 d.querySelector('[data-no]').onclick=c.closeModal;d.querySelector('[data-yes]').onclick=()=>{if(action()!==false)c.closeModal();};
 });
}
export function convertAction(c,r){confirmLab(c,'转化为创业项目','将创建一个事业项目并保留这条机会及其证据，目标和名称会随项目关联。',()=>{
 const id=c.uid();if(!c.save(s=>convertIdea(s,r.id,id,new Date().toISOString())))return false;
 c.go('startup',{tab:'projects',p:id});return true;
});}
