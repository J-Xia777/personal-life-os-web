// Field definitions are shared by the editor, detail view, filters and export.
const text=(key,label,type='textarea')=>({key,label,type});
const choice=(key,label,values)=>({key,label,type:'select',values});
const amount=(key,label)=>text(key,label,'number');
export const stages=['行业研究','发现问题','用户需求验证','竞争分析','商业模式设计','最小可行产品（MVP）','首批付费客户','产品迭代','盈利模式验证','规模化发展'];
export const natures=['临时想法','个人判断','已验证事实','正式决策'];
export const directions=['人工智能与自动化','AI Agents','虚拟世界与元宇宙','音乐与艺术产业','电子商务','其他'];
export const opportunityStates=['灵感','待研究','待验证','正式立项','暂缓','放弃','已转化为项目'];
const def=(label,icon,statuses,fields,hint)=>({label,icon,statuses,fields,hint});
export const types={
 idea:def('机会','bulb',opportunityStates,[
 text('origin','灵感来源'),text('problem','想解决的问题'),text('audience','目标用户'),text('alternative','现有解决方案'),text('advantage','差异化优势'),text('technology','技术可行性'),text('demand','市场需求'),amount('cost','预估启动成本（元）'),text('potential','盈利潜力'),text('fit','与长期目标的匹配度'),text('belief','当前判断'),text('evidence','支持证据')],'先把问题和人写清楚，再决定是否投入。'),
 validation:def('市场验证','target',['待访谈','已记录','已分析'],[
 choice('signal','证据类型',['用户画像','客户访谈','竞品观察','表达兴趣','购买意愿','实际付费','使用反馈']),text('user','目标用户画像'),text('pain','痛点与使用情境'),text('voice','访谈原话或观察'),text('need','真实需求'),text('rival','竞品与替代方案'),text('willing','购买意愿'),amount('paid','实际付款金额（元）'),text('evidence','证据来源或凭据说明'),text('feedback','反馈'),text('conclusion','验证结论')],'保留用户原话，单独记录有凭据的实际付费。'),
 experiment:def('实验','activity',['构建','衡量','学习','调整','再次实验','已结束'],[
 text('hypothesis','关键假设'),text('method','低成本实验方法'),amount('budget','预算上限（元）'),text('deadline','时间上限 / 截止日','date'),text('criterion','成功标准'),text('process','实际执行过程'),text('result','观察结果'),text('conclusion','结论'),choice('decision','实验决策',['尚未决定','继续','调整','停止']),text('next','下一步行动')],'先写成功标准，实验结束后对照结果决定继续、调整或停止。'),
 research:def('行业研究','globe',['待研究','研究中','已整理'],[
 text('industry','研究领域（可自定义）','direction'),text('phase','行业发展阶段'),text('size','市场规模、单位与年份'),text('evidence','数据来源与口径'),text('chain','产业链结构'),text('tech','核心技术与原理'),text('companies','代表性企业'),text('model','商业模式'),text('pain','行业痛点'),text('trend','趋势与不确定性'),text('opportunity','潜在创业机会'),text('reference','参考资料与链接'),text('thought','个人思考')],'把行业规模和数据来源放在一起，方便日后复核。'),
 canvas:def('商业画布','grid',['草案','验证中','已复核'],[
 ...[['customers','客户细分'],['value','价值主张'],['channels','渠道通路'],['relations','客户关系'],['revenue','收入来源'],['resources','核心资源'],['activities','关键业务'],['partners','重要合作伙伴'],['costs','成本结构']].map(([k,l])=>text(k,l)),
 amount('price','产品定价（元）'),amount('cac','获客成本（元）'),amount('margin','毛利率（%）'),amount('repeat','复购率（%）'),text('breakeven','盈亏平衡点与口径'),text('cash','现金流假设'),text('evidence','指标依据')],'九个画布区块共用一份版本；未填写的指标保留未知。'),
 finance:def('经营月报','wallet',['待核实','已核实'],[
 text('month','统计月份','month'),amount('revenue','营业收入（元）'),amount('fixed','固定成本合计（元）'),amount('variable','可变成本合计（元）'),amount('direct','销售成本（已含于前述成本，元）'),amount('other','其他净扣减（税费等，元）'),amount('inflow','现金流入（元）'),amount('outflow','现金流出（元）'),amount('capital','启动资金（元）'),amount('invested','累计投资额（元）'),amount('returnNet','累计投资净收益（元，可为负）'),amount('limit','项目预算上限（元）'),amount('loss','最大可承受损失（元）'),text('stop','止损条件'),text('evidence','数据来源与统计口径')],'按项目、月份填写人民币汇总。固定与可变成本互斥，销售成本用于计算毛利。'),
 risk:def('项目风险','shield',['待评估','监控中','已关闭'],[choice('severity','影响程度',['待评估','高','中','低']),text('trigger','触发条件'),text('effect','可能损失'),text('action','缓解行动'),text('stop','止损条件')],'写清什么信号出现时需要采取行动。'),
 decision:def('战略决策','compass',['待决定','已决定','已复核'],[
 text('background','决策背景'),text('question','核心问题'),text('options','可选方案'),text('evidence','支持证据'),text('risk','潜在风险'),text('final','最终决策'),text('expected','预期结果'),text('actual','实际结果'),text('review','复盘总结')],'在做决定前写下预期，以后才能检验判断。'),
 review:def('创业复盘','history',['草稿','已复盘'],[
 choice('period','复盘周期',['每日','每周','每月','每季度']),text('value','创造了什么实际价值？'),text('hypothesis','验证了哪些假设？'),text('feedback','真实客户反馈'),text('problem','解决了什么真实问题？'),text('waste','哪些投入没有产生价值？'),text('next','下一阶段最重要的事'),choice('decision','后续判断',['尚未决定','继续','调整','停止'])],'从可核验的反馈与产出回看投入。'),
 learning:def('创业知识','book',['待学习','已学习','已实践'],[
 choice('category','学习分类',['创业课程','创业书籍','商业案例','企业家访谈','行业研究报告','商业方法论','创业失败案例','个人学习笔记']),text('application','实践用途')],'引用知识中心原条目，将学习材料关联到具体实践任务。'),
 contact:def('资源与人脉','link',['待联络','已联系','合作中','暂缓'],[
 choice('category','资源类型',['创业者','行业专家','潜在合作伙伴','导师','投资机构','供应商','行业会议','创业训练营','创业孵化器','高校创新创业平台']),text('origin','资源来源'),text('domain','相关领域'),text('log','交流记录'),text('next','后续行动')],'记录联系背景和下一步，保留交流过程。')
};
export const learningLinks=[
 ['Stanford · How to Start a Startup','课程历史归档','https://startupclass.github.io/'],['MIT OpenCourseWare','课程与研究','https://ocw.mit.edu/'],['Harvard Innovation Labs','创新与决策','https://innovationlabs.harvard.edu/'],['Berkeley SCET','创业与技术','https://scet.berkeley.edu/'],['清华 x-lab','跨学科创新','https://www.x-lab.tsinghua.edu.cn/'],['YC Startup School','MVP 与用户','https://www.startupschool.org/']
];
export const labRecords=s=>s.labRecords||[];
export const workspaceProject=p=>p.startup?.enabled??['p-tea','p-music'].includes(p.id);
export function labProjects(s){return s.projects.filter(workspaceProject);}
export function migrateLab(s){
  if(s.labRecords===undefined)s.labRecords=[];
  if(!Array.isArray(s.labRecords))throw Error('创业实验室数据格式异常。');
  return s;
}
export function validateLab(s){
  migrateLab(s);
  const ids=new Set();
  for(const r of s.labRecords){
    if(!r||typeof r.id!=='string'||ids.has(r.id)||!Object.hasOwn(types,r.kind)||typeof r.title!=='string'||!natures.includes(r.nature)||typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt))||(r.revisions!==undefined&&!Array.isArray(r.revisions))||!r.fields||typeof r.fields!=='object'||Array.isArray(r.fields)||Object.values(r.fields).some(x=>typeof x!=='string')||!types[r.kind].statuses.includes(r.status))throw Error('创业记录格式无效，未恢复。');
    checkEvidence(r.kind,r.status,r.fields);
    ids.add(r.id);
  }
  for(const p of s.projects)if(p.startup&&typeof p.startup.enabled!=='boolean')throw Error('创业项目关联无效。');
  return s;
}
export function checkEvidence(kind,status,fields){
  if(kind==='finance'&&status==='已核实'&&!fields.evidence?.trim())throw Error('已核实的月报需要填写数据来源。');
  if(kind!=='validation')return;
  if(fields.signal==='实际付费'){
    const paid=Number(fields.paid);
    if(!Number.isFinite(paid)||paid<=0||!fields.evidence?.trim())throw Error('实际付费需要正金额和凭据说明。');
  }else if(fields.paid?.trim()){
    throw Error('记录实付金额时，请将证据类型选为实际付费。');
  }
}
export function metrics(f={}){
  const read=k=>f[k]==null||String(f[k]).trim()===''||!Number.isFinite(Number(f[k]))?null:Number(f[k]);
  const calc=(keys,fn)=>{const vs=keys.map(read);return vs.every(Number.isFinite)?Math.round(fn(...vs)*100)/100:null;};
  return {revenue:read('revenue'),cost:calc(['fixed','variable'],(a,b)=>a+b),gross:calc(['revenue','direct'],(a,b)=>a-b),net:calc(['revenue','fixed','variable','other'],(a,b,c,d)=>a-b-c-d),cash:calc(['inflow','outflow'],(a,b)=>a-b),burn:calc(['inflow','outflow'],(a,b)=>Math.max(0,b-a)),roi:read('invested')>0?calc(['returnNet','invested'],(a,b)=>100*a/b):null};
}
export function newProject(id,title,description,date,goalId=''){
  return {id,title,description,stage:'',theme:'craft',kind:'project',status:'active',source:'user',goalIds:goalId?[goalId]:[],milestones:[],references:[],ideas:[],reviews:[],startup:{enabled:true,stage:stages[0]},createdAt:date,updatedAt:date,original:JSON.stringify({title,description}),revisions:[]};
}
export function convertIdea(state,ideaId,projectId,date){
 const idea=labRecords(state).find(r=>r.id===ideaId&&r.kind==='idea');
 if(!idea||idea.status!=='正式立项'||idea.convertedId)throw Error('请先将机会明确设为正式立项，每项机会只能转化一次。');
 state.projects.push(newProject(projectId,idea.title,idea.fields.problem||'',date,idea.goalId));
 idea.revisions??=[];idea.revisions.push({at:date,status:idea.status,projectId:idea.projectId});
 Object.assign(idea,{status:'已转化为项目',nature:'正式决策',convertedId:projectId,projectId,updatedAt:date});
}
// A local, read-only context for a future explicitly invoked AI adapter.
export function researchContext(state,projectId){
 return {version:1,projectId,records:labRecords(state).filter(r=>r.projectId===projectId&&['research','experiment','validation','decision'].includes(r.kind)).map(r=>({id:r.id,kind:r.kind,title:r.title,nature:r.nature,status:r.status,fields:{...r.fields}}))};
}
