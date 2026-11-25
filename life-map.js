import {esc,today,uid,updateState} from './store.js';
import {icon} from './icons.js';
import {reviseLibraryItem} from './library.js';
import {withOriginal,revise} from './atlas.js';
import {writeNote} from './now-model.js';
import {addAction,addStage,mainCount,personal,finishStage} from './daily-model.js';

// The first three levels describe a domain, a direction and a module.
// The text after each module name is an optional starting question.
const domains=[
  ['关系与家庭','heart',[
    ['爱情与亲密关系','伴侣选择|我希望和什么样的人一起生活？','相处与沟通|哪件小事值得两个人坐下来聊聊？','共同生活|我们各自想要怎样的日常？'],
    ['家人','陪伴与照顾|最近想和谁好好相处一会儿？','家庭回忆|我想留住家里的哪一个瞬间？'],
    ['朋友与社交','建立联系|我希望和谁再约一次见面？','边界与互助|哪次相处让我感觉自在？']]],
  ['事业与创作','layers',[
    ['音乐创作','灵感采集|哪个声音值得留下？','作品制作|这首作品下一步需要完成什么？','发布与反馈|听众记住了哪一段？'],
    ['创业与经营','发现问题|谁在什么场景遇到了困难？','低成本验证|用什么小实验能检验这个判断？','经营复盘|哪些投入创造了实际价值？'],
    ['内容与产品','选题与需求|我想为谁解决什么问题？','创作与开发|最小的可用版本是什么？','运营与迭代|使用者给了什么反馈？']]],
  ['兴趣与探索','compass',[
    ['旅行','目的地心愿|为什么想去这个地方？','行前计划|要为这次出发准备什么？','旅途记忆|哪个细节让我还想回到那里？'],
    ['艺术与兴趣','尝试新事物|这周想试哪一件小事？','体验与作品|我想留住这次体验的什么？']]],
  ['学习与技能','book',[
    ['技能习得','选择技能|这项技能会让我能做什么？','练习方法|怎样安排一次能得到反馈的练习？','掌握程度|有什么作品能体现进步？'],
    ['语言学习','表达积累|哪个表达今天真的用到了？','听说练习|我想在哪个场景说得更自如？'],
    ['阅读与研究','研究问题|我正在尝试解释什么？','资料与证据|哪份资料能支持或挑战我的想法？']]],
  ['身心与日常生活','sun',[
    ['身体健康','睡眠与作息|什么时候起床感觉休息得好？','运动与体能|什么运动是我愿意持续做的？','饮食与感受|今天的饮食给我什么感受？'],
    ['情绪与休息','情绪记录|今天哪一刻让我感觉最明显？','恢复精力|什么活动让我重新有精神？'],
    ['居住与日常','生活环境|我希望家里哪个角落更好用？','生活习惯|有什么小改变让日子更顺手？']]],
  ['财富与资源','wallet',[
    ['个人财务','收支与预算|哪些支出符合我真正重视的事？','储蓄目标|我想为怎样的生活留出余地？'],
    ['时间与资源','时间分配|我的时间花在了在意的事情上吗？','可用资源|哪些工具和资源已经足够用？']]]
];
const seed=[];
const key=path=>JSON.stringify(path);
for(const [area,glyph,directions] of domains){
  seed.push({path:[area],glyph});
  for(const [direction,...modules] of directions){
    seed.push({path:[area,direction]});
    for(const module of modules){
      const [title,question]=module.split('|');seed.push({path:[area,direction,title],question});
    }
  }
}
export function tree(s){
  const nodes=new Map(seed.map(n=>[key(n.path),n]));
  for(const path of Array.isArray(s.lifeBranches)?s.lifeBranches:[]){
    if(!Array.isArray(path)||path.length<1||path.length>3||!path.every(x=>typeof x==='string'&&x.trim()))continue;
    if(path.length>1&&!nodes.has(key(path.slice(0,-1))))continue;
    if(!nodes.has(key(path)))nodes.set(key(path),{path});
  }
  return nodes;
}
export function addBranch(s,parent,label){
  const path=[...parent,label.trim()],nodes=tree(s);
  if(!path.at(-1)||path.at(-1).length>60||path.length>3||(parent.length&&!nodes.has(key(parent))))throw Error('请检查分支的名称和位置。');
  if(nodes.has(key(path)))throw Error('这里已经有这个分支。');
  (s.lifeBranches??=[]).push(path);
  return path;
}
const href=path=>'#map'+path.map(x=>'/'+encodeURIComponent(x)).join('');
export function attachEntry(s,id,path){
  const e=s.entries.find(x=>x.id===id);
  if(!e||path.length!==3||!tree(s).has(key(path)))throw Error('记录或模块已变化。');
  const topics=Array.isArray(e.lifeTopics)?e.lifeTopics:[];
  if(!topics.includes(key(path)))Object.assign(e,reviseLibraryItem(e,{lifeTopics:[...topics,key(path)]}));
}
const ideals=s=>s.visions.filter(v=>v.source!=='demo'||v.editedBy==='user');
function saveIdeal(s,form,old){
  const title=String(form.get('vision')||'').trim();
  if(!title)throw Error('请写下你向往的生活。');
  const changes={title,lifeAreas:form.getAll('area')};
  if(old){
    const v=s.visions.find(v=>v.id===old.id);
    if(!v||v.updatedAt!==old.updatedAt)throw Error('愿景已变化，请重新打开。');
    Object.assign(v,revise(v,changes));
  }else{
    s.visions.push(withOriginal({id:uid(),kind:'vision',source:'user',art:'valley',description:'',...changes},today()));
  }
}
const children=(nodes,path)=>[...nodes.values()].filter(node=>node.path.length===path.length+1&&node.path.every((x,i)=>i>=path.length||x===path[i]));
const ancestry=path=>'<div class="map-crumb"><a href="#map">人生地图</a>'+path.slice(0,-1).map((name,i)=>' / <a href="'+esc(href(path.slice(0,i+1)))+'">'+esc(name)+'</a>').join('')+'</div>';
function idealForm(areas,v){
  const boxes=areas.map(({path:[name]})=>'<label><input type="checkbox" name="area" value="'+esc(name)+'" '+(v?.lifeAreas?.includes(name)?'checked':'')+'> '+esc(name)+'</label>').join('');
  return '<form data-ideal="'+esc(v?.id||'')+'"><label>我想过怎样的生活？<textarea name="vision" rows="2" maxlength="250" required>'+esc(v?.title||'')+'</textarea></label><fieldset><legend>与哪些领域有关（可多选）</legend>'+boxes+'</fieldset><button class="ink">保存愿景</button></form>';
}
function nextStep(state,vision){
  const tasks=state.tasks.filter(t=>personal(t)&&t.visionId===vision.id&&!t.done);
  const goals=state.goals.filter(g=>g.visionId===vision.id&&personal(g));
  const stages=vision.stages||[],active=stages.filter(st=>!st.done);
  const id=esc(vision.id);
  return (goals.length?'<p>长期目标 · '+goals.map(g=>esc(g.title)).join('、')+'</p>':'')+
    (stages.length?'<ul class="stage-list">'+stages.map(st=>'<li><form data-stage-check="'+id+'"><input type="hidden" name="stage" value="'+esc(st.id)+'"><button name="done" value="'+(st.done?'no':'yes')+'" aria-pressed="'+!!st.done+'" aria-label="'+(st.done?'重新开启 ':'确认达成 ')+esc(st.title)+'">'+(st.done?'✓':'○')+' '+esc(st.title)+'</button></form><small>'+esc(st.done?'已达成':st.targetDate?'计划 '+st.targetDate+' 达成':'阶段成果')+'</small></li>').join('')+'</ul>':'')+
    '<details><summary>设定阶段成果</summary><form data-stage="'+id+'"><label>怎样才算完成这个阶段？<input name="title" maxlength="160" required placeholder="写下一个能看见的结果"></label><label>希望何时达成（可选）<input type="date" name="target"></label><button class="ink">保存阶段成果</button></form></details>'+
    (tasks.length?'<ul>'+tasks.map(t=>'<li><a href="#day">'+esc(t.date)+' · '+esc(t.title)+'</a></li>').join('')+'</ul>':'')+
    '<details><summary>安排下一步行动</summary><form data-step="'+id+'"><label>具体做什么？<input name="title" maxlength="160" required></label>'+
    (active.length?'<label>推进哪个阶段？<select name="stage"><option value="">直接关联愿景</option>'+active.map((st,i)=>'<option value="'+esc(st.id)+'" '+(i===0?'selected':'')+'>'+esc(st.title)+'</option>').join('')+'</select></label>':'')+
    '<label>哪一天做？<input name="day" type="date" value="'+today()+'" required></label><label>优先级<select name="priority"><option value="main">主线行动</option><option value="side" '+(mainCount(state,today())>=3?'selected':'')+'>其他行动</option></select></label><button class="ink">保存行动</button></form></details>';
}
export function addStep(state,visionId,title,date){
  return addAction(state,{visionId,title,date});
}
function showIdeals(state,nodes){
  const areas=children(nodes,[]),items=ideals(state);
  return ancestry(['人生理想与方向'])+'<h1>人生理想与方向</h1><p class="muted">想象一个你愿意反复度过的普通日子：在哪里，和谁在一起，把时间花在什么事上？</p>'+
    items.map(v=>'<article class="map-ideal"><h2>'+esc(v.title)+'</h2>'+(v.description?'<p>'+esc(v.description)+'</p>':'')+
      '<div class="map-tags">'+(Array.isArray(v.lifeAreas)?v.lifeAreas:[]).map(n=>'<a href="'+esc(href([n]))+'">'+esc(n)+' ↗</a>').join('')+'</div>'+nextStep(state,v)+'<details><summary>编辑方向与关联</summary>'+idealForm(areas,v)+'</details></article>').join('')+
    (items.length?'<details><summary>再写一个愿景</summary>'+idealForm(areas)+'</details>':idealForm(areas))+'<p><a class="map-day" href="#day">查看今日行动 →</a></p><p><a class="soft" href="./#vision?section=route">查看长期目标与人生路线 ↗</a></p>';
}
const toolsByDirection=new Map([['创业与经营',['创业实验室','startup']],['旅行',['旅行与探索','explore']],['音乐创作',['事业项目','projects']],['阅读与研究',['知识中心','knowledge']],['个人财务',['四记汇总','guide']]]);
export function renderMap(page,state,items,row,render){
  const nodes=tree(state);
  let path;
  try{path=location.hash.split('/').slice(1).map(decodeURIComponent);}catch{path=[];}
  const ideal=location.hash==='#ideals';
  if(path.length&&!nodes.has(key(path))){page.innerHTML='<p>这个分支暂时找不到。</p><a href="#map">返回人生地图</a>';return;}
  let html='';
  if(ideal)html=showIdeals(state,nodes);
  else{
    const next=children(nodes,path),visions=ideals(state),name=path.at(-1)||'人生地图';
    const direction=path.length?visions.filter(v=>Array.isArray(v.lifeAreas)&&v.lifeAreas.includes(path[0])):visions;
    html=(path.length?ancestry(path):'')+'<h1>'+esc(name)+'</h1>';
    if(!path.length||direction.length)html+='<a class="north" href="#ideals">'+icon('compass',24)+'<span><b>人生理想与方向</b><small>'+esc(direction[0]?.title||'我想过怎样的生活？')+'</small></span>'+icon('chevron-right',16)+'</a>';
    if(!path.length)html+='<a class="map-day" href="#day">今日行动 '+icon('arrow-right',16)+'</a>';
    if(path.length<3){
      html+='<div class="branches">'+next.map(n=>{
        const sub=children(nodes,n.path).slice(0,3).map(x=>x.path.at(-1)).join(' · ');
        return '<a href="'+esc(href(n.path))+'">'+icon(n.glyph||'layers',19)+'<span><strong>'+esc(n.path.at(-1))+'</strong>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+icon('chevron-right',14)+'</a>';
      }).join('')+'</div>';
      const type=['领域','方向','模块'][path.length];
      html+='<details class="map-add"><summary>添加自己的'+type+'</summary><form data-branch><label>'+type+'名称<input name="label" maxlength="60" required></label><button class="ink">添加'+type+'</button></form></details>';
    }else{
      const attached=items.filter(e=>Array.isArray(e.lifeTopics)&&e.lifeTopics.includes(key(path)));
      const rest=items.filter(e=>!attached.includes(e));
      html+='<form class="map-write" data-entry><label>'+esc(nodes.get(key(path)).question||'关于这件事，你想留下什么？')+'<textarea rows="3" name="body" required placeholder="写下问题、经验或一段回忆…"></textarea></label><button class="ink">记在这里</button></form>';
      html+='<details><summary>为这个领域安排一个行动</summary><form data-area-action><label>具体做什么？<input name="title" maxlength="160" required></label><label>哪一天做？<input name="date" type="date" value="'+today()+'" required></label><label>优先级<select name="priority"><option value="side">其他行动</option><option value="main">主线行动</option></select></label><button class="ink">保存行动</button></form><a class="soft" href="#day">查看今日行动 ↗</a></details>';
      if(rest.length)html+='<details><summary>关联已有记录</summary><form data-attach><label>选择记录<select name="id">'+rest.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.date)+' · '+esc(e.title)+'</option>').join('')+'</select></label><button class="ink">关联到这里</button></form></details>';
      if(attached.length)html+='<section class="single"><h2>这里的记录</h2>'+attached.map(row).join('')+'</section>';
    }
    const tool=toolsByDirection.get(path[1]);if(tool)html+='<p><a class="soft" href="./#'+tool[1]+'">前往'+tool[0]+' ↗</a></p>';
  }
  page.innerHTML='<div class="map-page">'+html+'<p data-map-status role="status"></p></div>';
  page.querySelectorAll('form').forEach(form=>form.onsubmit=event=>{
    event.preventDefault();const fields=new FormData(form);let destination;
    try{
      updateState(s=>{
        if(form.hasAttribute('data-ideal'))saveIdeal(s,fields,ideals(state).find(v=>v.id===form.dataset.ideal));
        if(form.hasAttribute('data-stage'))addStage(s,form.dataset.stage,fields.get('title'),fields.get('target'));
        if(form.hasAttribute('data-stage-check'))finishStage(s,form.dataset.stageCheck,fields.get('stage'),form.querySelector('button').value==='yes');
        if(form.hasAttribute('data-step'))addAction(s,{visionId:form.dataset.step,title:fields.get('title'),date:fields.get('day'),stageId:fields.get('stage')||'',priority:fields.get('priority')});
        if(form.hasAttribute('data-area-action'))addAction(s,{lifeArea:path[0],title:fields.get('title'),date:fields.get('date'),priority:fields.get('priority')});
        if(form.hasAttribute('data-branch'))destination=href(addBranch(s,path,fields.get('label')));
        if(form.hasAttribute('data-attach'))attachEntry(s,fields.get('id'),path);
        if(form.hasAttribute('data-entry')){
          const id=uid();writeNote(s,fields.get('body'),id,today());s.entries[0].lifeTopics=[key(path)];
        }
      });
      if(destination)location.hash=destination;else{render();page.querySelector('[data-map-status]').textContent='已保存';}
    }catch(error){page.querySelector('[data-map-status]').textContent=error.message;}
  });
}
