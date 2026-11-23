'use strict';
let token=null, campaign=null, activeTab='profile', activeLab=null, activeSector='C', connectedCenter=null, storageKind='capsule', reportScope='all', reportQuery='';
let busy=false, syncingNetwork=false;
let inputRevision=0;
for(const name of ['input','change'])$('workspace').addEventListener(name,event=>{
  inputRevision++;
  // An overlaid alert moves focus out of the form without submitting the draft.
  const form=event.target.form;
  if(form&&!form.matches('.mobil-form'))form.dataset.dirty='true';
},true);
mountOrganizationTabs();
const tabs=Array.from(document.querySelectorAll('[data-tab]'));
const views=Array.from(document.querySelectorAll('.desk-view'));
const formatter=new Intl.NumberFormat('fr-FR');
const date=value=>value?new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'Initialisation';
const toastText={
  forbidden:'Habilitation insuffisante.', unchanged:'L’état a déjà changé. Actualise les données.',
  duplicate:'Un projet porte déjà cette désignation.', invalid:'Vérifie les champs renseignés.',
  limit:'Le journal de campagne est plein.', council_denied:'Code SEC incorrect pour ce matricule.',
  wait:'Trop de codes rejetés. Réessaie dans 30 secondes.', unavailable:'Service indisponible. Aucune confirmation reçue.',
  high_council_active:'Le Haut-Conseil a suspendu les activités. Réessaie après la diffusion.',
  sector_closed:'Secteur indisponible dans le scénario. Rétablis-le avant de modifier ce registre.',
  purge_confirm:'La purge du canal doit être confirmée.',
  channel_closed:'Ce canal a été coupé. Choisis un salon en ligne.',
  picture:'Photo invalide ou trop volumineuse.', payload:'Le message est trop volumineux.',
  photo_limit:'Le quota de photos est atteint. Essaie un message sans pièce jointe.',
  message_limit:'Le registre de messages est plein. Aucun ancien message n’a été effacé.',
  not_found:'Élément introuvable ou indisponible.',proof_denied:'Le code personnel de la Direction est incorrect.',
  pipe_fault:'Ce circuit RP doit être réparé avant une correction de la jauge.',
  site_maintenance:'Les opérations sont suspendues pendant la maintenance générale.',
  maintenance_duration:'Choisis une durée entière entre 1 et 120 minutes.',
  curfew_active:'Ce compte ne dispose pas d’un accès pendant le couvre-feu.',
  curfew_hours:'Choisis deux heures différentes, entre 00:00 et 23:59.',
  curfew_unconfigured:'Enregistre d’abord une heure de début et une heure de fin.',
  incident_active:'Un confinement est déjà actif dans ce secteur. Le Conseil peut le lever.',
  funds:'Solde RP insuffisant. Aucun débit effectué.',
  stock_shortage:'Stock insuffisant. Aucun objet n’a été retiré et aucun débit n’a été effectué.',
  stock_changed:'Le stock a changé. Vérifie la quantité disponible avant de réessayer.',
  armory_relock:'Déverrouille à nouveau l’armurerie du Bastion pour continuer.',
};
function label(tag,text,cls){return el(tag,text,cls);}
function make(tag,cls,...children){
  const node=document.createElement(tag);if(cls) node.className=cls;
  node.append(...children);return node;
}
function button(text,action,cls='secondary'){
  const node=label('button',text,cls);node.type='button';node.addEventListener('click',action);return node;
}
function heading(kicker,title,sub){
  const h=label('h1',title);h.tabIndex=-1;
  return make('div','view-heading',label('p',kicker,'tag mono'),h,label('p',sub,'subtitle'));
}
function card(title,...children){return make('article','desk-card',label('h2',title),...children);}
function notice(text){$('desk-status').textContent=text;}
function pill(text,online){return label('span',text,`mono state-pill${online?' online':''}`);}
function empty(text){return label('p',text,'minor');}
function logRow(title,right,detail){
  const row=make('div','roster-row',label('strong',title,'wrap'),label('span',right,'mono state-pill'));
  if(detail) row.append(label('p',detail,'minor wrap')); return row;
}
let workspaceRequests=new AbortController();
function interruptWorkspaceRequests(){
  workspaceRequests.abort(new Error('curfew_active'));
  workspaceRequests=new AbortController();
}
async function api(route,data={}){
  const session=token,revision=liveAccessRevision;
  const statusOnly=route==='pulse'||route==='logout';
  if(highRun&&!statusOnly)throw new Error('high_council_active');
  if(current==='curfew'&&!statusOnly&&route!=='state')throw new Error('curfew_active');
  const timeout=AbortSignal.timeout(15000);
  const gate=workspaceRequests.signal;
  const signal=statusOnly?timeout:AbortSignal.any([timeout,gate]);
  const response=await fetch(endpoint(route),{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token:session,...data}),signal
  });
  const result=await response.json();
  if(!statusOnly&&gate.aborted)throw gate.reason;
  if(!response.ok){
    if(result.error==='high_council_active'&&token===session)receiveHighCouncil(result);
    if(result.error==='pda_locked'&&token===session&&session)showPdaLock(result.pda,result.now,session);
    if(token===session&&!oldAccessState(result,revision)){
      if(result.error==='site_maintenance')showSiteMaintenance(result.maintenance,result.now);
      if(result.error==='curfew_active')showSiteCurfew(result.curfew,{serverNow:result.now});
    }
    if(result.error==='session' && token===session){
      token=null;campaign=null;
      if(current==='curfew'&&curfewLock?.active){
        connectedProfile=null;clearPrivateViews();curfewPrevious='login';paintSiteCurfew();
      }else reset();
    }
    throw Object.assign(new Error(result.error||'unavailable'),{retryAfter:result.retryAfter,
      attemptsLeft:result.attemptsLeft,maxAttempts:result.maxAttempts});
  }
  return result;
}
function receiveCampaign(next){
  const previous=campaign;
  campaign=next;
  syncMobilHistory();
  paintHighCouncilLog();
  if(next.operations!==previous?.operations)receivePulse(next.operations?.incidents,true);
  updateNav();
  const key=activeTab==='centers'?'centerAlert':['labs','cryo'].includes(activeTab)?'sectorAlert':null;
  const alert=next[key];
  return alert&&alert.id!==previous?.[key]?.id?alert:null;
}
function alertLabel(alert){
  if(alert.kind==='sector') return `${alert.labName} · ${alert.sectorId} / ${alert.sectorName} · ${sectorStates[alert.status]}`;
  const status={maintenance:'MAINTENANCE DU SALON',repairing:'RÉPARATION DU SALON',destroyed:'AUTODESTRUCTION RP',online:'CANAL RÉTABLI'};
  return `${alert.centerId} · ${alert.centerName} · ${status[alert.status]??(alert.scene?'AUTODESTRUCTION RP':alert.online?'EN LIGNE':'ISOLÉ')}`;
}
function announce(alert){
  notice(alertLabel(alert));
  playVoice(alert.kind==='sector'?'sector':'network',false,alert);
}
async function syncNetwork(){
  const tab=activeTab;
  const route=tab==='centers'?'network':['labs','cryo','field-map','research-sites'].includes(tab)?'sites':null;
  if(current!=='workspace'||!route||busy||syncingNetwork||document.hidden||
     $(tab).querySelector('.operation-confirm,form[data-dirty]')) return;
  const session=token, before=campaign;
  syncingNetwork=true;
  try {
    const result=await api(route), patch=result[route];
    if(token!==session||activeTab!==tab||campaign!==before||busy||
       $(tab).querySelector('.operation-confirm,form[data-dirty]')) return;
    const changed=route==='network'?
      patch.centerAlert?.id!==before.centerAlert?.id ||
        patch.centers.some((center,i)=>['online','incident','status','until'].some(key=>center[key]!==before.centers[i]?.[key])):
      patch.sectorAlert?.id!==before.sectorAlert?.id || JSON.stringify(patch.siteSectors)!==JSON.stringify(before.siteSectors)||
        JSON.stringify(patch.lots)!==JSON.stringify(before.lots)||
        JSON.stringify(patch.cryoPipes)!==JSON.stringify(before.cryoPipes);
    if(!changed)return;
    const activeElement=document.activeElement;
    const focusedAction=activeElement?.dataset.networkFocus;
    if(!focusedAction&&activeElement?.matches('input,select,textarea')&&$(tab).contains(activeElement))return;
    const alert=receiveCampaign({...before,...patch});
    renderTab();
    if(focusedAction) {
      const control=Array.from($(tab).querySelectorAll('[data-network-focus]'))
        .find(item=>item.dataset.networkFocus===focusedAction&&!item.disabled);
      (control||$(tab).querySelector('h1'))?.focus({preventScroll:true});
    }
    if(alert) announce(alert);
  } catch { /* The next sync or manual refresh can recover. */ }
  finally {syncingNetwork=false;}
}
setInterval(syncNetwork,5000);
async function command(route,data,success,origin){
  if(busy||!token)return;
  const session=token;
  busy=true;
  if(origin)origin.disabled=true;
  notice('');
  try {
    const result=await api(route,data);
    if(token!==session)return;
    if(result.curfew?.active){showSiteCurfew(result.curfew,{serverNow:result.now});return;}
    if(result.maintenance){showSiteMaintenance(result.maintenance,result.now);return;}
    if(current!=='workspace')return;
    const alert=receiveCampaign(result.campaign);
    if(!hasAccess(activeTab))go('profile');
    else renderTab();
    if(alert)announce(alert);
    else {notice(success);playSfx('send');}
  } catch(error) { if(token===session&&current==='workspace'){notice(toastText[error.message]||toastText.unavailable);playSfx('denied');} }
  finally { busy=false;if(origin)origin.disabled=false; }
}
function confirmAction(text,question,action,success) {
  const host=make('div','');
  const first=button(text,()=>{
    const yes=button('Confirmer',()=>command('action',action,success,yes),'primary');
    const no=button('Annuler',()=>{host.replaceChildren(first);first.focus();});
    host.replaceChildren(make('div','operation-confirm',label('p',question,'minor'),yes,no));
    yes.focus();
  });
  host.append(first);return host;
}
function maintenanceControl(text,scope,action,success){
  const host=make('div','');
  const trigger=button(text,()=>{
    const minutes=make('input','');minutes.type='number';minutes.min='1';minutes.max='120';minutes.step='1';minutes.value='10';minutes.required=true;
    const form=make('form','operation-confirm maintenance-form',label('p',scope,'minor'),
      radioField(`maintenance-minutes-${action.id??'site'}`,'Durée de maintenance (1 à 120 minutes)',minutes));
    const yes=label('button','Confirmer','primary');yes.type='submit';
    const no=button('Annuler',()=>{host.replaceChildren(trigger);trigger.focus();});
    form.append(make('div','ops-actions',yes,no));
    form.addEventListener('submit',event=>{
      event.preventDefault();void command('action',{...action,minutes:minutes.valueAsNumber,confirmed:true},success,yes);
    });
    host.replaceChildren(form);minutes.focus();minutes.select();
  });
  host.append(trigger);return host;
}
function hasAccess(name){
  const bound=tabs.find(button=>button.dataset.tab===name);
  return Boolean(bound && (!bound.dataset.right||campaign?.rights[bound.dataset.right]));
}
function updateNav(){
  $('site-emergency').hidden=!campaign?.rights.direction;
  $('open-archives').hidden=!campaign?.rights.archives;
  $('bio-emergency').hidden=!campaign?.rights.incident;
  tabs.forEach(button=>button.hidden=!hasAccess(button.dataset.tab));
  document.querySelectorAll('.nav-group').forEach(group=>group.hidden=!group.querySelector('button:not([hidden])'));
  document.querySelectorAll('[data-shortcut]').forEach(control=>control.hidden=!hasAccess(control.dataset.shortcut));
}
function openWorkspace(data,gate){
  clearPrivateViews();
  token=data.token;campaign=data.campaign;connectedCenter=null;activeLab=null;activeSector='C';storageKind='capsule';reportScope='all';reportQuery='';
  const profile=data.profile;
  $('desk-id').textContent=`${profile.matricule??profile.id} / ${profile.level===null?(profile.roleCode??'SÉCURITÉ'):`NIVEAU ${profile.level}`}`;
  $('welcome-line').textContent=`Bienvenue, ${profile.name}. Ravie de vous revoir.`;
  updateNav();
  receiveHighCouncil(gate);
  if(gate?.maintenance||gate?.curfew?.active){
    activeTab='profile';
    if(gate.curfew?.active)showSiteCurfew(gate.curfew,{serverNow:gate.now});
    else showSiteMaintenance(gate.maintenance,gate.now);
    return;
  }
  screen('workspace');
  preloadMobilAudio();
  go('profile','all',{preserveScroll:false});
  receivePulse(campaign.operations?.incidents,true);
  showCouncilNotice();
}
let menuScrollY=null;
function navOpen(open){
  const toggle=$('nav-toggle');
  if(open&&toggle.getAttribute('aria-expanded')!=='true')menuScrollY=window.scrollY;
  if(!open)menuScrollY=null;
  toggle.setAttribute('aria-expanded',String(open));
}
$('nav-toggle').addEventListener('click',()=>navOpen($('nav-toggle').getAttribute('aria-expanded')!=='true'));
$('desk-nav').parentElement.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&(e.target===$('nav-toggle')||$('desk-nav').contains(e.target))&&$('nav-toggle').getAttribute('aria-expanded')==='true'){
    navOpen(false);$('nav-toggle').focus();
  }
});
function go(name,archiveFilter='all',{preserveScroll=true}={}){
  if(current!=='workspace'||!campaign||!hasAccess(name))return;
  if(name==='mail'){enterRadio('mail');return;}
  // On mobile the open menu temporarily adds height above the view.
  const scrollY=menuScrollY!==null&&$('nav-toggle').getClientRects().length?menuScrollY:window.scrollY;
  if(activeTab==='direction'&&name!=='direction')$('direction').replaceChildren();
  if(activeTab==='council'&&name!=='council'){
    $('council').querySelector('.armory-panel')?.releaseArmory?.();$('council').replaceChildren();
  }
  if(opsViews[activeTab]&&name!==activeTab){
    if(activeTab==='stocks')$('stocks').querySelector('.armory-panel')?.releaseArmory?.();
    $(activeTab).replaceChildren();
  }
  activeTab=name;notice('');
  if(name!=='profile')playSfx('navigate');
  navOpen(false);
  revealOrganizationTab(name);
  views.forEach(view=>view.hidden=view.id!==name);
  const navTarget=name==='radio'&&radioState.channel==='mail'?'mail':name;
  tabs.forEach(button=>button.dataset.tab===navTarget?button.setAttribute('aria-current','page'):button.removeAttribute('aria-current'));
  if (name==='archives') openArchive(archiveFilter);
  else renderTab();
  $(name).querySelector('h1')?.focus({preventScroll:preserveScroll});
  if(preserveScroll&&window.scrollY!==scrollY)window.scrollTo({top:scrollY,behavior:'instant'});
  if(['centers','labs','cryo','field-map','research-sites'].includes(name)) void syncNetwork();
  if(['workshop-virus','workshop-weapons','workshop-bio','industry','stocks','market','finance','council-manage'].includes(name)){
    const session=token,before=campaign,revision=inputRevision;
    api('state').then(result=>{
      if(session!==token||campaign!==before||revision!==inputRevision||busy||activeTab!==name||$('stock-use-dialog').open||
         $(name).querySelector('form:focus-within,form[data-dirty],.operation-confirm'))return;
      receiveCampaign(result.campaign);
      if(hasAccess(activeTab))renderTab();else go('profile');
    }).catch(()=>{});
  }
}
tabs.forEach(button=>button.addEventListener('click',()=>button.dataset.tab==='radio'?enterRadio('general'):go(button.dataset.tab)));
document.querySelectorAll('[data-shortcut]').forEach(control=>control.addEventListener('click',()=>go(control.dataset.shortcut)));
$('open-archives').addEventListener('click',()=>go('archives','virus'));
$('back-profile').addEventListener('click',()=>go('profile'));
$('logout').addEventListener('click',()=>{
  if(token) api('logout').catch(()=>{});
  token=null;campaign=null;connectedProfile=null;
  clearPrivateViews();
  cancelVoice();
  screen('signoff');
  playSfx('logout');
  playVoice('logout');
  const began=performance.now();
  const finish=()=>{if(current==='signoff')reset();};
  if(playing) playing.addEventListener('ended',()=>setTimeout(finish,Math.max(0,3250-(performance.now()-began))),{once:true});
  setTimeout(finish,voice?5600:3250);
});
function renderTab(){
  if(!campaign || !hasAccess(activeTab))return;
  if(activeTab==='council')$('council').querySelector('.armory-panel')?.releaseArmory?.();
  if(opsViews[activeTab]){opsViews[activeTab]($(activeTab));return;}
  const org=organizationByTab.get(activeTab);
  if(org&&activeTab!=='europe'){organizationSheet($(activeTab),org);return;}
  ({research,europe,organizations:organizationDirectory,labs:labMap,cryo,security,council,reports,centers:dataCenters,finance,radio:renderRadio,direction:renderDirection,mobilization:renderMobilization})[activeTab]?.($(activeTab));
}
const sectorStates={normal:'OPÉRATIONNEL',incident:'INCIDENT SIGNALÉ',scene:'CONDAMNÉ · RP'};
function siteSignal(site){
  const records=campaign.siteSectors[site.id];
  return records.some(s=>s.status==='scene')?'scene':records.some(s=>s.status==='incident')?'incident':'normal';
}
function sectorAnnouncement(){
  const alert=campaign.sectorAlert;
  if(!alert)return null;
  const play=button('Réécouter l’alerte de secteur',()=>playVoice('sector',true,alert),'text-button');
  play.dataset.networkFocus='site-voice';
  return make('div',`event-band signal-${alert.status}`,
    label('p','N04H / DERNIÈRE ALERTE SECTEUR','mono tag'),
    label('p',alertLabel(alert),'event-line'),
    label('p',date(alert.time),'mono minor'),play);
}
function labMap(root){
  const sites=campaign.labs;
  if(!sites.some(site=>site.id===activeLab)) activeLab=sites[0].id;
  const map=make('div','map-shell');
  map.setAttribute('role','group');map.setAttribute('aria-label','Schéma cliquable de Redcliff City');
  const list=make('div','map-sites');
  const selectedCard=make('div','site-detail');
  const markers=[];
  function select(id){
    if(activeLab!==id)activeSector='C';
    activeLab=id;
    const site=sites.find(s=>s.id===id);
    const stored=campaign.lots.filter(l=>l.lab===id);
    markers.forEach(({item,markerId})=>item.setAttribute('aria-pressed',String(markerId===id)));
    const sectorList=campaign.siteSectors[id];
    const incident=sectorList.filter(s=>s.status!=='normal');
    const floor=make('div',`floor-plan plan-${Math.max(0,sites.indexOf(site))%4}`);
    floor.setAttribute('role','group');floor.setAttribute('aria-label',`Plan des secteurs : ${site.name}`);
    const readout=make('div','desk-card sector-detail');
    const floorButtons=[];
    function showSector(id){
      activeSector=id;
      const zone=sectorList.find(s=>s.id===id);
      floorButtons.forEach(control=>control.setAttribute('aria-pressed',String(control.dataset.sector===id)));
      const action=(title,question,status)=>confirmAction(title,question,
        {action:'sector',id:site.id,sector:id,status},'Secteur mis à jour.');
      readout.replaceChildren(label('p',`${site.id} / SECTEUR ${zone.id}`,'tag mono'),
        label('h2',zone.name),label('p',zone.detail,'minor'),pill(sectorStates[zone.status],zone.status==='normal'));
      if(zone.id==='C'&&!site.destroyed&&!(site.id==='B01'&&!campaign.rights.council))readout.append(button('Ouvrir la salle cryo',()=>{storageKind='capsule';go('cryo');}));
      if(campaign.rights.direction&&!site.destroyed){
        if(zone.status==='normal')readout.append(action('Signaler un incident (RP)',`Signaler un incident dans le secteur ${zone.id} de ${site.name} ?`,'incident'));
        if(zone.status!=='normal')readout.append(action('Rétablir le secteur (RP)',`Clore la scène et rouvrir le secteur ${zone.id} ?`,'normal'));
      }
    }
    for(const zone of sectorList){
      const sectorButton=button('',()=>showSector(zone.id),`sector-tile tile-${zone.id} signal-${zone.status}`);
      sectorButton.dataset.sector=zone.id;
      sectorButton.dataset.networkFocus=`floor-${zone.id}`;
      sectorButton.append(label('span',`SECTEUR ${zone.id}`,'mono'),label('strong',zone.name),label('span',sectorStates[zone.status],'mono floor-status'));
      floorButtons.push(sectorButton);floor.append(sectorButton);
    }
    showSector(sectorList.some(zone=>zone.id===activeSector)?activeSector:'C');
    selectedCard.replaceChildren(
      make('div','site-intro',make('div','',label('p',`${site.id} / ${site.sector}`,'tag mono'),label('h2',site.name),
        label('p',site.description,'minor')),label('span',site.destroyed?'AUTODÉTRUIT · ACCÈS CONDAMNÉ':`${stored.filter(l=>l.kind==='capsule').length} CAPSULES / ${stored.filter(l=>l.kind==='fridge').length} FRIGOS`,'mono site-capacity')),
      ...(incident.length&&!site.destroyed?[label('p',`Secteurs touchés : ${incident.map(s=>`${s.id} · ${s.name}`).join(' / ')}`,'affected-line')]:[]),
      make('div','floor-layout',floor,readout)
    );
    if(site.destroyed)selectedCard.append(button('Ouvrir les rapports de Protest-X',()=>{reportScope='protest';reportQuery='';go('reports');}));
  }
  sites.forEach(site=>{
    const signal=siteSignal(site);
    if(site.x){
      const pin=button(site.id,()=>select(site.id),`map-pin signal-${signal}`);
      pin.style.left=`${site.x}%`;pin.style.top=`${site.y}%`;pin.title=site.name;
      pin.setAttribute('aria-label',`${site.id} ${site.name}`);pin.dataset.networkFocus=`pin-${site.id}`;
      markers.push({item:pin,markerId:site.id});map.append(pin);
    }
    const t=button(`${site.id} · ${site.name}`,()=>select(site.id),`site-choice signal-${signal}`);
    t.dataset.networkFocus=`site-${site.id}`;
    markers.push({item:t,markerId:site.id});list.append(t);
  });
  select(activeLab);
  const alert=sectorAnnouncement(),closed=sites.filter(site=>site.destroyed).length;
  root.replaceChildren(heading('REDCLIFF CITY / ATLAS CONFIDENTIEL','Carte des laboratoires','Sélectionne un site, puis un secteur du plan pour suivre son état.'),...(alert?[alert]:[]),map,
    label('p',closed?`${sites.length-closed} LABORATOIRES ACTIFS / ${closed} SITE DÉTRUIT · SCHÉMA RP`:`${sites.length} LABORATOIRES · SCHÉMA RP NON À L’ÉCHELLE`,'section-label mono'),list,selectedCard);
}
function cryo(root){
  const list=make('div','cryo-groups');
  const telemetry=make('section','pressure-panel');
  telemetry.setAttribute('aria-label','Télémétrie cryogénique');
  const initial=heading('CONFINEMENT / STOCK RP','Salles de cryogénisation',
    campaign.rights.cryo?'Supervise les circuits froids et le registre des capsules et frigos. Les interventions sont sauvegardées dans le RP.':'Supervision seule : ton habilitation permet de consulter la télémétrie et le registre froid.');
  const siteSelect=make('select','');
  siteSelect.id='cryo-site';siteSelect.append(make('option','','Tous les laboratoires'));
  siteSelect.firstChild.value='';
  for(const site of campaign.labs.filter(site=>!site.destroyed&&!(site.id==='B01'&&!campaign.rights.council))){const opt=label('option',`${site.id} · ${site.name}`);opt.value=site.id;siteSelect.append(opt);}
  if(!Array.from(siteSelect.options).some(opt=>opt.value===activeLab))activeLab=null;
  siteSelect.value=activeLab||'';siteSelect.dataset.networkFocus='storage-site';
  siteSelect.addEventListener('change',()=>{activeLab=siteSelect.value||null;paint();});
  const kinds=make('div','archive-filters');
  const inventoryTotal=kind=>campaign.lots.filter(l=>l.kind===kind).length;
  for(const [kind,text] of [['capsule',`Capsules cryo / ${inventoryTotal('capsule')}`],['fridge',`Frigos viraux / ${inventoryTotal('fridge')}`]]){
    const tab=button(text,()=>{storageKind=kind;paint();},'');
    tab.dataset.kind=kind;tab.dataset.networkFocus=`storage-${kind}`;kinds.append(tab);
  }
  const opened=new Set(Array.from(root.querySelectorAll('details[open][data-site]')).map(node=>node.dataset.site));
  function paint(){
    list.querySelectorAll('details[data-site]').forEach(node=>{
      if(node.open) opened.add(node.dataset.site);
      else opened.delete(node.dataset.site);
    });
    Array.from(kinds.children).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===storageKind)));
    list.replaceChildren();
    for(const site of campaign.labs.filter(s=>!activeLab||s.id===activeLab)){
      const items=campaign.lots.filter(lot=>lot.lab===site.id&&lot.kind===storageKind);
      if(!items.length)continue;
      const shut=campaign.siteSectors[site.id].find(s=>s.id==='C').status!=='normal'||
        activeBio().some(item=>item.site===site.id&&item.sector==='C');
      const grid=make('div','storage-grid',...items.map(lot=>{
        const frozen=lot.status==='frozen';
        const item=card(lot.unit,label('p',lot.name,'storage-name'),label('p',lot.type,'minor'),
          pill(storageKind==='capsule'?(frozen?'SOUS CRYO':'DÉCONGELÉ · RP'):(frozen?'CONSERVÉ':'SORTI · RP'),!frozen));
        item.dataset.kind=lot.kind;
        if(lot.kind==='capsule'){
          const level=lot.percent??75,meter=make('meter','pressure-meter');
          meter.min=0;meter.max=100;meter.value=level;meter.setAttribute('aria-label',`Niveau RP de la cuve ${lot.unit}`);
          item.append(make('div','pressure-reading',label('strong',`Cuve : ${level} %`,'mono'),meter));
        }
        if(!shut&&campaign.rights.cryo&&(site.id!=='B01'||campaign.rights.direction)){
          if(lot.kind==='capsule'){
            const exact=make('form','cryo-exact');
            const value=make('input','');value.type='number';value.min='0';value.max='100';value.step='1';value.required=true;value.value=String(lot.percent??75);
            value.setAttribute('aria-label',`Pourcentage de la cuve ${lot.unit}`);
            const apply=label('button','Régler la cuve','secondary');apply.type='submit';
            exact.append(value,apply);
            exact.addEventListener('input',()=>{exact.dataset.dirty='true';});
            exact.addEventListener('submit',event=>{
              event.preventDefault();void command('action',{action:'cryo_percent',id:lot.id,percent:value.valueAsNumber},
                `${lot.unit} : cuve réglée à ${value.valueAsNumber} %.`,apply);
            });
            item.append(exact);
          }
          const act=storageKind==='capsule'?(frozen?'Décongeler (RP)':'Replacer sous cryo (RP)'):(frozen?'Sortir du registre froid (RP)':'Replacer au frigo (RP)');
          item.append(confirmAction(act,`${lot.unit} : confirmer le changement d’état RP ?`,
            {action:'cryo',id:lot.id,status:frozen?'awake':'frozen'},'État du lot mis à jour.'));
        }
        return item;
      }));
      const detail=make('details','archive-entry storage-group',
        make('summary','',make('span','',label('span',`${site.id} / SALLE ${site.room} · ${items.length} UNITÉS`,'archive-kicker mono'),label('strong',site.name))),
        make('div','archive-biography',...(shut?[label('p','Halle cryogénique fermée par une alerte RP. Supervision uniquement.','affected-line')]:[]),grid));
      detail.dataset.site=site.id; detail.open=Boolean(activeLab)||opened.has(site.id);
      list.append(detail);
    }
    if(!list.children.length)list.append(empty('Aucune unité de ce type dans ce site.'));
    paintPressure(telemetry,activeLab||siteSelect.options[1]?.value);
  }
  const selector=label('label','Filtrer par emplacement');selector.htmlFor=siteSelect.id;
  const field=make('div','field inline-form',selector,siteSelect);
  const alert=sectorAnnouncement();
  root.replaceChildren(initial,...(alert?[alert]:[]),field,telemetry,kinds,list);
  paint();
}
function paintPressure(root,siteId){
  const site=campaign.labs.find(lab=>lab.id===siteId);
  const pipes=(campaign.cryoPipes??[]).filter(pipe=>pipe.lab===siteId);
  if(!site||!pipes.length){root.hidden=true;return;}
  root.hidden=false;
  const sectorClosed=campaign.siteSectors[siteId].find(s=>s.id==='C')?.status!=='normal';
  const bioClosed=activeBio().some(item=>item.site===siteId&&item.sector==='C');
  const canAct=campaign.rights.cryo&&(!sectorClosed)&&!bioClosed&&(siteId!=='B01'||campaign.rights.direction);
  const state=pipe=>pipe.fault?'fault':pipe.pressure<65?'low':pipe.pressure>85?'high':'stable';
  const stable=pipes.filter(pipe=>state(pipe)==='stable').length;
  const labels={fault:'Défaut · réparation requise',low:'Pression basse',high:'Pression haute',stable:'Stable'};
  const controls={fault:['repair','Réparer le circuit'],low:['raise','Augmenter la pression'],high:['lower','Réduire la pression']};
  const table=make('table','pressure-table');table.setAttribute('role','table');
  const names=['Circuit','Jauge RP','État','Intervention'];
  const header=make('thead','',make('tr','',...names.map(name=>{const cell=label('th',name);cell.scope='col';cell.setAttribute('role','columnheader');return cell;})));
  const rows=make('tbody','');
  header.setAttribute('role','rowgroup');header.firstChild.setAttribute('role','row');rows.setAttribute('role','rowgroup');
  for(const pipe of pipes){
    const condition=state(pipe);
    const meter=make('meter',`pressure-meter pressure-${condition}`);meter.min=0;meter.max=100;meter.value=pipe.pressure;
    meter.setAttribute('aria-label',`Niveau RP de ${pipe.name}`);
    const track=make('div','pressure-reading',label('strong',`${pipe.pressure} %`,'mono'),meter);
    const name=label('th',pipe.name);name.scope='row';name.setAttribute('role','rowheader');
    const status=label('span',labels[condition],`mono pressure-pill pressure-${condition}`);
    const [operation,caption]=controls[condition]??[];
    const op=canAct&&operation?button(caption,()=>command('action',
      {action:'cryo_pressure',id:pipe.id,operation},`${pipe.name} : jauge RP mise à jour.`,op),'secondary pressure-action'):null;
    if(op)op.dataset.networkFocus=`pressure-${pipe.id}`;
    const cell=(index,...content)=>{const td=make('td','',...content);td.dataset.label=names[index];td.setAttribute('role','cell');return td;};
    const exact=canAct&&!pipe.fault?make('form','cryo-exact'):null;
    if(exact){
      const value=make('input','');value.type='number';value.min='0';value.max='100';value.step='1';value.required=true;value.value=String(pipe.pressure);
      value.setAttribute('aria-label',`Pourcentage RP de ${pipe.name}`);
      const apply=label('button','Appliquer le %','secondary');apply.type='submit';
      exact.append(value,apply);
      exact.addEventListener('input',()=>{exact.dataset.dirty='true';});
      exact.addEventListener('submit',event=>{
        event.preventDefault();void command('action',{action:'cryo_pressure',id:pipe.id,operation:'set',pressure:value.valueAsNumber},
          `${pipe.name} : pression réglée à ${value.valueAsNumber} %.`,apply);
      });
    }
    const row=make('tr','',name,cell(1,track),cell(2,status),cell(3,op||(!exact?label('span',condition==='stable'?'Aucune action':'Lecture seule','minor'):''),...(exact?[exact]:[])));
    row.setAttribute('role','row');rows.append(row);
  }
  table.append(header,rows);
  const last=pipes.map(pipe=>pipe.updated).filter(Boolean).sort().at(-1);
  root.replaceChildren(make('div','pressure-heading',make('div','',
    label('p',`${site.id} / CIRCUIT FROID`,'tag mono'),label('h2','Télémétrie cryogénique'),
    label('p',`${site.name} · Indice de simulation, pas une mesure physique.`,'minor')),
    pill(`${stable}/${pipes.length} CIRCUITS STABLES`,stable===pipes.length)),
    table,label('p',sectorClosed||bioClosed?'Secteur cryogénique fermé dans le scénario. Commandes suspendues.':
      last?`Dernière intervention RP : ${date(last)}.`:(!activeLab?'Choisis un laboratoire pour consulter son tableau.':'Aucune intervention RP enregistrée sur ce circuit.'),'minor pressure-foot'));
}
function research(root){
  const input=make('input','');input.id='project-name';input.placeholder='Ex. Projet Mnémosyne II';
  input.required=true;input.minLength=3;input.maxLength=64;
  const strandField=make('select','');strandField.id='project-strand';
  for(const strand of ['Mémoire et identité','Réflexes et coordination','Perception et désorientation','Comportement de groupe']) strandField.append(label('option',strand));
  const kind=make('select','');kind.id='project-kind';
  for(const [id,name] of [['project','Projet d’observation'],['virus','Virus fictif · dossier RP']]){
    const option=label('option',name);option.value=id;kind.append(option);
  }
  const motif=make('select','');motif.id='project-motif';
  for(const name of ['Mirage','Écho temporel','Ombre mouvante','Lumière anormale'])motif.append(label('option',name));
  const motifField=radioField(motif.id,'Effet narratif fictif',motif);motifField.hidden=true;
  kind.addEventListener('change',()=>{motifField.hidden=kind.value!=='virus';});
  const nameLabel=label('label','Désignation du projet');nameLabel.htmlFor=input.id;
  const strandLabel=label('label','Domaine d’observation');strandLabel.htmlFor=strandField.id;
  const submitProject=label('button','Enregistrer le projet RP','primary');submitProject.type='submit';
  const form=make('form','inline-form project-form',radioField(kind.id,'Type de dossier',kind),make('div','field',nameLabel,input),
    make('div','field',strandLabel,strandField),motifField,submitProject);
  form.addEventListener('submit',event=>{event.preventDefault();command('action',{action:'project',kind:kind.value,name:input.value,
    strand:strandField.value,motif:motif.value},kind.value==='virus'?'Brouillon de virus RP créé.':'Projet ajouté au registre partagé.',submitProject);});
  const roster=make('div','roster');
  const phases={draft:'BROUILLON RP',preview:'APERÇU RP',archived:'AU REGISTRE'};
  for(const p of campaign.projects){
    const row=logRow(p.name,phases[p.phase]??p.status,`${p.strand||'Observation RP'} · ${p.by} · ${date(p.time)}`);
    if(p.kind==='virus'){
      if(p.phase!=='draft')row.append(label('p',`Scène de fiction : ${p.motif}. Axe narratif : ${p.strand}.`,'minor wrap'));
      if(p.canEdit&&p.phase!=='archived'){
        const stage=button(p.phase==='draft'?'Simuler l’aperçu RP':'Archiver le dossier RP',()=>command('action',
          {action:'agent_phase',id:p.id,phase:p.phase==='draft'?'preview':'archived'},
          p.phase==='draft'?'Aperçu narratif prêt.':'Dossier publié dans le Registre des agents.',stage));
        row.append(stage);
      }
      if(p.phase==='archived')row.append(button('Voir le dossier dans le registre',()=>go('archives','virus')));
    }
    roster.append(row);
  }
  if(!campaign.projects.length) roster.append(empty('Aucun nouveau projet enregistré.'));
  root.replaceChildren(heading('DIVISION RECHERCHE / R&D','Recherche & création','Invente un virus pour le scénario : nom, thème et effet narratif. Crée un brouillon, simule l’aperçu puis archive la fiche. Aucun protocole ni donnée biologique réelle.'),form,label('p','PROJETS DE LA CAMPAGNE','section-label mono'),roster);
}
function europe(root){
  const projects=make('div','europe-grid');
  for(const p of campaign.europe??[]){
    const body=make('div','europe-project-body',label('p',p.origin,'minor'),label('p',p.summary),label('p',p.handoff,'minor'));
    if(p.source){
      const link=label('a','Dossier officiel Resident Evil.NET','archive-reference');
      link.href=p.source;link.target='_blank';link.rel='noopener noreferrer';body.append(link);
    }
    projects.append(make('details','archive-entry europe-project',
      make('summary','',make('span','',label('span',`${p.id} · ${p.status}`,'archive-kicker mono'),label('strong',p.name))),body));
  }
  root.replaceChildren(organizationBack(),heading('UMBRELLA EUROPE / BUREAU DE LIAISON','Umbrella Europe',
    'Ouvre les dossiers du sixième laboratoire et les projets de liaison avec Redcliff. Les entrées « Campagne RP » ont été créées pour ce scénario.'),
    organizationBiography('europe'),
    make('div','module-lead',label('p','SIXIÈME LABORATOIRE / UE-06','tag mono'),label('h2','Projet Nemesis'),
      label('p','Archives du Poursuivant et dossier NE-α. Aucune unité n’est déclarée à Redcliff.','subtitle')),
    projects,button('Voir les rapports Umbrella Europe',()=>{reportScope='europe';reportQuery='';go('reports');}));
}
function reports(root){
  const list=make('div','archive-list');
  const status=label('p','','archive-count mono');
  status.setAttribute('role','status');
  const filters=make('div','archive-filters report-filters');
  filters.setAttribute('role','group');filters.setAttribute('aria-label','Filtrer les rapports');
  const scopes=[['all','Tous les rapports'],['city','Redcliff City'],['protest','Protest-X'],['europe','Umbrella Europe']];
  const search=make('input','');search.type='search';search.id='report-search';search.value=reportQuery;search.placeholder='Ex. Nemesis, Vesper, PX9';
  const searchField=radioField(search.id,'Rechercher par référence, titre ou mot-clé',search);
  const seen=new Set(campaign.articles.map(a=>a.scope||'city'));
  const entries=[];
  for(const article of campaign.articles){
    const extended=reportExpansions[article.id]??[];
    const item=make('details','archive-entry',
      make('summary','',make('span','',label('span',`${article.id} · ${article.tag}`,'archive-kicker mono'),label('strong',article.title))),
      make('div','archive-biography lore-reader',label('p',`${article.date} · ${article.status}`,'minor'),label('p',article.text),label('p',article.note,'minor'),
        ...extended.map(([title,copy])=>make('article','',label('h3',title),label('p',copy))))
    );
    entries.push({item,scope:article.scope||'city',haystack:normalized([...Object.values(article),...extended.flat()].join(' '))});list.append(item);
  }
  if(reportScope!=='all'&&!seen.has(reportScope))reportScope='all';
  function paintReports(){
    let visible=0;
    const words=normalized(reportQuery).split(' ').filter(Boolean);
    for(const {item,scope,haystack} of entries){
      item.hidden=(reportScope!=='all'&&reportScope!==scope)||!words.every(word=>haystack.includes(word));if(!item.hidden)visible++;
    }
    for(const control of filters.children)control.setAttribute('aria-pressed',String(control.dataset.reportFilter===reportScope));
    status.textContent=visible?`${visible} rapport${visible!==1?'s':''}`:'Aucun rapport ne correspond à ces filtres.';
  }
  search.addEventListener('input',()=>{reportQuery=search.value;paintReports();});
  for(const [scope,caption] of scopes){
    if(scope!=='all'&&!seen.has(scope))continue;
    const filter=button(caption,()=>{reportScope=scope;paintReports();},'');
    filter.dataset.reportFilter=scope;filters.append(filter);
  }
  paintReports();
  root.replaceChildren(heading('BUREAU DE VEILLE / PUBLICATIONS','Articles et rapports d’incident',
    'Consulte les signalements de Redcliff City, la chronologie de Protest-X et les transmissions d’Umbrella Europe.'),make('div','archive-controls',filters,searchField),status,list);
}
function refreshButton(){ const control=button('Actualiser les données',()=>command('state',{},'Données actualisées.',control));return control; }
function security(root){
  const roster=make('div','roster');
  for(const event of campaign.events) roster.append(logRow(event.title,date(event.time),event.by));
  if(!campaign.events.length) roster.append(empty('Aucun mouvement enregistré depuis l’ouverture.'));
  root.replaceChildren(heading('BUREAU DE VEILLE / REDCLIFF','Maintien de la sécurité','Suivi des alertes et des changements d’état de la campagne.'),make('div','desk-grid',
    card('INC-01 · Quai 17',pill('PÉRIMÈTRE SOUS VEILLE',false),label('p','Rapport disponible pour le personnel.','minor')),
    card('INC-02 · Hélios',pill('ENQUÊTE INTERNE',false),label('p','Lien avec Armatech non confirmé.','minor'))),
    button('Ouvrir les rapports',()=>go('reports')),label('p','JOURNAL DES OPÉRATIONS RP','section-label mono'),roster,refreshButton());
}
function council(root){
  const intro=heading('CONSEIL DE SÉCURITÉ / BUNKER B01','Le Bastion','Le plus grand bunker souterrain de Redcliff abrite le Conseil, l’armurerie et des laboratoires cachés.');
  if(!campaign.councilOpen){root.replaceChildren(intro);return;}
  root.replaceChildren(intro,make('div','bastion-banner scene-cover scene-bastion',pill('ACCÈS AU BUNKER AUTORISÉ',true),
    label('p','B01 / HABILITATION NIVEAU 5 OU SEC','mono tag')),
    make('div','council-links',
      ...(campaign.rights.mobilize?[button('Mobilisation des unités',()=>go('mobilization'),'primary')]:[]),
      ...(campaign.rights.councilManage?[button('Ouvrir le canal du Conseil',()=>enterRadio('council'),'primary')]:[]),
      button('Voir les laboratoires cachés',()=>{activeLab='B01';activeSector='G';go('labs');}),
      button('Voir les capsules du Bastion',()=>{activeLab='B01';storageKind='capsule';go('cryo');}),
      ...(campaign.rights.councilManage?[
        button('Registre privé du Conseil',()=>go('council-roster')),
        button('Gestion des sanctions',()=>go('council-manage'))
      ]:[])),armoryPanel());
}
function centerClock(until){
  const timer=label('time','','mono center-clock');
  timer.dateTime=new Date(until).toISOString();
  timer.dataset.centerUntil=until;
  timer.textContent=centerTimeLeft(until);
  return timer;
}
function centerTimeLeft(until){
  const seconds=Math.max(0,Math.ceil((until-Date.now())/1000));
  return seconds?`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:'Synchronisation…';
}
setInterval(()=>{
  if(current!=='workspace'||!['centers','radio'].includes(activeTab)||document.hidden)return;
  for(const timer of $(activeTab).querySelectorAll('[data-center-until]')) {
    const next=centerTimeLeft(Number(timer.dataset.centerUntil));
    if(timer.textContent!==next)timer.textContent=next;
  }
},500);
function dataCenters(root){
  const list=make('div','desk-grid center-grid');
  for(const center of campaign.centers){
    if(!center.online&&connectedCenter===center.id)connectedCenter=null;
    const status=center.status??(center.incident?'destroyed':center.online?'online':'isolated');
    const caption={online:'EN LIGNE',destroyed:'DÉTRUIT · CANAL FERMÉ',repairing:'RÉPARATION EN COURS',maintenance:'MAINTENANCE LOCALE',isolated:'ISOLÉ · RP'};
    const item=card(`${center.id} · ${center.name}`,label('p',center.zone,'minor'),label('p',center.role),pill(caption[status],center.online));
    item.dataset.center=center.id;item.dataset.centerStatus=status;
    if(center.until)item.append(make('p','minor center-eta',status==='repairing'?'Réouverture estimée : ':'Fin de la panne : ',centerClock(center.until)));
    const connected=connectedCenter===center.id;
    const connect=button(connected?'Détacher la console':'Se connecter à ce centre',()=>{
      connectedCenter=connected?null:center.id;dataCenters(root);
      notice(connected?'Console détachée.':`Console RP ouverte sur ${center.id} · ${center.name}.`);
      root.querySelector(`[data-center="${center.id}"] [data-network-focus]`)?.focus({preventScroll:true});
    });
    connect.dataset.networkFocus=`${center.id}-connect`;
    connect.disabled=!center.online;
    item.append(connect);
    const radioButton=button(center.online?'Ouvrir le canal RP':'Voir l’état du canal RP',()=>enterRadio(center.id));
    item.append(radioButton);
    if(connected) item.append(label('p','Liaison simulée ouverte · télémétrie disponible','tag mono'));
    if(campaign.rights.direction&&status==='online'){
      item.append(maintenanceControl('Mettre le salon en maintenance',
        `Seul le salon ${center.id} sera indisponible. Les messages et photos seront conservés et le reste de l’intranet restera accessible.`,
        {action:'center_maintenance',id:center.id},'Maintenance du salon lancée.'),
      confirmAction('Autodétruire le centre (RP)',
        `Autodétruire ${center.id} · ${center.name} ? Le salon sera fermé et ses messages et photos seront définitivement effacés. Les autres salons et les mails resteront disponibles.`,
        {action:'center_scene',id:center.id,active:true,confirmPurge:true},'Centre détruit dans le RP et salon purgé.'));
    }
    if(campaign.rights.direction&&status==='destroyed')item.append(confirmAction('Réparer le data center (RP)',
      `Réparer ${center.id} · ${center.name} ? Le salon rouvrira automatiquement après dix minutes. Le reste du site restera accessible. Les messages effacés ne seront pas restaurés.`,
      {action:'center_repair',id:center.id,confirmed:true},'Réparation du centre lancée.'));
    list.append(item);
  }
  const announcement=campaign.centerAlert;
  const replay=announcement&&!['maintenance','repairing'].includes(announcement.status)&&/^DC-0[1-4]$/.test(announcement.centerId)?button('Réécouter l’annonce',()=>playVoice('network',true,announcement),'text-button'):null;
  if(replay) replay.dataset.networkFocus='replay';
  const communications=make('div',`n04h-console network-console${announcement ? ' network-' + (announcement.online?'online':'isolated') : ''}`,
    make('div','n04h-eye',make('span','')),
    make('div','',
      label('p','REINE ROUGE / N04H · CANAL RÉSEAU','tag mono'),
      label('p',announcement?alertLabel(announcement):'Veille réseau active. Aucune annonce à signaler.','network-line'),
      ...(announcement?[label('p',`${announcement.centerId} · ${date(announcement.time)}${announcement.purged!==undefined?` · ${announcement.purged} message(s) purgé(s)`:''}`,'minor mono')]:[]),
      ...(replay?[replay]:[])
    )
  );
  communications.firstElementChild.setAttribute('aria-hidden','true');
  const refresh=refreshButton();refresh.dataset.networkFocus='refresh';
  const available=campaign.centers.filter(center=>center.online).length;
  root.replaceChildren(heading('RÉSEAU / INFRASTRUCTURE REDCLIFF','Data centers','Chaque centre gère son propre salon RP. Une panne, une autodestruction ou une réparation ne bloque ni l’intranet ni les autres salons.'),
    make('div','scene-cover scene-servers',label('span','REDCLIFF / BAIES DE COMMUNICATION','mono tag')),communications,
    label('p',`${available} / ${campaign.centers.length} CENTRES EN LIGNE`,'section-label mono network-count'),list,refresh);
}
function finance(root){
  const contracts=make('div','desk-grid');
  for(const contract of campaign.contracts) contracts.append(card(contract.name,pill(`+ ${rpAmount(contract.amount)}`,true),
    confirmAction('Comptabiliser la vente RP',`Verser ${rpAmount(contract.amount)} à la trésorerie ?`,{action:'sale',id:contract.id},'Vente fictive inscrite au journal.')));
  const ledger=make('div','roster',...campaign.ledger.map(e=>logRow(e.title,`${e.amount<0?'−':'+'} ${rpAmount(Math.abs(e.amount))}`,date(e.time))));
  const treasury=campaign.treasury;
  const next=treasury?new Intl.DateTimeFormat('fr-FR',{dateStyle:'long',timeStyle:'short',timeZone:'Europe/Paris'}).format(treasury.nextAt):null;
  const transfer=treasury?card('Dotation automatique',
    pill(`+ ${rpAmount(treasury.amount)} tous les ${treasury.hours} h`,true),
    label('p',`Prochain crédit prévu le ${next} (heure de Paris). Les crédits apparaissent dans le journal comptable.`, 'minor')):null;
  root.replaceChildren(heading('DIRECTION SUPRÊME / COMPTABILITÉ','Trésorerie RP','Solde partagé de campagne. Les achats, créations et ventes des ateliers sont inscrits automatiquement.'),balanceCard(),
    ...(transfer?[transfer]:[]),
    label('p','VENTES SCÉNARISÉES','section-label mono'),contracts,label('p','JOURNAL COMPTABLE','section-label mono'),
    ledger.children.length?ledger:empty('Aucun mouvement comptable enregistré.'),refreshButton());
}
