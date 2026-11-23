'use strict';

let pdaLock=null,pdaView=null;
const pdaRecoverySeconds=600;
const pdaGroups=[['','Toutes'],['research','Recherche'],['security','Sécurité'],
  ['blackwater','Blackwater'],['direction','Direction']];
const pdaPhases=[['','Tous'],['online','En ligne'],['offline','Hors ligne'],
  ['isolated','Neutralisé'],['recovering','Remise en service']];
const pdaStatus=device=>device.phase!=='ready'?device.phase:device.online?'online':'offline';
const pdaStatusLabel=state=>pdaPhases.find(([id])=>id===state)?.[1]??'';
const pdaCountdown=seconds=>[Math.floor(seconds/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
const pdaSet=(node,value)=>{if(node.dataset.pdaCopy!==value){node.dataset.pdaCopy=value;node.textContent=value;}};
const pdaDate=new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'});

function showPdaLock(info,now,proof){
  if(!info||!proof)return;
  interruptWorkspaceRequests();
  token=null;campaign=null;connectedProfile=null;
  clearPrivateViews();
  for(const id of ['profile-title','profile-group','profile-id','profile-level','profile-division','desk-id','welcome-line'])$(id).textContent='';
  cancelVoice();stopSfx();
  for(const name of ['bio-popup','council-notice'])if($(name).open)$(name).close();
  codeInput.value='';showCode(false);message('');
  pdaLock={proof,busy:false,info,now:now*1000,anchor:performance.now()};
  $('pda-lock-feedback').hidden=true;
  paintPdaLock();
  screen('pda-lock');
}
function paintPdaLock(){
  const lock=pdaLock;
  if(!lock)return;
  const {info}=lock,now=lock.now+performance.now()-lock.anchor;
  const phase=info.phase,repairing=phase==='recovering',ready=phase==='ready';
  const seconds=repairing?Math.max(0,Math.min(pdaRecoverySeconds,Math.ceil((info.readyAt-now)/1000))):0;
  const title=ready?'PDA rétabli':repairing?'Remise en service du PDA':'PDA neutralisé';
  pdaSet($('pda-lock-title'),title);
  pdaSet($('pda-lock-copy'),ready?'La remise en service est terminée. Identifie-toi à nouveau pour ouvrir une nouvelle session.':
    repairing?'La Direction a retiré le malware simulé. Le PDA restera inactif jusqu’à la fin de la remise en service de 10 minutes.':
    'Un malware simulé a été placé dans ce PDA. La session est inutilisable tant qu’un membre de la Direction de niveau 5 n’a pas autorisé la remise en service.');
  pdaSet($('pda-lock-status'),ready?'NOUVELLE CONNEXION AUTORISÉE':repairing?'SESSION INACTIVE · RÉPARATION VALIDÉE':'SESSION INACTIVE · VERROUILLAGE DE NIVEAU 5');
  pdaSet($('pda-lock-device'),info.label);
  pdaSet($('pda-lock-remaining'),repairing?(seconds?pdaCountdown(seconds):'Vérification…'):ready?'00:00':'En attente');
  pdaSet($('pda-return'),ready?'Se reconnecter':'Retour à la connexion');
  $('pda-lock-progress').hidden=!repairing;
  if(repairing)$('pda-lock-progress').value=pdaRecoverySeconds-seconds;
  const clock=$('pda-lock-clock');
  pdaSet(clock,parisTime.format(now));clock.dateTime=new Date(now).toISOString();
}
async function syncPdaLock(){
  const lock=pdaLock;
  if(current!=='pda-lock'||!lock||lock.busy||lock.info.phase==='ready')return;
  lock.busy=true;
  try{
    const response=await fetch(endpoint('pda-status'),{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:lock.proof}),signal:AbortSignal.timeout(6000)});
    const result=await response.json();
    if(lock!==pdaLock)return;
    if(!response.ok||!result.pda)throw new Error('status');
    receiveHighCouncil(result);
    lock.info=result.pda;lock.now=result.now*1000;lock.anchor=performance.now();
    $('pda-lock-feedback').hidden=true;
    paintPdaLock();
  }catch{
    if(lock===pdaLock){
      pdaSet($('pda-lock-feedback'),'Statut indisponible. Tu peux revenir à la connexion pour le vérifier à nouveau.');
      $('pda-lock-feedback').hidden=false;
    }
  }finally{lock.busy=false;}
}
$('pda-return').addEventListener('click',()=>{
  const proof=pdaLock?.proof,matricule=pdaLock?.info.matricule;
  pdaLock=null;
  if(proof)void fetch(endpoint('logout'),{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token:proof}),signal:AbortSignal.timeout(6000)}).catch(()=>{});
  reset();
  if(matricule)idInput.value=matricule;
  codeInput.focus();
  void syncPortalHealth();
});
setInterval(()=>{if(current==='pda-lock')paintPdaLock();},250);
setInterval(syncPdaLock,1700);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncPdaLock();});

function resetPdaInventory(){pdaView=null;}
const pdaHere=view=>view===pdaView&&view.session===token&&current==='workspace'&&activeTab==='pda'&&view.list.isConnected;
function pdaGroup(device){return ['principal','research'].includes(device.registry)?'research':device.registry;}
function pdaAffiliation(device){
  return device.dossier?`Blackwater · Niveau 4 · Dossier ${device.dossier}`:
    `${pdaGroups.find(([id])=>id===pdaGroup(device))?.[1]??device.division} · ${device.level===null?device.roleCode??'SEC':`Niveau ${device.level}`}`;
}
function pdaRow(device,view){
  const state=pdaStatus(device);
  const id=make('div','pda-identity',label('span',device.label,'mono tag'),label('strong',device.name),
    label('span',pdaAffiliation(device),'minor'));
  const signal=make('div','pda-signal',label('span',pdaStatusLabel(state),`pda-status pda-status-${state}`));
  signal.append(device.position?label('span',device.position.sector,'pda-sector'):label('span','Aucune position RP relevée','minor'));
  if(device.position){
    signal.append(label('span',`Relevé RP : ${pdaDate.format(device.position.at)}`,'minor'));
    if(device.position.from&&device.position.to)signal.append(button('Voir sur la carte',()=>{
      mapPdaPick=device;go('field-map');
    }));
  }
  if(device.readyAt)signal.append(label('span',`Réouverture à ${parisTime.format(device.readyAt)} (Paris)`,'minor'));
  if(device.operation)signal.append(label('span',`${device.operation.kind==='isolate'?'Isolé':'Réparation validée'} : ${device.operation.by} · ${pdaDate.format(device.operation.at)}`,'minor'));
  const actions=make('div','pda-actions');
  const locate=button('Localiser (RP)',()=>void requestPda(view,'locate',device.key,locate),'secondary');
  locate.dataset.pdaAction='locate';
  const showControls=()=>{
    actions.replaceChildren(locate);
    if(device.level===5)actions.append(label('span','PDA de Direction protégé','minor'));
    else if(state==='isolated'||device.phase==='ready'){
      const op=state==='isolated'?'repair':'isolate';
      const trigger=button(op==='repair'?'Réparer le PDA':'Neutraliser (RP)',()=>confirm(op),'secondary');
      trigger.dataset.pdaAction=op;actions.append(trigger);
    }else actions.append(label('span','Réactivation automatique','minor'));
  };
  function confirm(op){
    view.confirm=true;
    const question=op==='isolate'
      ?`Neutraliser ${device.label} ? Toutes les sessions de ce compte seront coupées.`
      :`Réparer ${device.label} ? Le compte restera bloqué 10 minutes.`;
    const accept=button('Confirmer',()=>void requestPda(view,op,device.key,accept),'primary');
    const cancel=button('Annuler',()=>{
      view.confirm=false;showControls();actions.querySelector(`[data-pda-action="${op}"]`)?.focus();
    },'secondary');
    actions.replaceChildren(make('div','pda-confirm operation-confirm',label('p',question,'minor'),accept,cancel));
    accept.focus();
  }
  if(campaign.rights.pdaManage)showControls();
  const row=make('article','pda-row',id,signal,actions);
  row.dataset.pdaKey=device.key;
  return row;
}
function paintPdaInventory(view){
  if(!view.devices)return;
  const {devices}=view,terms=normalized(view.search.value).split(' ').filter(Boolean);
  const selected=view.group.value,phase=view.phase.value;
  const rows=devices.filter(device=>(!selected||pdaGroup(device)===selected)&&(!phase||pdaStatus(device)===phase)&&
    terms.every(term=>normalized(`${device.key} ${device.label} ${device.name} ${device.division} ${pdaAffiliation(device)} ${device.position?.sector??''}`).includes(term)));
  const online=devices.filter(item=>pdaStatus(item)==='online').length;
  const isolated=devices.filter(item=>item.phase==='isolated').length;
  const recovering=devices.filter(item=>item.phase==='recovering').length;
  [devices.length,online,isolated,recovering].forEach((value,i)=>view.totals[i].textContent=value);
  view.count.textContent=`${rows.length} / ${devices.length} PDA affichés`;
  view.list.replaceChildren(...(rows.length?rows.map(row=>pdaRow(row,view)):[empty('Aucun PDA ne correspond aux filtres.')]));
  view.confirm=false;
}
async function requestPda(view,op='list',key=null,control=null){
  if(!pdaHere(view)||view.pending||(op==='list'&&view.confirm))return;
  view.pending=true;
  if(control)control.disabled=true;
  try{
    const {devices}=await api('pda',{op,key,confirmed:op==='isolate'||op==='repair'});
    if(!pdaHere(view))return;
    const change=JSON.stringify(devices)!==JSON.stringify(view.devices);
    view.devices=devices;
    if((change&&!view.confirm)||op!=='list')paintPdaInventory(view);
    if(op!=='list'){
      const output={locate:'Position RP relevée.',isolate:'PDA neutralisé. Les sessions ont été coupées.',repair:'Réparation validée. Décompte de 10 minutes lancé.'};
      pdaSet(view.feedback,output[op]);
      view.list.querySelector(`[data-pda-key="${CSS.escape(key)}"] button`)?.focus({preventScroll:true});
    }else if(view.feedback.dataset.pdaCopy==='Impossible de charger le registre PDA.')pdaSet(view.feedback,'');
  }catch(error){
    if(pdaHere(view))pdaSet(view.feedback,
      error.message==='pda_state_changed'?'L’état de ce PDA a changé. Annule et actualise le registre.':
      error.message==='pda_protected'?'Un PDA de Direction ne peut pas être neutralisé.':
      error.message==='pda_location_unavailable'?'Aucun trajet RP entre deux laboratoires n’est disponible.':'Impossible de charger le registre PDA.');
  }finally{view.pending=false;if(control)control.disabled=false;}
}
function renderPda(root){
  const search=textInput('Nom, matricule ou secteur RP',80,'search'),group=optionsList(pdaGroups),phase=optionsList(pdaPhases);
  const count=label('p','','minor mono');count.setAttribute('role','status');
  const feedback=label('p','','minor pda-feedback');feedback.setAttribute('role','status');
  const totals=['PDA enregistrés','En ligne','Neutralisés','En réparation'].map(title=>make('div','pda-total',
    label('span',title,'minor'),label('strong','…','mono')));
  const list=make('div','pda-list',empty('Lecture du registre PDA…'));
  const view={session:token,list,search,group,phase,count,feedback,totals:totals.map(node=>node.lastElementChild),devices:null,confirm:false,pending:false};
  pdaView=view;
  const refresh=button('Actualiser',()=>void requestPda(view),'secondary');
  const filters=make('div','pda-filters',radioField('pda-search','Rechercher un PDA',search),
    radioField('pda-group','Affectation',group),radioField('pda-phase','État',phase),refresh);
  for(const [control,event] of [[search,'input'],[group,'change'],[phase,'change']])control.addEventListener(event,()=>paintPdaInventory(view));
  const manage=campaign.rights.pdaManage;
  root.replaceChildren(heading(manage?'CONSEIL DE SÉCURITÉ / HABILITATION 05':'CONSEIL DE SÉCURITÉ / CONSULTATION 04','PDA de terrain',
    manage?'Registre des terminaux attribués. La localisation est simulée dans Redcliff : aucune donnée GPS réelle n’est collectée.':
      'Consultation uniquement. Les positions sont simulées sur la carte de Redcliff ; seul le niveau 5 peut relever une position, neutraliser ou réparer un PDA.'),
    make('div','pda-totals',...totals),filters,make('div','pda-list-info',count,feedback),list);
  void requestPda(view);
}
setInterval(()=>{if(pdaView&&pdaHere(pdaView)&&!document.hidden)void requestPda(pdaView);},5000);
