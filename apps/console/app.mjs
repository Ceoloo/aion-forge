import { fixtureSnapshot, fixtureTenant } from './fixtures.mjs';
import { projectSnapshot, sessionCounts, searchSessions, SESSION_STATES, LOCATIONS, VIEWS, ACTION_AVAILABILITY } from './model.mjs';

const data=projectSnapshot(fixtureSnapshot,fixtureTenant);
const state={view:'overview',workspace:'all',status:'all',query:'',session:data.sessions[0]?.id??null,tab:'activity',palette:false};
const $=id=>document.getElementById(id);
const byId=id=>data.sessions.find(s=>s.id===id)??null;
const workspace=id=>data.workspaces.find(w=>w.id===id)??null;
const headings={
  overview:['Software Factory','One workspace to monitor coding agents, reviews and execution gates.'],
  workspaces:['Workspaces','Projects, branches and environments in one governed navigation surface.'],
  sessions:['Agent Sessions','See which agents are working, blocked, queued or awaiting review.'],
  approvals:['Approval Inbox','Separate human authorization from agent execution. No approvals available in preview.'],
  evidence:['Audit Evidence','Inspect attributable, sanitized events without exposing prompts or tokens.'],
  settings:['Integration Gates','Connection and security requirements before activation.'],
};
const nav=[['overview','◫','Overview'],['workspaces','▦','Workspaces'],['sessions','◉','Sessions'],['approvals','◇','Approvals'],['evidence','≡','Evidence'],['settings','⚙','Settings']];

function element(tag,cls='',text='',attrs={}){
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(text!==undefined && text!==null)n.textContent=String(text);
  for(const [key,val] of Object.entries(attrs))n.setAttribute(key,String(val));
  return n;
}
function append(parent,...nodes){for(const n of nodes)if(n)parent.append(n);return parent;}
function button(text,cls,action,value,{disabled=false,ariaLabel}={}){
  const b=element('button',cls,text,{type:'button','data-action':action,'data-value':value??''});
  b.disabled=disabled;
  if(ariaLabel)b.setAttribute('aria-label',ariaLabel);
  return b;
}
function textSpan(text,cls=''){return element('span',cls,text)}
function countIcon(label,number,variant){
  const card=element('article','metric');
  const top=append(element('div','metric-top'),textSpan(label),element('span','metric-symbol',variant));
  const lower=append(element('div','metric-bottom'),element('strong','',String(number)),textSpan('Synthetic snapshot','metric-foot'));
  return append(card,top,lower);
}
function stateChip(status){
  const meta=SESSION_STATES[status]??SESSION_STATES.unknown;
  return element('span','state-chip tone-'+meta.tone,meta.label);
}
function sectionHeader(title,sub='',badge=''){
  const wrap=element('div','section-head');
  const left=element('div');
  append(left,element('h2','',title),sub?element('p','',sub):null);
  return append(wrap,left,badge?element('span','section-meta',badge):null);
}
function emptyState(label,detail){
  return append(element('div','empty-state'),element('div','empty-icon','⌁'),
    element('strong','',label),element('p','',detail));
}
function sessionRow(s){
  const w=workspace(s.workspaceId);
  const active=state.session===s.id;
  const row=button('','session-row'+(active?' selected':''),'session',s.id,{
    ariaLabel:'Inspect '+s.title+(active?', selected':'')});
  const mark=element('span','agent-icon','');
  mark.textContent=({Codex:'C','Claude Code':'✳',Pi:'π',OpenCode:'O'})[s.harness]??'A';
  const info=element('span','session-info');
  append(info,element('strong','',s.title),append(element('span','session-sub'),
    textSpan(s.harness,'agent-name'),textSpan('·'),textSpan(w?.repo??'Unknown repo'),
    textSpan('·'),textSpan(LOCATIONS[s.location])));
  const tail=append(element('span','session-tail'),stateChip(s.state),textSpan('›','chevron'));
  return append(row,mark,info,tail);
}
function summary(){
  const counts=sessionCounts(data.sessions);
  const metrics=append(element('div','metrics'),
    countIcon('Modeled sessions',counts.total,'▦'),
    countIcon('Example working',counts.working,'↗'),
    countIcon('Need attention',counts.attention,'◇'),
    countIcon('Queued',counts.queued,'☷'));
  const left=element('section','surface session-surface');
  const items=append(element('div','session-list'),...searchSessions(data.sessions,data.workspaces,'','all').slice(0,6).map(sessionRow));
  append(left,sectionHeader('Agent activity','Status-aware sessions across workspaces','EXAMPLE STATES'),items,
    button('View all sessions   →','text-link','navigate','sessions'));
  const right=element('section','surface review-surface');
  append(right,sectionHeader('Approval queue','Independent human review before execution'));
  const pending=data.sessions.filter(s=>s.state==='approval_required');
  for(const s of pending){
    const card=element('div','approval-card');
    append(card,append(element('div','approval-kicker'),textSpan('R3 AUTHORIZATION','amber-label'),stateChip(s.state)),
      element('strong','',s.title),element('p','',s.summary),
      button('Inspect request →','outline-btn small-btn','session',s.id));
    right.append(card);
  }
  append(right,append(element('div','gate-note'),
    element('strong','','No live approvals'),
    element('p','','This inbox is for review visibility. Approve/deny actions require a verified Runtime operator and durable decision evidence.')));
  const wrap=element('div','overview-stack');
  append(wrap,metrics,append(element('div','content-columns'),left,right));
  const footer=element('section','system-rail');
  append(footer,element('div','rail-mark','◇'),append(element('div','rail-copy'),
    element('strong','','Trust boundary before autonomy'),
    element('span','','Sentinel identity → Runtime policy → Data evidence → isolated worker')),
    button('Inspect gates  →','rail-action','navigate','settings'));
  return append(wrap,footer);
}
function workspacePage(){
  const list=element('div','workspace-grid');
  for(const w of data.workspaces){
    const num=data.sessions.filter(s=>s.workspaceId===w.id).length;
    const card=button('','workspace-card','workspace',w.id,{ariaLabel:'Show sessions for '+w.name});
    append(card,append(element('div','work-card-top'),element('span','work-logo',w.name.slice(0,1)),
      element('span','location-chip',LOCATIONS[w.location])),
      element('h2','',w.name),element('p','work-repo',w.repo),
      append(element('div','work-branch'),textSpan('⑂  '),textSpan(w.branch)),
      append(element('div','work-bottom'),textSpan(w.environment),
        textSpan(num+' modeled session'+(num===1?'':'s'))));
    list.append(card);
  }
  return append(element('div',''),list);
}
function sessionsPage({onlyAttention=false}={}){
  const wrap=element('div','surface wide-surface');
  const tabs=append(element('div','filter-tabs'),
    ...[['all','All'],['working','Working'],['approval_required','Approval'],['blocked','Blocked'],
      ['queued','Queued'],['review','Review']].map(([value,label])=>{
       const b=button(label,'filter-btn'+(state.status===value?' active':''),'status',value);
       b.setAttribute('aria-pressed',state.status===value?'true':'false');
       return b;
      }));
  const input=element('input','session-search','',{type:'search',id:'session-search',placeholder:'Filter by title, agent, repo…','aria-label':'Filter sessions'});
  input.value=state.query;
  const top=append(element('div','session-filterbar'),tabs,input);
  const list=element('div','session-list');
  let filtered=searchSessions(data.sessions,data.workspaces,state.query,state.workspace,state.status);
  if(onlyAttention)filtered=filtered.filter(s=>s.state==='approval_required'||s.state==='blocked');
  append(list,...filtered.map(sessionRow));
  if(!filtered.length)list.append(emptyState('No matching sessions','Try another workspace or search term.'));
  append(wrap,sectionHeader('Session registry','A record of modeled harness states, never a command shell',filtered.length+' RESULTS'),top,list);
  return wrap;
}
function approvalsPage(){
  const box=element('section','surface wide-surface');
  const sessions=data.sessions.filter(s=>s.state==='approval_required'||s.state==='blocked');
  append(box,sectionHeader('Human attention','Inspect the request and its evidence; granting approval is not wired.',sessions.length+' EXAMPLE ITEMS'));
  const list=element('div','review-list');
  for(const s of sessions){
    const row=append(element('div','review-row'),element('span','review-symbol',s.state==='blocked'?'!':'◇'),
      append(element('div','review-details'),element('strong','',s.title),
        element('span','',s.summary)),
      stateChip(s.state),button('Inspect','outline-btn small-btn','session',s.id));
    list.append(row);
  }
  return append(box,list,append(element('div','disabled-note'),textSpan('Approval actions disabled'),textSpan('No signed-in operator, canonical role or Runtime connection.')));
}
function evidencePage(){
  const wrap=element('section','surface wide-surface');
  append(wrap,sectionHeader('Evidence timeline','Allowlisted event descriptions only; no prompts, commands or credentials',data.events.length+' SAMPLE RECORDS'));
  const list=element('div','event-timeline');
  for(const e of [...data.events].sort((a,b)=>(b.time??'').localeCompare(a.time??''))){
    const row=element('div','event-row');
    const dot=element('span','timeline-dot'+(e.level==='warning'?' warning':''));
    const info=append(element('div','event-description'),
      element('strong','',e.title),element('p','',e.detail),
      textSpan((byId(e.sessionId)?.title??'Unknown session')+' · '+timeLabel(e.time),'event-time'));
    append(row,dot,info,button('Inspect →','text-link','session',e.sessionId));
    list.append(row);
  }
  return append(wrap,list);
}
function settingsPage(){
  const box=element('section','surface wide-surface');
  const gates=[
    ['Identity plane','Sentinel / verified Keycloak + durable Principal mapping','Not connected'],
    ['Execution authority','Runtime Core policy + R3 approval','Not connected'],
    ['Audit persistence','AION Data append-only Forge audit events','Not connected'],
    ['Isolated workers','Unprivileged per-workspace environment','Not built'],
    ['Terminal engine','Pinned Herdr-core behind a private worker socket','Disabled'],
    ['Session transfer','Verified checkpoint + explicit human gate','Planned']
  ];
  append(box,sectionHeader('Connection & readiness','Configuration overview, not an editable security panel','FAIL-CLOSED'));
  const list=element('div','settings-gates');
  for(const [label,detail,status] of gates){
    const row=append(element('div','settings-row'),element('span','lock-icon','◇'),
      append(element('div','settings-copy'),element('strong','',label),element('p','',detail)),
      element('span','status-disconnected',status.toUpperCase()));
    list.append(row);
  }
  return append(box,list);
}
function timeLabel(t){
  if(!t)return 'Time unknown';
  const d=new Date(t);
  return Number.isNaN(d.getTime())?'Time unknown':new Intl.DateTimeFormat(undefined,
    {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(d);
}
function inspector(){
  const host=$('inspector-content');host.replaceChildren();
  const s=byId(state.session);
  if(!s){host.append(emptyState('Select a session','Open a session to see its identity, branch and read-only evidence.'));return;}
  const w=workspace(s.workspaceId);
  const top=element('div','inspector-primary');
  append(top,append(element('div','inspector-status'),stateChip(s.state),
    textSpan('SAMPLE RECORD','sample-pill')),element('h2','',s.title),element('p','',s.summary));
  const tabs=append(element('div','inspector-tabs'),
    ...[['activity','Activity'],['changes','Changes'],['preview','Preview']].map(([value,label])=>{
      const b=button(label,'inspector-tab'+(state.tab===value?' active':''),'tab',value);
      b.setAttribute('aria-pressed',state.tab===value?'true':'false');return b;
    }));
  host.append(top,tabs);
  const panel=element('div','inspector-panel');
  if(state.tab==='activity'){
    const grid=element('dl','detail-grid');
    for(const [label,value] of [
      ['Harness',s.harness],['Location',LOCATIONS[s.location]],['Repository',w?.repo??'Unknown'],
      ['Branch',s.branch],['Request',s.requestId??'Unavailable'],['Run',s.runId??'Unavailable'],
      ['Execution',s.executionId??'Unavailable'],['Approval',s.approvalId??'Not requested'],
      ['Last activity',timeLabel(s.updatedAt)]
    ]){append(grid,element('dt','',label),element('dd','',value));}
    panel.append(grid);
    const itemList=element('div','inspector-events');
    const events=data.events.filter(e=>e.sessionId===s.id);
    if(!events.length)itemList.append(element('p','no-events','No sample evidence recorded.'));
    for(const e of events)append(itemList,append(element('div','mini-event'),
      element('span','mini-dot','•'),append(element('div',''),element('strong','',e.title),
      element('p','',e.detail))));
    append(panel,sectionHeader('Evidence','Example records only'),itemList);
  }else if(state.tab==='changes'){
    append(panel,element('div','panel-icon','⑂'),element('h3','','Review packet'),
      element('p','','This tab will summarize changed files, checks and proposed pull requests. Raw source or Git access is not available in design preview.'),
      append(element('div','panel-number'),element('strong','',s.changedFiles??'—'),textSpan('modeled changed files')));
  }else{
    append(panel,element('div','panel-icon','▣'),element('h3','','Preview not connected'),
      element('p','','Previews will be authorized, short-lived, and isolated from production services. No tunnels or localhost ports are exposed by this demo.'),
      element('span','state-chip tone-neutral','NOT AVAILABLE'));
  }
  host.append(panel);
  const actions=append(element('div','inspector-actions'),
    button('Request launch  ◇','disabled-action','launch',s.id,{disabled:true}),
    button('Transfer session','secondary-action','transfer',s.id,{disabled:true}));
  host.append(actions);
}
function renderNav(){
  const navEl=$('main-nav');navEl.replaceChildren();
  const counts=sessionCounts(data.sessions);
  for(const [view,icon,label] of nav){
    const b=button('','nav-btn'+(state.view===view?' active':''),'navigate',view);
    const number=view==='approvals'?counts.attention:view==='sessions'?counts.total:null;
    append(b,textSpan(icon,'nav-icon'),textSpan(label,'nav-label'),
      number===null?null:textSpan(number,'nav-count'));
    if(state.view===view)b.setAttribute('aria-current','page');
    navEl.append(b);
  }
  const ws=$('workspace-nav');ws.replaceChildren();
  for(const w of data.workspaces){
    const b=button('','project-item'+(state.workspace===w.id?' active':''),'workspace',w.id);
    append(b,textSpan(w.name.slice(0,1).toUpperCase(),'project-letter'),
      append(element('span','project-name'),element('strong','',w.name),
      element('small','',w.repo)));
    ws.append(b);
  }
  $('workspace-count').textContent=String(data.workspaces.length);
}
function render(){
  const [title,description]=headings[state.view];
  $('page-title').textContent=title;
  $('page-subtitle').textContent=description;
  $('crumb-current').textContent=state.view.charAt(0).toUpperCase()+state.view.slice(1);
  renderNav();inspector();
  const host=$('page-content');host.replaceChildren();
  const content=state.view==='overview'?summary():
    state.view==='workspaces'?workspacePage():
    state.view==='sessions'?sessionsPage():
    state.view==='approvals'?approvalsPage():
    state.view==='evidence'?evidencePage():settingsPage();
  host.append(content);
}
function announce(t){$('announcement').textContent=t;}
function navigate(view){
  if(!VIEWS.includes(view))return;
  state.view=view;
  if(view==='sessions')state.workspace='all';
  render();closeSidebar();announce('Showing '+headings[view][0]);
}
function selectSession(id){
  if(!byId(id))return;
  state.session=id;state.tab='activity';
  render();$('inspector').classList.add('open');closePalette();
  announce('Inspecting '+byId(id).title);
}
function chooseWorkspace(id){
  if(!workspace(id))return;
  state.workspace=id;state.view='sessions';state.status='all';state.query='';
  render();closeSidebar();announce('Filtered to '+workspace(id).name);
}
function openPalette(){
  state.palette=true;$('command-palette').hidden=false;
  $('palette-input').value='';updatePalette();
  $('palette-input').focus();
}
function closePalette(){
  if(!state.palette)return;
  state.palette=false;$('command-palette').hidden=true;$('command-trigger').focus();
}
function updatePalette(){
  const query=$('palette-input').value.toLocaleLowerCase().trim();
  const results=$('palette-results');results.replaceChildren();
  const views=nav.filter(([id,,label])=>!query||label.toLowerCase().includes(query));
  const sessions=data.sessions.filter(s=>[s.title,s.harness,workspace(s.workspaceId)?.repo??'']
    .some(v=>v.toLowerCase().includes(query))).slice(0,8);
  if(views.length){
    results.append(element('div','palette-category','VIEWS'));
    for(const [v,,label] of views)results.append(button(label+'   ↗','palette-result','navigate',v));
  }
  if(sessions.length){
    results.append(element('div','palette-category','SESSIONS'));
    for(const s of sessions)results.append(button(s.title+'   ·   '+s.harness,'palette-result','session',s.id));
  }
  if(!views.length&&!sessions.length)results.append(emptyState('Nothing found','Try a different term.'));
}
function closeSidebar(){
  $('sidebar').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');
}

document.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');
  if(!target||target.disabled)return;
  const action=target.dataset.action,value=target.dataset.value;
  if(action==='navigate'){navigate(value);closePalette();}
  else if(action==='workspace'){chooseWorkspace(value);closePalette();}
  else if(action==='session')selectSession(value);
  else if(action==='tab'&&['activity','changes','preview'].includes(value)){state.tab=value;inspector();}
  else if(action==='status'&&(value==='all'||SESSION_STATES[value])){
    state.status=value;render();announce('Status filter: '+value);
  }
});
$('command-trigger').addEventListener('click',openPalette);
$('review-gates').addEventListener('click',()=>navigate('settings'));
$('palette-input').addEventListener('input',updatePalette);
$('command-palette').addEventListener('click',e=>{if(e.target===$('command-palette'))closePalette();});
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();state.palette?closePalette():openPalette();}
  if(e.key==='Escape'){closePalette();closeSidebar();$('inspector').classList.remove('open');}
});
$('menu-toggle').addEventListener('click',()=>{
  const sidebar=$('sidebar'),isOpen=sidebar.classList.toggle('open');
  $('menu-toggle').setAttribute('aria-expanded',String(isOpen));
});
$('inspector-close').addEventListener('click',()=>$('inspector').classList.remove('open'));
document.addEventListener('input',e=>{
  if(e.target.id==='session-search'){
    state.query=e.target.value;
    const pos=e.target.selectionStart;
    render();
    const newInput=$('session-search');
    if(newInput){newInput.focus();newInput.setSelectionRange(pos,pos);}
  }
});
if(Object.values(ACTION_AVAILABILITY).some((v,i)=>i>2&&v===true))
  throw new Error('unsafe demo action became enabled');
render();
