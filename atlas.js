const visionTabs = [
  ['world', '理想世界'], ['philosophy', '人生哲学'], ['principles', '人生原则'],
  ['route', '人生路线'], ['wisdom', '人生智慧'], ['history', '人生历程']
]
const sectionCopy = {
  world: ['愿景画廊', '收藏向往的生活画面，让长期目标有一个具体的方向。'],
  philosophy: ['人生哲学', '写下当下相信的事，也为观点的变化留下空间。'],
  principles: ['人生原则', '在需要做选择时，回到自己愿意遵循的原则。'],
  route: ['人生路线', '沿着愿景、长期目标和阶段目标，找到眼前可以推进的行动。'],
  wisdom: ['人生智慧', '留下经实践发现的方法，并注明经验适用的情境。'],
  history: ['人生历程', '按实际发生日期，保存确认过的经历和重要决定。']
}
const sections = {
  philosophy: {label:'个人信念', kind:'belief', action:'写下思考'},
  principles: {label:'个人原则', kind:'principle', action:'新增原则'},
  wisdom: {label:'实践经验', kind:'knowledge', action:'收藏经验'},
  history: {label:'已确认经历', kind:'experience', action:'记录经历'}
}
const statusLabels = {active:'进行中', paused:'暂停', future:'未来考虑', done:'已完成'}
const looks = {tea:['leaf','茶事','sage'], music:['music','音乐','lilac'], tech:['globe','科技','blue'], content:['book-open','内容','clay'], craft:['layers','设计','gold']}
const projectSections = [
  ['milestones','重要里程碑','flag'], ['references','参考资料','book-open'],
  ['ideas','项目灵感','sparkles'], ['reviews','项目复盘','notebook']
]
const artwork = {valley:'山野', studio:'唱片', library:'书房'}
const sourceLabel = item => item.source === 'demo' ? (item.editedBy === 'user' ? '演示·已编辑' : '演示') : '个人'
export const withOriginal = (data, date) => ({...data, createdAt:date, updatedAt:date, original:JSON.stringify(data), revisions:[]})

export function atlasSeed(date) {
  const visions = [
    {id:'v-valley', title:'在山野之间生活', description:'慢下来探索一座城，也给自然、行走和阅读留一段完整的时间。', art:'valley'},
    {id:'v-studio', title:'一间自己的音乐工作室', description:'让每一段偶然出现的旋律，都有机会变成一首完整的作品。', art:'studio'},
    {id:'v-library', title:'一座不断生长的书房', description:'用文字、工具和创作，把零散的好奇心变成可以反复使用的积累。', art:'library'}
  ].map(x => withOriginal({...x, kind:'vision',source:'demo'}, date))
  const goals = [
    {id:'g-independent',visionId:'v-valley',title:'建立可持续的独立事业'},
    {id:'g-music',visionId:'v-studio',title:'积累自己的原创作品集'},
    {id:'g-knowledge',visionId:'v-library',title:'持续输出有价值的知识与工具'}
  ].map(x=>withOriginal({...x,kind:'goal',source:'demo'},date))
  const rows = [
    ['p-tea','信阳毛尖电商','tea','active','把一杯茶的风味、来处与冲泡方法讲清楚。','完成第一组茶品图文',['g-independent'],'制作一份商品介绍草稿','确认拍摄清单','想试试用同一只白瓷杯拍三个冲泡阶段。'],
    ['p-music','原创音乐工作室','music','active','记录旋律、打磨编配，慢慢积累原创音乐。','完成一段可试听的音乐小样',['g-music'],'写出一段副歌旋律','整理参考曲目','用环境音为开场留一点空间。'],
    ['p-x','X 英文科技手记','tech','active','用短篇英文内容解释有意思的 AI 技术。','整理一组英文观察笔记',['g-knowledge'],'写完第一篇英文草稿','划分内容主题','用真实的小实验来讲解技术概念。'],
    ['p-red','小红书内容运营','content','paused','把可实践的方法整理成容易阅读的图文。','形成可以复用的图文结构',['g-independent','g-knowledge'],'打磨图文封面','建立选题清单','留一页给读者可以马上试做的小练习。'],
    ['p-ai','AI 与虚拟世界探索','tech','future','通过可操作的小实验研究自动化与虚拟空间。','设计一个最小互动场景',['g-knowledge'],'确定第一个实验题目','收集实验材料','从一个房间、一件物品的交互开始。'],
    ['p-vibe','Vibe Coding 产品开发','craft','active','把日常工作中的重复动作变成轻量的小工具。','完成一个可运行的原型',['g-knowledge','g-independent'],'实现核心交互','画出页面结构','先和一位试用者一起走一遍主流程。']
  ]
  const projects = rows.map(([id,title,theme,status,description,stage,goalIds,milestone,doneMilestone,idea]) => {
    const item=(suffix,title,extra={})=>withOriginal({id:id+suffix,title,source:'demo',...extra},date)
    return withOriginal({id,title,theme,status,kind:'project',source:'demo',description,stage,goalIds,
      milestones:[item('-m1',doneMilestone,{done:true}),item('-m2',milestone,{done:false})],
      references:[], ideas:[item('-idea',idea)], reviews:[]},date)
  })
  const notes = [
    ['n-ph','philosophy','给注意力留白','有些答案只会在停下来观察时出现。每周留出一段不安排产出的时间。'],
    ['n-pr','principles','先做一次小规模验证','面对新的创业设想，先用能承担的时间和成本检验最关键的假设。'],
    ['n-ws','wisdom','把复盘写到具体情境里','写下当时做了什么、观察到了什么，以及下一次准备改变哪一个动作。'],
    ['n-hs','history','整理出第一本手作笔记','把散页整理成册，为接下来的观察和创作留下一份起点记录。']
  ].map(([id,section,title,body])=>withOriginal({id,section,title,body,kind:sections[section].kind,date,source:'demo'},date))
  return {visions,goals,projects,atlasNotes:notes}
}

export function revise(item,changes) {
  const date = new Date().toISOString()
  const {revisions,original,...previous} = item
  return {...item,...changes,original:original ?? JSON.stringify(previous),editedBy:'user',updatedAt:date,
    revisions:[...(revisions||[]),{at:date,previous}]}
}
function field(label, control) { return '<label class="at-field"><span>'+label+'</span>'+control+'</label>' }
function submit(label='保存') {return '<div class="at-form-actions"><button type="submit" class="btn primary">'+label+'</button></div>'}
function viewButton(ctx,title,action,icon='plus',style='btn primary') {
  return '<button type="button" class="'+style+'" data-at="'+action+'">'+ctx.icon(icon,17)+'<span>'+title+'</span></button>'
}
function tileArt(art) {
  const images = {valley:'青绿色山野风景', studio:'自然光中的音乐工作室', library:'窗边的私人书房'}
  const key = Object.hasOwn(images, art) ? art : 'valley'
  return '<div class="at-art '+key+'" role="img" aria-label="'+images[key]+'"></div>'
}
function sourceTag(item) {return '<span class="at-source '+(item.source==='demo'?'':'personal')+'">'+sourceLabel(item)+'</span>'}
function empty(ctx,text) {return '<div class="at-empty">'+ctx.icon('leaf',23)+'<span>'+text+'</span></div>'}
function intro(ctx,title,subtitle,extra='') {
  return '<header class="page-head at-head"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div>'+extra+'</header>'
}
function tabs(ctx, items, current, action, navName) {
  return '<nav class="at-tabs" aria-label="'+navName+'">'+items.map(([id,title])=>'<button type="button" class="'+(id===current?'active':'')+'" data-at="'+action+'" data-id="'+ctx.esc(id)+'" aria-pressed="'+(id===current)+'">'+title+'</button>').join('')+'</nav>'
}
function visionCard(ctx, v) {
  const goals=ctx.state.goals.filter(g=>g.visionId===v.id)
  return '<button class="at-vision-card" data-at="open-vision" data-id="'+ctx.esc(v.id)+'">'+tileArt(v.art)+
    '<div class="at-card-in"><div class="at-meta">'+sourceTag(v)+'<span>理想愿景</span></div><h3>'+ctx.esc(v.title)+'</h3><p>'+ctx.esc(v.description)+'</p><div class="at-card-foot">'+ctx.icon('flag',15)+'<span>'+goals.length+' 个长期目标</span></div></div></button>'
}
function noteItem(ctx,n,history) {
  return '<button class="at-note" data-at="open-note" data-id="'+ctx.esc(n.id)+'"><div class="at-meta">'+sourceTag(n)+'<span>'+sections[n.section].label+'</span>'+(history?'<time>'+ctx.esc(n.date)+'</time>':'')+'</div><h3>'+ctx.esc(n.title)+'</h3><p>'+ctx.esc(n.body)+'</p></button>'
}
function road(ctx) {
  const {state,esc}=ctx
  return '<div class="at-road">'+state.visions.map(v=>{
    const goals=state.goals.filter(g=>g.visionId===v.id)
    return '<article class="panel at-road-card"><div class="at-row">'+ctx.icon('compass',24)+'<div><small>理想愿景 · '+sourceLabel(v)+'</small><h3>'+esc(v.title)+'</h3></div></div>'+
    goals.map(g=>{
      const projects=state.projects.filter(p=>p.goalIds?.includes(g.id))
      return '<div class="at-branch"><small>长期目标</small><strong>'+esc(g.title)+'</strong>'+projects.map(p=>{
        const tasks=state.tasks.filter(t=>t.projectId===p.id)
        return '<div class="at-road-project"><button data-at="open-project" data-id="'+esc(p.id)+'">'+esc(p.title)+'</button><span>阶段目标 · '+esc(p.stage||'尚未填写')+'</span>'+
          (tasks.length?'<ul>'+tasks.map(t=>'<li>'+ctx.icon(t.done?'circle-check':'circle',14)+esc(t.title)+' <time>'+esc(t.date||'')+'</time></li>').join('')+'</ul>':'')+'</div>'
      }).join('')+(!projects.length?'<p class="muted">尚未关联项目</p>':'')+'</div>'
    }).join('')+(!goals.length?'<p class="muted">打开愿景，可为它补充长期目标。</p>':'')+'</article>'
  }).join('')+'</div>'
}
function renderVision(ctx) {
  const requested=ctx.params.get('section'), key=visionTabs.some(([id])=>requested===id)?requested:'world'
  const [title,desc]=sectionCopy[key]
  const action=key==='route'?'':key==='world'?viewButton(ctx,'新增愿景','new-vision'):viewButton(ctx,sections[key].action,'new-note')
  let body=''
  if(key==='world') body='<div class="at-gallery">'+ctx.state.visions.map(v=>visionCard(ctx,v)).join('')+'</div>'
  else if(key==='route') body=road(ctx)
  else {
    const subset=ctx.state.atlasNotes.filter(n=>n.section===key).sort((a,b)=>String(b.date).localeCompare(String(a.date)))
    body=subset.length?'<div class="at-notes '+(key==='history'?'timeline':'')+'">'+subset.map(n=>noteItem(ctx,n,key==='history')).join('')+'</div>':empty(ctx,'这里会保存你的'+title+'。')
  }
  return '<div class="atlas">'+intro(ctx,'人生总纲','从理想的生活画面，走向今天能够做的事。')+
   tabs(ctx,visionTabs,key,'vision-tab','人生总纲分类')+'<div class="at-section-head"><div><h2>'+title+'</h2><p>'+desc+'</p></div>'+action+'</div>'+body+'</div>'
}
function projectMetrics(state,p) {
  const tasks=state.tasks.filter(t=>t.projectId===p.id)
  const items=[...(p.milestones||[]),...tasks]
  return {total:items.length,done:items.filter(x=>x.done).length,tasks}
}
function progress(ctx,p) {
  const {total,done}=projectMetrics(ctx.state,p)
  return '<div class="at-progress"><div><span>任务与里程碑</span><span>'+done+' / '+total+'</span></div><progress aria-label="任务与里程碑完成度" value="'+done+'" max="'+(total||1)+'"></progress></div>'
}
function projectCard(ctx,p) {
  const [ico,,color]=looks[p.theme]||looks.craft
  return '<button class="at-project-card" data-at="open-project" data-id="'+ctx.esc(p.id)+'"><div class="at-project-top"><span class="at-icon '+color+'">'+ctx.icon(ico,23)+'</span><span class="at-status '+p.status+'">'+statusLabels[p.status]+'</span></div><h3>'+ctx.esc(p.title)+'</h3><p>'+ctx.esc(p.description||'尚未填写项目目标')+'</p>'+progress(ctx,p)+'<div class="at-card-foot">'+sourceTag(p)+'<span>'+((p.goalIds||[]).length)+' 个关联目标</span></div></button>'
}
function projectList(ctx) {
  const rawFilter=ctx.params.get('status'), selected=Object.hasOwn(statusLabels,rawFilter)?rawFilter:'all'
  const projects=ctx.state.projects.filter(p=>selected==='all'||p.status===selected)
  return '<div class="atlas">'+intro(ctx,'事业与项目','管理正在投入的事业，也给暂停和未来的计划留一个位置。',viewButton(ctx,'新增项目','new-project'))+
    '<a class="lab-atlas-link" href="#startup">'+ctx.icon('lab',17)+' 创业实验室</a>'+tabs(ctx,[['all','全部项目'],...Object.entries(statusLabels)],selected,'project-filter','项目状态')+
    (projects.length?'<div class="at-project-grid">'+projects.map(p=>projectCard(ctx,p)).join('')+'</div>':empty(ctx,'当前状态下还没有项目。'))+'</div>'
}
function safeURL(s) {
  try {const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}
}
function projectInfo(ctx,p) {
  const {esc,state,icon}=ctx, [ico,,color]=looks[p.theme]||looks.craft
  const {tasks}=projectMetrics(state,p)
  const goals=state.goals.filter(g=>p.goalIds?.includes(g.id))
  const linked=goals.map(g=>'<button class="at-goal-link" data-at="route-goal">'+icon('flag',14)+esc(g.title)+'</button>').join('')
  const renderItems=(key,items)=>items.map(i=>{
    if(key==='milestones') return '<li><label class="at-check"><input type="checkbox" data-at="milestone-check" data-id="'+esc(i.id)+'" '+(i.done?'checked':'')+'><span>'+esc(i.title)+'</span></label>'+sourceTag(i)+'</li>'
    return '<li><div class="at-long">'+(safeURL(i.url)?'<a href="'+esc(safeURL(i.url))+'" target="_blank" rel="noopener noreferrer">'+esc(i.title)+'</a>':'<span>'+esc(i.title)+'</span>')+'</div>'+sourceTag(i)+'</li>'
  }).join('')
  return '<div class="atlas"><button data-at="all-projects" class="at-back">'+icon('chevron-left',17)+'全部项目</button>'+
    '<div class="panel at-project-hero"><div class="at-project-header"><span class="at-icon '+color+'">'+icon(ico,28)+'</span><div class="at-meta">'+sourceTag(p)+'<span class="at-status '+p.status+'">'+statusLabels[p.status]+'</span></div></div>'+
    '<div class="at-section-head"><div><h1>'+esc(p.title)+'</h1><p>'+esc(p.description||'尚未填写项目目标')+'</p></div>'+viewButton(ctx,'编辑项目','edit-project','pencil','btn')+'</div>'+
    '<dl class="at-detail-dl"><div><dt>关联长期目标</dt><dd>'+(linked||'尚未关联')+'</dd></div><div><dt>阶段目标</dt><dd>'+esc(p.stage||'尚未填写')+'</dd></div></dl>'+progress(ctx,p)+'</div>'+
    '<section class="panel at-detail-block"><div class="at-block-title"><h2>'+icon('circle-check',20)+'项目任务</h2>'+viewButton(ctx,'新增任务','new-project-task','plus','at-subbtn')+'</div>'+
    (tasks.length?'<ul class="at-detail-list">'+tasks.map(t=>'<li><label class="at-check"><input type="checkbox" data-at="task-check" data-id="'+esc(t.id)+'" '+(t.done?'checked':'')+'><span>'+esc(t.title)+'</span></label><small>'+esc(t.date||'')+'</small></li>').join('')+'</ul>':empty(ctx,'还没有关联的任务'))+'</section>'+
    '<div class="at-details-grid">'+projectSections.map(([key,title,ico])=>'<section class="panel at-detail-block"><div class="at-block-title"><h2>'+icon(ico,20)+title+'</h2><button data-at="add-entry" data-id="'+key+'" aria-label="添加'+title+'" class="at-icon-btn">'+icon('plus',18)+'</button></div>'+
      (p[key]?.length?'<ul class="at-detail-list">'+renderItems(key,p[key])+'</ul>':empty(ctx,'尚未添加'+title))+'</section>').join('')+'</div>'+versionButton(p,ctx)+'</div>'
}
function versionButton(item,ctx) {
  return item.revisions?.length?'<button class="at-back" data-at="versions" data-id="'+ctx.esc(item.id)+'">'+ctx.icon('clock',15)+'原文与修改记录（'+item.revisions.length+'）</button>':''
}
export function renderAtlas(ctx) {
  if(ctx.route==='vision') return renderVision(ctx)
  const id=ctx.params.get('id')
  if(!id)return projectList(ctx)
  const project=ctx.state.projects.find(p=>p.id===id)
  if(!project)return '<div class="atlas">'+empty(ctx,'这个项目当前不可用。')+viewButton(ctx,'返回项目列表','all-projects','layers')+'</div>'
  return projectInfo(ctx,project)
}

function formModal(ctx,title,body,onSave) {
  ctx.modal(title,'<form class="at-form">'+body+submit()+'</form>',dialog=>{
    const form=dialog.querySelector('.at-form')
    form.addEventListener('submit',event=>{
      event.preventDefault()
      for(const input of form.querySelectorAll('input[required],textarea[required]')) {
        input.setCustomValidity(input.value.trim()?'':'请填写内容。')
        if(!input.reportValidity()){input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return}
      }
      onSave(new FormData(form))
    })
  })
}
function fillInput(ctx,name,value,opts={}) {
  return '<input name="'+name+'" type="'+(opts.type||'text')+'" value="'+ctx.esc(value||'')+'" '+(opts.required?'required':'')+' '+(opts.max?'maxlength="'+opts.max+'"':'')+'>'
}
function area(ctx,name,value,rows=3) {
  return '<textarea name="'+name+'" rows="'+rows+'">'+ctx.esc(value||'')+'</textarea>'
}
function get(fd,key) {return String(fd.get(key)||'').trim()}
function finish(ctx, change, message) {
  const result = ctx.save(change)
  if (result === false) return false
  ctx.closeModal()
  ctx.toast(message)
  return true
}
function visionForm(ctx,v) {
  const goals=ctx.state.goals.filter(g=>g.visionId===v?.id)
  const goalsUI=goals.map(g=>'<div class="at-form-goal">'+ctx.icon('flag',15)+ctx.esc(g.title)+'</div>').join('')
  formModal(ctx,v?'编辑愿景':'新增愿景',
    field('愿景名称',fillInput(ctx,'title',v?.title,{required:true,max:100}))+field('理想中的画面',area(ctx,'description',v?.description,4))+
    field('画廊封面','<select name="art">'+Object.entries(artwork).map(([key,label])=>'<option value="'+key+'" '+(v?.art===key?'selected':'')+'>'+label+'</option>').join('')+'</select>')+
    (goalsUI?'<div class="at-field"><span>已关联的长期目标</span>'+goalsUI+'</div>':'')+
    field('补充长期目标（可选，每行一个）',area(ctx,'goals','',2)),fd=>{
      const fields={title:get(fd,'title'),description:String(fd.get('description')||''),art:get(fd,'art')}
      const id=v?.id||ctx.uid()
      const titles=[...new Set(String(fd.get('goals')||'').split('\n').map(s=>s.trim()).filter(Boolean))]
      finish(ctx,state=>{
        const old=state.visions.find(x=>x.id===id)
        if(old)Object.assign(old,revise(old,fields))
        else state.visions.push(withOriginal({id,source:'user',kind:'vision',...fields},ctx.today()))
        for(const title of titles) {
          if(!state.goals.some(g=>g.visionId===id&&g.title===title)) state.goals.push(withOriginal({id:ctx.uid(),source:'user',kind:'goal',visionId:id,title},ctx.today()))
        }
      },'愿景已保存')
    })
}
function showVersion(ctx,item) {
  const parse=raw=>{try{return JSON.parse(raw)}catch{return {body:raw}}}
  function snapshot(snapshot) {
    const text=snapshot.description??snapshot.body??''
    const goals=(snapshot.goalIds||[]).map(id=>ctx.state.goals.find(g=>g.id===id)?.title||id)
    return '<strong>'+ctx.esc(snapshot.title||'无标题')+'</strong><p>'+ctx.esc(text)+'</p>'+
      (snapshot.stage?'<p>阶段目标 · '+ctx.esc(snapshot.stage)+'</p>':'')+
      (snapshot.status?'<p>项目状态 · '+ctx.esc(statusLabels[snapshot.status]||snapshot.status)+'</p>':'')+
      (goals.length?'<p>长期目标 · '+ctx.esc(goals.join('、'))+'</p>':'')+
      (snapshot.art?'<p>封面 · '+ctx.esc(artwork[snapshot.art]||'')+'</p>':'')
  }
  ctx.modal('原文与修改记录','<div class="at-version"><h3>首次保存 · '+ctx.esc(sourceLabel(parse(item.original)))+'</h3>'+snapshot(parse(item.original))+
    item.revisions.slice().reverse().map(r=>'<section><small>'+ctx.esc(new Date(r.at).toLocaleString('zh-CN'))+' 修改前</small>'+snapshot(r.previous)+'</section>').join('')+'</div>')
}
function visionDetail(ctx,v) {
  const goals=ctx.state.goals.filter(g=>g.visionId===v.id)
  ctx.modal('愿景详情','<div class="at-modal-detail">'+tileArt(v.art)+'<div class="at-meta">'+sourceTag(v)+'<span>理想愿景</span></div><h2>'+ctx.esc(v.title)+'</h2><p>'+ctx.esc(v.description||'尚未补充愿景描述')+'</p><h3>关联的长期目标</h3>'+
    (goals.length?'<ul>'+goals.map(g=>'<li>'+ctx.esc(g.title)+'</li>').join('')+'</ul>':'<p>尚未关联长期目标。</p>')+
    versionButton(v,ctx)+'<div class="at-form-actions"><button type="button" class="btn" data-detail-route>查看人生路线</button><button type="button" class="btn primary" data-detail-edit>编辑愿景</button></div></div>',
    d=>{
      d.querySelector('[data-detail-edit]').onclick=()=>{ctx.closeModal();visionForm(ctx,v)}
      d.querySelector('[data-detail-route]').onclick=()=>{ctx.closeModal();ctx.go('vision',{section:'route'})}
      const version=d.querySelector('[data-at="versions"]')
      if(version)version.onclick=()=>{ctx.closeModal();showVersion(ctx,v)}
    })
}
function noteForm(ctx,section,n) {
  const meta=sections[section]
  if(!meta)return
  formModal(ctx,n?'编辑'+meta.label:meta.action,field('标题',fillInput(ctx,'title',n?.title,{required:true,max:100}))+field('原文',area(ctx,'body',n?.body,6))+
    (section==='history'?field('实际发生日期','<input type="date" name="date" value="'+ctx.esc(n?.date||ctx.today())+'" max="'+ctx.esc(ctx.today())+'" required>'):'')+
    '<p class="at-form-hint">归类为'+meta.label+'。原文和后续修改版本保存在本机。</p>',fd=>{
      const fields={title:get(fd,'title'),body:String(fd.get('body')||''),date:get(fd,'date')||n?.date||ctx.today()}
      finish(ctx,state=>{
        if(n) {const old=state.atlasNotes.find(x=>x.id===n.id);if(old)Object.assign(old,revise(old,fields))}
        else state.atlasNotes.push(withOriginal({id:ctx.uid(),kind:meta.kind,section,source:'user',...fields},ctx.today()))
      },'内容已保存')
    })
}
function noteDetail(ctx,n) {
  const meta=sections[n.section]
  ctx.modal(meta.label,'<div class="at-modal-detail"><div class="at-meta">'+sourceTag(n)+'<span>'+ctx.esc(n.date)+'</span></div><h2>'+ctx.esc(n.title)+'</h2><p>'+ctx.esc(n.body)+'</p>'+versionButton(n,ctx)+
  '<div class="at-form-actions"><button class="btn primary" type="button" data-edit-note>编辑内容</button></div></div>',d=>{
    d.querySelector('[data-edit-note]').onclick=()=>{ctx.closeModal();noteForm(ctx,n.section,n)}
    const version=d.querySelector('[data-at="versions"]')
    if(version)version.onclick=()=>{ctx.closeModal();showVersion(ctx,n)}
  })
}
function projectForm(ctx,p) {
  const chosen=new Set(p?.goalIds||[])
  const goals=ctx.state.goals.map(g=>'<label class="at-goal-choice"><input type="checkbox" name="goal" value="'+ctx.esc(g.id)+'" '+(chosen.has(g.id)?'checked':'')+'><span>'+ctx.esc(g.title)+'</span>'+sourceTag(g)+'</label>').join('')
  formModal(ctx,p?'编辑项目':'新增项目',
    field('项目名称',fillInput(ctx,'title',p?.title,{required:true,max:100}))+field('项目目标',area(ctx,'description',p?.description))+
    '<div class="at-form-pair">'+field('项目状态','<select name="status">'+Object.entries(statusLabels).map(([key,title])=>'<option value="'+key+'" '+(p?.status===key?'selected':'')+'>'+title+'</option>').join('')+'</select>')+
    field('项目领域','<select name="theme">'+Object.entries(looks).map(([key,[,title]])=>'<option value="'+key+'" '+(p?.theme===key?'selected':'')+'>'+title+'</option>').join('')+'</select>')+'</div>'+
    field('当前阶段目标',fillInput(ctx,'stage',p?.stage,{max:220}))+
    '<fieldset class="at-goal-choices"><legend>关联长期目标（可多选）</legend>'+goals+'</fieldset>',fd=>{
      const fields={title:get(fd,'title'),description:String(fd.get('description')||''),stage:get(fd,'stage'),status:get(fd,'status'),theme:get(fd,'theme'),goalIds:fd.getAll('goal')}
      const id=p?.id||ctx.uid()
      const saved=finish(ctx,state=>{
        if(p){const old=state.projects.find(x=>x.id===p.id);if(old)Object.assign(old,revise(old,fields))}
        else state.projects.unshift(withOriginal({id,kind:'project',source:'user',...fields,milestones:[],references:[],reviews:[],ideas:[]},ctx.today()))
      },'项目已保存')
      if(!p && saved)ctx.go('projects',{id})
    })
}
function entryForm(ctx,p,key) {
  const section=projectSections.find(([k])=>k===key)
  if(!section)return
  const body=key==='references'||key==='milestones'?field(key==='references'?'资料名称':'里程碑名称',fillInput(ctx,'title','',{required:true,max:200})):field('内容','<textarea name="title" rows="6" required></textarea>')
  formModal(ctx,'添加'+section[1],body+(key==='references'?field('来源网址（可选）','<input type="url" name="url" placeholder="https://" pattern="https?://.+" title="请输入 http 或 https 开头的网址">'):''),fd=>{
    const item={id:ctx.uid(),source:'user',title:String(fd.get('title')||'')}
    if(key==='milestones') item.done=false
    if(key==='references') item.url=safeURL(get(fd,'url'))
    finish(ctx,state=>{const target=state.projects.find(x=>x.id===p.id);if(target)(target[key]??=[]).push(withOriginal(item,ctx.today()))},section[1]+'已保存')
  })
}
function projectTask(ctx,p) {
  if(ctx.openTask) {ctx.openTask(null,{projectId:p.id});return}
  formModal(ctx,'新增项目任务',field('任务名称',fillInput(ctx,'title','',{required:true,max:160}))+field('执行日期',fillInput(ctx,'date',ctx.today(),{required:true,type:'date'}))+
  '<p class="at-form-hint">任务将加入所选日期的次要任务。</p>',fd=>{
    const task=withOriginal({id:ctx.uid(),kind:'task',title:get(fd,'title'),date:get(fd,'date'),projectId:p.id,source:'user',priority:'side',done:false},ctx.today())
    finish(ctx,state=>state.tasks.push(task),'任务已保存')
  })
}
export function bindAtlas(ctx) {
  const root=document.querySelector('.atlas')
  if(!root)return
  root.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-at]')
    if(!trigger||!root.contains(trigger))return
    const action=trigger.dataset.at, id=trigger.dataset.id
    const p=ctx.state.projects.find(pr=>pr.id===ctx.params.get('id'))
    switch(action) {
      case 'vision-tab':ctx.go('vision',{section:id});break
      case 'project-filter':ctx.go('projects',id==='all'?{}:{status:id});break
      case 'open-project':ctx.go('projects',{id});break
      case 'all-projects':ctx.go('projects');break
      case 'new-vision':visionForm(ctx);break
      case 'open-vision':{const v=ctx.state.visions.find(v=>v.id===id);if(v)visionDetail(ctx,v);break}
      case 'new-note':noteForm(ctx,ctx.params.get('section'));break
      case 'open-note':{const n=ctx.state.atlasNotes.find(n=>n.id===id);if(n)noteDetail(ctx,n);break}
      case 'new-project':projectForm(ctx);break
      case 'edit-project':if(p)projectForm(ctx,p);break
      case 'new-project-task':if(p)projectTask(ctx,p);break
      case 'route-goal':ctx.go('vision',{section:'route'});break
      case 'add-entry':if(p)entryForm(ctx,p,id);break
      case 'versions':if(p)showVersion(ctx,p);break
      case 'milestone-check':if(p){const checked=trigger.checked;ctx.save(state=>{const m=state.projects.find(x=>x.id===p.id)?.milestones.find(x=>x.id===id);if(m)m.done=checked})};break
      case 'task-check':{const checked=trigger.checked;ctx.save(state=>{const t=state.tasks.find(t=>t.id===id);if(t)t.done=checked});break}
    }
  })
}
