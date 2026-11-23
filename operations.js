'use strict';
const romanLevels=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
const incidentKinds=[['vial','Fiole cassée',2],['leak','Fuite d’un agent fictif',5],['escape','Évasion d’un sujet RP',8],['isolation','Périmètre de confinement compromis',10]];
const opsPrices={virus:[6000,15000],weapons:[12500,21000],bio:[20000,32000]};
const opsPlans={
  virus:['Combinaison narrative'],
  weapons:['Carabine Sentinel RP','Réplique CQBR','Réplique M4','Équipement de garde RP','Réplique Clatter Carbine','Dossier d’accessoires Kendo'],
  bio:['Tyrant · dossier T-002','Tyrant · dossier T-103','Tyrant · dossier T-078','Nemesis · dossier de scénario','Hunter · dossier de scénario']
};
const opsSignals=['Écho','Prisme','Brume','Sillage','Reflet','Nacre','Voile','Zénith'];
const opsMarket=[['archive','Catalogue d’archives scellées',2000],['reference','Recoupement d’une référence RP',3500],['liaison','Demande de liaison narrative',5000]];
const opsOrderState={ready:'Disponible',sold:'Vendu',convoy:'En convoi',delivered:'Réceptionné'};
const fieldPositions={
  N04:[18,16,true,'Route nord, en forêt juste avant la zone désertique'],
  B01:[35.4,76,true,'Sur la langue de terre entre le lac et le volcan de Protest-X'],PX9:[31,66,true,'Sur le volcan · site condamné'],Q17:[61,48,true,'Au niveau du port'],
  R01:[49,43,false,'Complexe urbain'],H02:[50,27,false,'Annexe est'],
  E05:[63,20,false,'Secteur nord-est'],V06:[18,39,false,'Secteur ouest'],M07:[49,66,false,'Secteur sud']
};
const siteNotes={
  R01:['Direction scientifique','Dossiers transversaux et archivage des signatures.', 'Écho / Prisme'],
  H02:['Bureau d’analyse Hélios','Recoupement des journaux et des identités narratives.','Nacre / Voile'],
  Q17:['Relais portuaire','Registre des arrivages fictifs et vue des convois à destination du quai.','Sillage / Nacre'],
  N04:['Observatoire Northgate','Catalogues d’observation et scénarios de terrain.','Brume / Zénith'],
  E05:['Laboratoire Équinoxe','Comparaison d’archives et contrôle des accès RP.','Prisme / Voile'],
  V06:['Station Vesper','Dossiers d’essai de campagne et registre de garde.','Brume / Reflet'],
  M07:['Laboratoire Mnémosyne','Fiches d’identités scénarisées et archives de projets.','Écho / Reflet'],
  B01:['Annexe réservée du Bastion','Consultation conditionnée à une habilitation du Conseil de Sécurité.','Voile / Zénith']
};
let opsPulse=null, opsSyncing=false, mapPick='B01', mapPdaPick=null, researchPick='', blackwaterTab='brief';
let opsSeen=new Set(), opsDismissed=new Set();

function clearOpsSession(){
  opsPulse=null;opsSeen=new Set();opsDismissed=new Set();mapPick='B01';mapPdaPick=null;researchPick='';blackwaterTab='brief';
  if($('bio-popup').open)$('bio-popup').close();
  $('bio-popup').replaceChildren();$('bio-ribbon').hidden=true;$('bio-emergency').hidden=true;
}
function activeBio(){return (opsPulse?.alerts??[]).filter(item=>item.active);}
function bioTitle(item){return `ALERTE BIOHAZARD ${item.siteName.toLocaleUpperCase('fr-FR')} / SECTEUR ${item.sector}`;}
function bioDanger(item){return `CONFINEMENT ET DANGER DE NIVEAU ${romanLevels[item.level-1]}`;}
function paintBioPopup(){
  const open=activeBio().filter(item=>!opsDismissed.has(item.id));
  const panel=$('bio-popup'), ribbon=$('bio-ribbon');
  const alarms=activeBio();
  ribbon.hidden=!alarms.length;ribbon.textContent=`BIOHAZARD · ${alarms.length}`;
  if(!open.length||current!=='workspace'||highRun){
    if(panel.open)panel.close();panel.replaceChildren();return;
  }
  const focus=panel.contains(document.activeElement);
  const newest=open.at(-1);
  const details=make('div','bio-announcement',label('p','UMB.NET / DIFFUSION D’URGENCE RP','mono tag'),
    label('h2',`${bioTitle(newest)} — ${bioDanger(newest)}`),
    label('p',`${newest.kind} · ${newest.sectorName}${open.length>1?` · ${open.length} alertes en cours`:''}`));
  details.setAttribute('role','alert');
  const show=button('Voir les alertes',()=>{
    open.forEach(item=>opsDismissed.add(item.id));paintBioPopup();go('biohazard');
  },'secondary');
  const hide=button('Masquer',()=>{
    open.forEach(item=>opsDismissed.add(item.id));paintBioPopup();ribbon.focus();
  },'text-button');
  panel.replaceChildren(details,make('div','ops-actions',show,hide));
  if(!panel.open)panel.showModal();
  if(focus||!panel.contains(document.activeElement))show.focus({preventScroll:true});
}
function receivePulse(data,immediate=false){
  if(!data)return;
  const previous=opsPulse;
  const changed=JSON.stringify(data.alerts??[])!==JSON.stringify(previous?.alerts??[]);
  opsPulse=data;
  if(changed||!previous){
    const urgent=activeBio().filter(item=>!opsSeen.has(item.id));
    urgent.forEach(item=>opsSeen.add(item.id));
    paintBioPopup();
    if(urgent.length)playSfx('alarm');
    if(!immediate&&['field-map','biohazard','research-sites','cryo'].includes(activeTab)&&
       !$(activeTab)?.querySelector('form:focus-within,form[data-dirty],.operation-confirm'))renderTab();
  }
}
async function syncOps(){
  if(!['workspace','maintenance','curfew'].includes(current)||!token||opsSyncing)return;
  const session=token,before=campaign,revision=liveAccessRevision,began=performance.now();opsSyncing=true;
  try{
    const data=await api('pulse',{revision:opsPulse?.revision});
    if(session!==token||oldAccessState(data,revision))return;
    syncParisClock(data.now);
    if(receiveHighCouncil(data,performance.now()-began))return;
    if(data.curfew?.active){showSiteCurfew(data.curfew,{serverNow:data.now});return;}
    if(data.maintenance){showSiteMaintenance(data.maintenance,data.now);return;}
    if(current==='maintenance'){await leaveSiteMaintenance(undefined,data.curfew,data.now);return;}
    if(current==='curfew'){await leaveSiteCurfew();return;}
    receiveMobilizationSignal(data,performance.now()-began);
    if(campaign!==before||busy)return;
    if(data.curfew&&sameCurfewSchedule(campaign.curfew,data.curfew)){
      campaign.curfew=data.curfew;
      if(activeTab==='direction')paintCurfewStatus();
    }
    receivePulse(data);
    const rightsChanged=JSON.stringify(data.rights)!==JSON.stringify(campaign.rights);
    const editing=$('stock-use-dialog').open||$(activeTab)?.querySelector('form:focus-within,form[data-dirty],.operation-confirm')||
      (activeTab==='stocks'&&$('stocks').querySelector('details[open] .armory-table'));
    if(data.rights&&(rightsChanged||(!editing&&data.revision!==campaign.revision))){
      const inputStamp=inputRevision,oldNotice=campaign.notice;
      const result=await api('state');
      if(session!==token||campaign!==before||busy||(!rightsChanged&&(inputStamp!==inputRevision||$('stock-use-dialog').open||
        $(activeTab)?.querySelector('form[data-dirty],.operation-confirm'))))return;
      const alert=receiveCampaign(result.campaign);
      if(!hasAccess(activeTab))go('profile');
      else if(activeTab==='direction'&&!sameCurfewSchedule(before.curfew,campaign.curfew))$('direction-curfew')?.replaceWith(directionCurfewCard());
      else if(['cryo','field-map','labs','research-sites','workshop-virus','workshop-weapons','workshop-bio','industry','stocks','market','finance','council-manage','security','research','biohazard','centers'].includes(activeTab))renderTab();
      if(alert)announce(alert);
      if(oldNotice?.id!==campaign.notice?.id)showCouncilNotice();
    }
  }catch{/* Preserve the current status when the connection drops. */}
  finally{opsSyncing=false;}
}
setInterval(syncOps,900);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncOps();});
$('bio-ribbon').addEventListener('click',()=>go('biohazard'));
$('bio-emergency').addEventListener('click',()=>{go('biohazard');$('bio-site')?.focus();});
$('bio-popup').addEventListener('cancel',event=>{
  event.preventDefault();activeBio().forEach(item=>opsDismissed.add(item.id));paintBioPopup();$('bio-ribbon').focus();
});

function optionsList(entries,initial){
  const select=make('select','');select.required=true;
  for(const [value,caption] of entries){const option=label('option',caption);option.value=value;select.append(option);}
  if(initial&&entries.some(item=>item[0]===initial))select.value=initial;
  return select;
}
function virusCardSelect(canon,fallback,value){
  const select=optionsList([]);
  for(const [title,items] of [['Virus de Resident Evil',canon],['Cartes de scénario',fallback]]){
    if(!items.length)continue;
    const group=make('optgroup','');group.label=title;
    group.append(...optionsList(items.map(item=>[item,item])).children);select.append(group);
  }
  select.value=value;
  return select;
}
function operationalSites(){
  return (campaign.labs??[]).filter(site=>!site.destroyed&&(site.id!=='B01'||campaign.rights.council));
}
function locationOptions(initial){
  return optionsList(operationalSites().map(site=>[site.id,`${site.id} · ${site.id==='Q17'?'Quai du relais portuaire':site.name}`]),initial);
}
function rpAmount(amount){return `${formatter.format(amount)}\u00a0$`;}
function balanceCard(){
  return make('div','ops-balance',label('span','TRÉSORERIE PARTAGÉE','tag mono'),
    label('strong',rpAmount(campaign.balance??0),'mono'),label('p','Dollars fictifs, sans conversion ni paiement réel.','minor'));
}
function opsForm(title,fields,caption,submitFn){
  const submit=label('button',caption,'primary');submit.type='submit';
  const form=make('form','ops-console',label('h2',title),make('div','ops-fields',...fields),submit);
  for(const name of ['input','change'])form.addEventListener(name,()=>{form.dataset.dirty='true';});
  form.addEventListener('submit',event=>{event.preventDefault();if(!submit.disabled)submitFn(submit);});
  return form;
}
function renderFieldMap(root){
  const sites=campaign.labs??[];
  const map=make('div','field-map-image');
  const image=make('img','');image.src='./redcliff-field-map.webp';image.alt='Carte de Redcliff : ville au centre, port à l’est, volcan et lac reliés par une langue de terre au sud-ouest';
  image.width=1254;image.height=1254;image.decoding='async';map.append(image);
  const pins=new Map(),list=make('div','field-site-list'),details=make('article','ops-console field-map-detail');
  const historical=[['L-321','Égouts de Redcliff · incident T/G']];
  const pda=hasAccess('pda')?mapPdaPick:null;
  const path=pda?.position;
  const ends=path&&[path.from,path.to].map(id=>sites.find(site=>site.id===id));
  const onMap=ends?.every(Boolean)&&ends.every(site=>fieldPositions[site.id])&&Number.isFinite(path.ratio);
  function show(id){
    if(onMap&&id===pda.label){
      mapPdaPick=pda;
      for(const [key,controls] of pins)controls.forEach(item=>item.setAttribute('aria-pressed',String(key===id)));
      details.replaceChildren(label('p','PDA DE TERRAIN / RELEVÉ RP','tag mono'),label('h2',pda.label),
        label('p',pda.name,'minor'),label('p',path.sector,'pda-map-route'),
        label('p',`Relevé RP : ${pdaDate.format(path.at)}`,'minor'),
        button('Retour au registre PDA',()=>go('pda')));
      return;
    }
    mapPdaPick=null;
    mapPick=id;
    for(const [key,list] of pins)list.forEach(item=>item.setAttribute('aria-pressed',String(key===id)));
    const site=sites.find(item=>item.id===id);
    if(!site){
      details.replaceChildren(label('p','ARCHIVES D’INCIDENT · RP','tag mono'),
        label('h2','Égouts de Redcliff · dossier L-321'),
        label('p','Repère d’archive approximatif. Le Conseil a consigné un incident lié aux agents fictifs T et G, distinct du dossier Protest-X.'),
        button('Ouvrir les rapports',()=>{reportScope='city';reportQuery='';go('reports');}));
      return;
    }
    const [, , confirmed,caption]=fieldPositions[id];
    const properName=id==='Q17'?'Quai du relais portuaire':site.name;
    const alarms=activeBio().filter(item=>item.site===id);
    const affected=(campaign.siteSectors?.[id]??[]).filter(s=>s.status==='incident');
    details.replaceChildren(label('p',`${id} · ${confirmed?'REPÈRE VALIDÉ':'REPÈRE PROVISOIRE'}`,'tag mono'),
      label('h2',properName),label('p',`${caption}. ${site.description}`),
      ...alarms.map(item=>label('p',`${bioDanger(item)} · Secteur ${item.sector} · ${item.kind}`,'affected-line')),
      ...affected.map(zone=>label('p',`Secteur ${zone.id} · incident signalé dans le plan`,'affected-line')),
      make('div','ops-actions',button('Ouvrir le plan des secteurs',()=>{activeLab=id;activeSector='C';go('labs');}),
        ...(site.destroyed?[button('Rapports de Protest-X',()=>{reportScope='protest';reportQuery='';go('reports');})]:[])));
  }
  function mark(id,x,y,caption,style){
    const tile=button(`${id} · ${caption}`,()=>show(id),`field-site-chip ${style}`);
    const controls=[tile];
    if(x!==null&&y!==null){
      const pin=button(id,()=>show(id),`field-pin ${style}`);
      pin.style.setProperty('--x',`${x}%`);pin.style.setProperty('--y',`${y}%`);
      pin.title=caption;pin.setAttribute('aria-label',`${id} · ${caption}`);pin.dataset.site=id;
      controls.push(pin);map.append(pin);
    }
    pins.set(id,controls);list.append(tile);
  }
  for(const site of [...sites].sort((a,b)=>Number(Boolean(fieldPositions[b.id]?.[2]))-Number(Boolean(fieldPositions[a.id]?.[2])))){
    const pos=fieldPositions[site.id];if(!pos)continue;
    const [x,y,fixed]=pos;
    const incident=activeBio().some(item=>item.site===site.id)||(campaign.siteSectors?.[site.id]??[]).some(zone=>zone.status==='incident');
    mark(site.id,x,y,site.id==='Q17'?'Quai du relais portuaire':site.name,`${fixed?'fixed':'provisional'}${incident?' incident':site.destroyed?' condemned':''}`);
  }
  for(const [id,name] of historical)mark(id,null,null,name,'historical');
  if(onMap){
    const [[fromX,fromY],[toX,toY]]=ends.map(site=>fieldPositions[site.id]);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','pda-map-link');svg.setAttribute('viewBox','0 0 100 100');
    svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
    const line=document.createElementNS(svg.namespaceURI,'line');
    for(const [key,value] of Object.entries({x1:fromX,y1:fromY,x2:toX,y2:toY}))line.setAttribute(key,value);
    svg.append(line);map.append(svg);
    mark(pda.label,fromX+(toX-fromX)*path.ratio,fromY+(toY-fromY)*path.ratio,path.sector,'pda-map-pin');
    const pin=pins.get(pda.label).at(-1);
    pin.textContent='PDA';
    pin.dataset.pdaPin=pda.key;
  }
  root.replaceChildren(heading('REDCLIFF CITY / ATLAS DE CAMPAGNE','Localisation de nos labos',
    'Tous les labos sont visibles sur la carte. Sélectionne un repère pour ouvrir sa fiche. Les emplacements en pointillés sont indicatifs.'),
  make('div','field-map-layout',map,make('div','field-map-side',
    make('div','field-legend',label('span','Repère validé','fixed'),label('span','Emplacement indicatif','provisional'),label('span','Archives / condamné','historical'),label('span','Incident actif','incident')),
    details,list)));
  show(onMap?pda.label:pins.has(mapPick)?mapPick:sites[0]?.id??'L-321');
}
function renderResearchSites(root){
  const sites=operationalSites();
  const cards=sites.map(site=>{
    const [title,detail,suggested]=siteNotes[site.id]??[site.name,'Dossiers de campagne du laboratoire.','Écho / Prisme'];
    const closed=campaign.siteSectors[site.id].find(zone=>zone.id==='B')?.status!=='normal'||
      activeBio().some(item=>item.site===site.id&&item.sector==='B');
    const launch=button('Ouvrir l’atelier sur ce site',()=>{researchPick=site.id;go('workshop-virus');},'primary');
    launch.disabled=closed||!campaign.rights.workshopVirus;
    return card(title,label('p',`${site.id} · ${site.name}`,'tag mono'),label('p',detail),
      pill(closed?'RECHERCHE SUSPENDUE':'SECTEUR B DISPONIBLE',!closed),
      label('p',`Cartes de jeu suggérées : ${suggested}.`,'minor'),make('div','ops-actions',launch,
        button('Situer sur la carte',()=>{mapPick=site.id;go('field-map');})));
  });
  root.replaceChildren(heading('UMB.NET / RÉSEAU SCIENTIFIQUE','Sites de recherche',
    'Choisis une implantation pour ouvrir un projet. L’état du secteur B et les alertes actives déterminent si le site peut accepter un nouveau dossier.'),
    make('div','desk-grid ops-grid',...cards));
}
function convoyNote(id){
  const input=make('textarea','');input.maxLength=600;input.rows=3;
  input.placeholder='Ex. À déposer au bureau de réception.';
  return {input,field:radioField(id,'Message au laboratoire (facultatif)',input)};
}
function convoyDestinations(control,sites){
  const placeholder=label('option','Choisir un laboratoire');placeholder.value='';placeholder.disabled=true;
  control.replaceChildren(placeholder,...optionsList(sites.map(site=>[site.id,`${site.id} · ${site.name}`])).children);
  control.value='';
  return control;
}
function convoyQuantity(max=40){
  const input=make('input','');input.type='number';input.min='1';input.max=String(max);input.step='1';input.value='1';input.required=true;
  return input;
}
function convoyCost(quantity){
  const tally=label('p','','minor convoy-cost');
  const update=()=>tally.textContent=`Coût du convoi : ${rpAmount(quantity.valueAsNumber*500||0)}`;
  quantity.addEventListener('input',update);update();
  return {tally,update};
}
const isClosedLogistics=order=>order.kind!=='virus'&&(order.status==='delivered'||order.status==='sold');
function dotationNameField(id,optional=false){
  const input=textInput('Ex. Umbrella Corporation',55);
  input.minLength=3;input.required=!optional;
  const names=[...new Set((campaign.operations?.orders??[]).filter(order=>order.kind==='weapons'&&(!order.transfer||order.company))
    .map(order=>order.name))].sort((a,b)=>a.localeCompare(b,'fr'));
  const list=make('datalist','');list.id=`${id}-suggestions`;input.setAttribute('list',list.id);
  for(const name of names){const option=make('option','');option.value=name;list.append(option);}
  const field=radioField(id,optional?'Nom de l’entreprise (facultatif)':'Nom de l’entreprise ou du bon',input);
  field.append(list);
  return {input,field};
}
function logisticsHistoryReset(){
  if(!campaign.rights.direction)return [];
  const count=(campaign.operations?.orders??[]).filter(isClosedLogistics).length;
  const caption='Réinitialiser l’historique logistique';
  const control=count?confirmAction(caption,
    'Archiver les bons clôturés et les convois réceptionnés dans toutes les vues logistiques ? Les stocks, les opérations en cours, les messages et la trésorerie ne changeront pas.',
    {action:'logistics_reset',confirmed:true},'Historique logistique réinitialisé dans toutes les vues.'):
    button(caption,()=>{});
  if(!count)control.disabled=true;
  return [make('div','logistics-history-reset',control,
    label('p',count?`Entrées clôturées à archiver : ${count}`:'Aucune entrée logistique clôturée à archiver.','minor'))];
}
function closedOrdersDisclosure(root,title,orders,none){
  const details=make('details','archive-entry logistics-history',make('summary','',label('strong',title),
    label('span',String(orders.length),'mono state-pill')),
    make('div','archive-biography',orders.length?make('div','desk-grid ops-grid',...orders.map(order=>orderCard(order))):empty(none)));
  details.open=Boolean(root.querySelector('.logistics-history[open]'));
  return details;
}
function orderReference(order){
  const ref=label('span',order.id.slice(0,8).toUpperCase());
  ref.title=order.id;
  return make('p','tag mono',ref,` · ${order.site} · ${order.plan}`);
}
function orderCard(order,shipping=false){
  const inTransit=order.status==='convoy'||order.status==='delivered';
  const message=order.message?label('p',order.message,'message-copy convoy-message'):null;
  const siteName=id=>campaign.labs?.find(place=>place.id===id)?.name??id;
  const out=card(order.name,orderReference(order),
    pill(opsOrderState[order.status],order.status==='ready'||order.status==='delivered'),
    ...(order.signals.length?[label('p',order.signals.join(' + '),'minor')]:[]),
    ...(inTransit?[label('p',`Trajet : ${siteName(order.site)} → ${siteName(order.destination)}`,'minor'),
      label('p',`Quantité envoyée : ${order.quantity}`,'minor')]:[]),
    ...(message?[make('div','convoy-note',label('p','Message au laboratoire','tag mono'),message)]:[]));
  out.dataset.orderId=order.id;
  out.querySelector('h2').setAttribute('data-ui-original','');
  if(!order.canManage||!(order.kind==='virus'?campaign.rights.workshopVirus:campaign.rights.workshopArms))return out;
  if(order.status==='ready'){
    out.append(confirmAction('Vendre le dossier',`Créditer ${rpAmount(opsPrices[order.kind][1])} ? La vente clôture le dossier.`,
      {action:'work_sell',id:order.id},'Vente inscrite en trésorerie.'));
    if(order.kind!=='virus'&&shipping){
      const dest=convoyDestinations(optionsList([]),operationalSites()),quantity=convoyQuantity(),
        {field,input}=convoyNote(`message-${order.id}`),{tally}=convoyCost(quantity);
      out.append(opsForm('Programmer un convoi RP',[
        radioField(`dest-${order.id}`,'Laboratoire de destination',dest),radioField(`qty-${order.id}`,'Quantité à envoyer',quantity),field,tally],
        'Payer et ouvrir le convoi',submit=>command('action',
          {action:'work_stage',id:order.id,destination:dest.value,quantity:quantity.valueAsNumber,message:input.value},
          'Convoi RP payé et créé.',submit)));
    }else if(order.kind!=='virus')out.append(button('Commander et expédier',()=>go('stocks')));
  }else if(order.status==='convoy'&&shipping){
    out.append(confirmAction('Réceptionner le convoi RP',`Confirmer l’arrivée de ${order.quantity} entrée(s) à ${order.destination} ?`,
      {action:'work_deliver',id:order.id},'Dotation RP ajoutée au registre du site.'));
  }
  return out;
}
function renderWorkshop(root,kind){
  const titles={virus:'Mélanger les virus',weapons:'Création des armes',bio:'Créations biologiques'};
  const descriptions={
    virus:'Associe deux souches fictives de Resident Evil ou cartes de scénario pour créer un dossier de campagne. Le mélange est uniquement narratif.',
    weapons:'Crée un bon de dotation pour une réplique de jeu. La fabrication, la vente et le transport sont uniquement des statuts de campagne.',
    bio:'Crée un dossier scénarisé Tyrant, Hunter ou Nemesis et assigne-le à un site fictif. Aucun plan ou protocole de fabrication.'
  };
  const site=locationOptions(researchPick),reusable=kind==='weapons'?dotationNameField(`work-${kind}-name`):null;
  const name=reusable?.input??textInput('Nom de dossier unique',55),plan=optionsList(opsPlans[kind].map(value=>[value,value]));
  name.required=true;name.minLength=3;
  const canon=campaign.virusCards??[];
  const left=virusCardSelect(canon,opsSignals,canon[0]??'Écho'),right=virusCardSelect(canon,opsSignals,canon[1]??'Prisme');
  const fields=[radioField(`work-${kind}-site`,'Laboratoire',site),reusable?.field??radioField(`work-${kind}-name`,'Désignation',name)];
  if(kind==='virus')fields.push(radioField('work-left','Souche ou carte A',left),radioField('work-right','Souche ou carte B',right));
  else fields.push(radioField(`work-${kind}-plan`,'Type de dossier RP',plan));
  const cost=opsPrices[kind][0];
  const form=opsForm('Ouvrir un dossier',fields,`Créer · ${rpAmount(cost)}`,submit=>{
    const data={action:'work_create',kind,site:site.value,name:name.value,plan:plan.value};
    if(kind==='virus'){
      if(left.value===right.value){notice('Choisis deux cartes différentes.');right.focus();return;}
      Object.assign(data,{left:left.value,right:right.value});
    }
    void command('action',data,'Création RP enregistrée et débitée.',submit);
  });
  const orders=(campaign.operations?.orders??[]).filter(order=>order.kind===kind);
  const currentOrders=orders.filter(order=>!isClosedLogistics(order));
  const containment=(campaign.operations?.stock??[]).filter(item=>item.kind==='bio');
  const canonSource=label('a','Encyclopédie officielle de Resident Evil (Capcom)','archive-reference');
  canonSource.href='https://game.capcom.com/residentevil/en/exfile.html';
  canonSource.target='_blank';canonSource.rel='noopener noreferrer';
  root.replaceChildren(heading(`ATELIERS / ${kind==='virus'?'RECHERCHE':kind==='bio'?'DOSSIERS DE SUJETS':'DOTATIONS'}`,titles[kind],descriptions[kind]),
    balanceCard(),form,...(kind==='virus'?[make('details','archive-entry ops-codex',
      label('summary','Catalogue des souches fictives et sites de recherche RP'),
      make('div','archive-biography',
        ...(canon.length?[label('p',canon.join(' · ')),make('p','',canonSource)]:[]),
        label('p','Cartes de scénario disponibles en complément :'),
        make('ul','',...opsSignals.map((signal,i)=>label('li',`${signal} : ${['retour d’un souvenir','reflet changeant','trace indéchiffrable','passage oublié','identité trouble','archive scellée','message interrompu','point de bascule'][i]}`))),
        button('Voir les sites de recherche RP',()=>go('research-sites'))))]:[]),
    label('h2','Registre des dossiers','ops-section-title'),
    currentOrders.length?make('div','desk-grid ops-grid',...currentOrders.map(order=>orderCard(order))):empty('Aucun dossier enregistré dans cet atelier.'),
    ...(kind==='virus'?[]:[closedOrdersDisclosure(root,'Historique des bons clôturés',orders.filter(isClosedLogistics),'Aucun bon clôturé.')]),
    ...(kind==='bio'?[label('h2','Registre de confinement par laboratoire','ops-section-title'),
      containment.length?make('div','roster',...containment.map(item=>logRow(item.name,`${item.quantity} · ${item.lab}`,item.model))):
        empty('Aucun dossier de confinement réceptionné.')]:[]),refreshButton());
}
function stockTransferForm(sites,stock){
  const sources=sites.filter(site=>site.id!=='B01'&&stock.some(item=>item.lab===site.id&&item.quantity>0));
  if(!sources.length)return empty('Aucun objet en stock à expédier depuis les armureries ouvertes.');
  const site=optionsList(sources.map(place=>[place.id,`${place.id} · ${place.name}`]));
  const model=optionsList([]),dest=optionsList([]),quantity=convoyQuantity();
  const available=label('p','','minor convoy-availability');available.id='stock-transfer-availability';
  quantity.setAttribute('aria-describedby',available.id);
  const {field,input}=convoyNote('stock-transfer-message'),{tally,update}=convoyCost(quantity);
  const company=dotationNameField('stock-transfer-company',true);
  function pick(){
    const count=stock.find(item=>item.lab===site.value&&item.model===model.value)?.quantity??0;
    available.textContent=`Disponible au départ : ${count}`;
    quantity.max=String(Math.min(40,count));
    if(quantity.valueAsNumber>Number(quantity.max))quantity.value=quantity.max;
    update();
  }
  function fill(){
    model.replaceChildren(...optionsList(stock.filter(item=>item.lab===site.value&&item.quantity>0)
      .map(item=>[item.model,item.name])).children);
    convoyDestinations(dest,sites.filter(place=>place.id!==site.value));
    pick();
  }
  site.addEventListener('change',fill);model.addEventListener('change',pick);fill();
  return opsForm('Expédier des objets en stock',[
    radioField('stock-transfer-source','Armurerie de départ',site),radioField('stock-transfer-model','Objet à envoyer',model),
    radioField('stock-transfer-destination','Laboratoire de destination',dest),
    radioField('stock-transfer-quantity','Quantité à envoyer',quantity),available,company.field,field,tally,
  ],'Expédier le convoi RP',submit=>command('action',{
    action:'stock_stage',site:site.value,model:model.value,destination:dest.value,quantity:quantity.valueAsNumber,
    message:input.value,company:company.input.value.trim(),
  },'Convoi créé. Les objets sont en transit.',submit));
}
function stockUseButton(model,quantity,apply){
  const control=button('Utiliser',()=>stockUsePrompt(control,model,apply),'secondary stock-use-button');
  function update(available){
    control.textContent=available>0?'Utiliser':'Épuisé';
    control.disabled=available<=0;
    control.setAttribute('aria-label',available>0?`Utiliser : ${model}`:`Épuisé : ${model}`);
  }
  update(quantity);
  return {control,update};
}
function stockUsePrompt(origin,model,apply){
  const dialog=$('stock-use-dialog');
  if(dialog.open||busy||current!=='workspace'||!origin.isConnected)return;
  const title=label('h2','Enregistrer une utilisation RP');title.id='stock-use-title';
  const item=label('p',model,'stock-use-name');item.setAttribute('data-ui-original','');
  const info=label('p','Une unité de cet objet sera retirée du stock de cette armurerie.','minor');
  info.id='stock-use-description';
  const feedback=label('p','','minor');feedback.setAttribute('role','status');
  const no=button('Annuler',()=>dialog.close());
  const yes=button('Retirer 1 unité',async()=>{
    if(busy||!origin.isConnected)return;
    const session=token;
    busy=true;yes.disabled=no.disabled=true;
    try{
      const focusAfter=await apply();
      if(token!==session||current!=='workspace'||!dialog.open)return;
      dialog.close();
      const focus=focusAfter?.();
      if(focus?.isConnected)focus.focus({preventScroll:true});
      notice('Utilisation enregistrée : 1 unité retirée.');playSfx('send');
    }catch(error){
      if(dialog.open&&session===token){
        feedback.textContent=toastText[error.message]??toastText.unavailable;
        playSfx('denied');
      }
    }finally{
      busy=false;
      no.disabled=false;
      yes.disabled=!(origin.isConnected&&!origin.disabled);
      if(dialog.open)(yes.disabled?no:feedback.textContent?no:yes).focus();
    }
  },'primary');
  dialog.oncancel=event=>{if(busy)event.preventDefault();};
  dialog.replaceChildren(title,item,info,feedback,make('div','ops-actions',no,yes));
  dialog.showModal();no.focus();
}
function renderStocks(root){
  root.querySelector('.armory-panel')?.releaseArmory?.();
  const all=(campaign.operations?.orders??[]).filter(order=>order.kind!=='virus');
  const ready=all.filter(order=>order.status==='ready'),inTransit=all.filter(order=>order.status==='convoy');
  const delivered=all.filter(order=>order.status==='delivered').sort((a,b)=>(b.receivedAt??'').localeCompare(a.receivedAt??'')).slice(0,12);
  const stock=(campaign.operations?.stock??[]).filter(item=>item.kind==='weapons');
  const sites=operationalSites();
  const openSites=new Set([...root.querySelectorAll('.stock-site[data-stock-site][open]')].map(details=>details.dataset.stockSite));
  const groups=sites.filter(site=>site.id!=='B01').map(site=>{
    const items=stock.filter(item=>item.lab===site.id).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
    const count=items.reduce((total,item)=>total+item.quantity,0);
    const rows=items.map(item=>{
      const row=logRow(item.name,String(item.quantity),'Dotation RP');
      row.dataset.stockModel=item.model;
      if(campaign.rights.stockUse){
        const {control}=stockUseButton(item.name,item.quantity,async()=>{
          const session=token;
          const {campaign:updated}=await api('action',{action:'stock_use',site:site.id,model:item.model,
            expectedQuantity:item.quantity,confirmed:true});
          if(token!==session||current!=='workspace'||activeTab!=='stocks')return;
          receiveCampaign(updated);renderStocks(root);
          return ()=>{
            const section=root.querySelector(`[data-stock-site="${site.id}"]`);
            const next=[...section.querySelectorAll('[data-stock-model]')].find(entry=>entry.dataset.stockModel===item.model)
              ?.querySelector('button:not(:disabled)');
            return next??section.querySelector('summary');
          };
        });
        row.append(control);
      }
      return row;
    });
    const details=make('details','archive-entry stock-site',make('summary','',label('strong',`${site.id} · ${site.name}`),
      label('span',`Objets en stock : ${count}`,'minor')),
      make('div','archive-biography',items.length?make('div','roster',...rows):
        empty('Cette armurerie ne contient aucun objet.')));
    details.dataset.stockSite=site.id;details.open=openSites.has(site.id);
    return details;
  });
  if(campaign.rights.council){
    const body=make('div','archive-biography');
    const guarded=make('details','archive-entry stock-site',
      make('summary','',label('strong','B01 · Bastion'),label('span','Accès protégé','minor')),body);
    guarded.addEventListener('toggle',()=>{
      if(guarded.isConnected&&guarded.open&&!body.firstChild)body.append(armoryPanel('stocks'));
      if(!guarded.open){body.firstElementChild?.releaseArmory?.();body.replaceChildren();}
    });
    groups.push(guarded);
  }
  const section=(title,orders,none)=>[
    label('h2',title,'ops-section-title'),
    orders.length?make('div','desk-grid ops-grid',...orders.map(order=>orderCard(order,true))):empty(none),
  ];
  root.replaceChildren(heading('LOGISTIQUE / DOTATIONS REDCLIFF','Armureries & convois',
    'Consulte le stock de chaque site, prépare un convoi RP et joins un message pour le laboratoire de destination.'),
    label('h2','Stocks par armurerie','ops-section-title'),make('div','stock-sites',...groups),
    ...(campaign.rights.workshopArms?[label('h2','Nouvel envoi','ops-section-title'),balanceCard(),stockTransferForm(sites,stock)]:[]),
    ...section('Convois en transit',inTransit,'Aucun convoi en transit.'),
    ...section('Commandes à expédier',ready,'Aucune commande à expédier.'),
    label('h2','Historique logistique','ops-section-title'),...logisticsHistoryReset(),
    closedOrdersDisclosure(root,'Derniers convois réceptionnés',delivered,'Aucun convoi réceptionné.'),refreshButton());
}
function renderIndustry(root){
  const catalogue=campaign.operations?.industrialCatalog??[];
  const families=[...new Set(catalogue.map(item=>item.category))];
  const initial=families.find(family=>family.startsWith('Tenues'))??families[0];
  const category=optionsList(families.map(name=>[name,name]),initial);
  const model=optionsList([]);
  const description=label('p','','minor');
  function pick(){
    const active=catalogue.find(item=>item.name===model.value);
    description.textContent=active?`Origine : ${active.origin}. Entrée numérique uniquement.`:'';
  }
  function fill(){
    const available=catalogue.filter(item=>item.category===category.value);
    model.replaceChildren(...optionsList(available.map(item=>[item.name,item.name])).children);
    pick();
  }
  category.addEventListener('change',fill);model.addEventListener('change',pick);
  fill();
  const site=locationOptions(),name=dotationNameField('industry-name');
  const form=opsForm('Créer un bon de dotation RP',[
    radioField('industry-category','Famille d’équipement',category),radioField('industry-model','Modèle du catalogue',model),
    radioField('industry-site','Site de départ',site),name.field,description,
  ],`Enregistrer · ${rpAmount(opsPrices.weapons[0])}`,submit=>command('action',
    {action:'work_create',kind:'weapons',industry:true,site:site.value,name:name.input.value,plan:model.value},
    'Bon industriel enregistré. Le convoi et la réception sont disponibles ci-dessous.',submit));
  const orders=(campaign.operations?.orders??[]).filter(o=>o.industry);
  const currentOrders=orders.filter(order=>!isClosedLogistics(order));
  root.replaceChildren(heading('UMBRELLA INDUSTRIES / DOTATIONS REDCLIFF','Industrie de l’armement',
    'Gère les répliques, tenues, casques, masques et accessoires de Redcliff. Ces objets n’existent que dans l’inventaire du jeu ; aucune fabrication réelle ni certification.'),
    balanceCard(),form,make('div','ops-actions',button('Voir les armureries et convois',()=>go('stocks')),
      ...(campaign.rights.council?[button('Ouvrir l’armurerie du Bastion',()=>go('council'))]:[])),
    label('h2','Bons industriels et convois','ops-section-title'),
    currentOrders.length?make('div','desk-grid ops-grid',...currentOrders.map(o=>orderCard(o,true))):empty('Aucun bon industriel en cours.'),
    label('h2','Historique logistique','ops-section-title'),...logisticsHistoryReset(),
    closedOrdersDisclosure(root,'Historique des bons clôturés',orders.filter(isClosedLogistics),'Aucun bon clôturé.'),refreshButton());
}
function renderMarket(root){
  const service=optionsList(opsMarket.map(([id,name,price])=>[id,`${name} · ${rpAmount(price)}`]));
  const reference=textInput('Référence ou nom d’intrigue',65);reference.required=true;
  const form=opsForm('Ouvrir une liaison RP',[
    radioField('market-service','Service de scénario',service),radioField('market-reference','Référence fictive',reference)
  ],'Payer et transmettre',submit=>command('action',{action:'market_order',service:service.value,reference:reference.value},
    'Commande débitée. La réponse de The Connections est dans ta boîte RP.',submit));
  const orders=campaign.operations?.market??[];
  const sellable=(campaign.operations?.orders??[]).filter(o=>o.status==='ready'&&o.canManage);
  root.replaceChildren(heading('MARCHÉ PARALLÈLE / CANAL DE SCÉNARIO','Black Market',
    'Commande un service RP ou vends un dossier à The Connections. Aucun échange ni paiement n’a lieu en dehors du site.'),
    balanceCard(),form,button('Lire les réponses dans ma boîte RP',()=>enterRadio('mail')),
    label('h2','Dossiers à vendre','ops-section-title'),
    sellable.length?make('div','desk-grid ops-grid',...sellable.map(o=>{
      const offer=card(o.name,orderReference(o),
        confirmAction('Vendre à The Connections',`Créditer ${rpAmount(opsPrices[o.kind][1])} à Umbrella ?`,
          {action:'work_sell',id:o.id,buyer:'connections'},'Vente confirmée. La trésorerie est créditée et le reçu est dans ta boîte RP.'));
      offer.querySelector('h2').setAttribute('data-ui-original','');
      return offer;
    })):empty('Crée un dossier dans un atelier pour le proposer ici.'),
    label('h2','Mes échanges','ops-section-title'),
    orders.length?make('div','roster',...orders.map(item=>logRow(item.title,`${item.direction==='credit'?'+':'−'} ${rpAmount(item.amount)}`,`${item.id} · ${item.reference} · ${date(item.time)}`))):empty('Aucun échange enregistré.'));
}
function renderBiohazard(root){
  const list=(opsPulse?.alerts??[]).slice().reverse();
  const host=heading('SÉCURITÉ / CONFINEMENT REDCLIFF','Alertes BIOHAZARD',
    'Les alertes de scène s’affichent sur toutes les sessions connectées. Un niveau I à X décrit la gravité dans le RP.');
  const content=[host];
  if(campaign.rights.incident){
    const site=locationOptions(mapPick),zone=optionsList([]),kind=optionsList(incidentKinds.map(([id,name])=>[id,name]));
    const level=optionsList(romanLevels.map((name,i)=>[String(i+1),name]),'2');
    function fillSectors(){
      const sectors=(campaign.siteSectors?.[site.value]??[]).filter(item=>!['G','H'].includes(item.id));
      zone.replaceChildren(...optionsList(sectors.map(item=>[item.id,`${item.id} · ${item.name}`])).children);
    }
    site.addEventListener('change',fillSectors);
    kind.addEventListener('change',()=>level.value=String(incidentKinds.find(row=>row[0]===kind.value)[2]));
    fillSectors();
    const form=opsForm('Déclarer une alerte de campagne',[
      radioField('bio-site','Laboratoire',site),radioField('bio-sector','Secteur',zone),
      radioField('bio-kind','Type d’incident',kind),radioField('bio-level','Niveau I à X',level)
    ],'Préparer la diffusion',submit=>{
      form.querySelector('.operation-confirm')?.remove();
      const data={action:'bio_alert',site:site.value,sector:zone.value,kind:kind.value,level:Number(level.value)};
      const yes=button('Diffuser à toutes les sessions',()=>command('action',data,'Alerte BIOHAZARD diffusée.',yes),'primary');
      const confirm=make('div','operation-confirm',label('p',`${site.selectedOptions[0]?.textContent} / ${zone.selectedOptions[0]?.textContent} · Niveau ${romanLevels[data.level-1]}`,'minor'),
        yes,button('Annuler',()=>{confirm.remove();submit.focus();}));
      form.append(confirm);yes.focus();
    });
    content.push(form);
  }
  const rows=list.map(item=>{
    const entry=card(bioTitle(item),pill(item.active?bioDanger(item):'CONFINEMENT LEVÉ',!item.active),
      label('p',`${item.kind} · ${item.sectorName} · ${date(item.time)}`,'minor'));
    if(hasAccess('field-map'))entry.append(button('Voir sur la carte',()=>{mapPick=item.site;go('field-map');}));
    if(item.active&&campaign.rights.councilManage)entry.append(confirmAction('Lever le confinement',
      `${item.site} / ${item.sector} : fermer cette alerte et conserver son historique ?`,
      {action:'bio_resolve',id:item.id},'Confinement RP levé.'));
    return entry;
  });
  root.replaceChildren(...content,label('h2','Journal des incidents','ops-section-title'),
    rows.length?make('div','desk-grid ops-grid',...rows):empty('Aucune alerte BIOHAZARD enregistrée.'));
}
async function renderCouncilRoster(root){
  const groups=[
    ['direction','Direction suprême et fondateurs'],
    ['principal','Chercheurs principaux et avancés'],
    ['research','Registre des chercheurs'],
    ['security','Agents de sécurité habilités']
  ];
  const session=token, pane=make('div','ops-console',label('p','Lecture du registre classé…','minor'));
  root.replaceChildren(heading('CONSEIL DE SÉCURITÉ / HABILITATION 05','Registre privé du Conseil',
    'Réservé à James Marcus et Oswell E. Spencer. Les codes d’accès et les sièges censurés de Blackwater ne figurent pas dans ce registre.'),
    pane);
  const stillHere=()=>session===token&&activeTab==='council-roster'&&pane.isConnected;
  try{
    const {people}=await api('council-roster');
    if(!stillHere())return;
    const search=textInput('Nom, matricule ou fonction',80,'search');
    const group=optionsList([['','Toutes les catégories'],...groups.map(([key,title])=>[key,`${title} (${people.filter(p=>p.registry===key).length})`])]);
    const status=label('p','','minor mono');status.setAttribute('role','status');
    const list=make('div','');
    function draw(){
      const query=normalized(search.value).split(/\s+/).filter(Boolean);
      let total=0;
      const sections=groups.flatMap(([key,title])=>{
        if(group.value&&group.value!==key)return [];
        const found=people.filter(p=>p.registry===key&&query.every(term=>
          normalized(`${p.matricule??p.id} ${p.name} ${p.division} ${p.level===null?(p.roleCode??'SEC'):`Niveau ${p.level}`}`).includes(term)));
        if(!found.length)return [];
        total+=found.length;
        const roster=make('div','roster',...found.map(p=>make('div','direction-person',
          make('div','',label('strong',p.name),label('p',`${p.matricule??p.id} · ${p.level===null?(p.roleCode??'SEC'):`Niveau ${p.level}`}`,'mono minor'),label('p',p.division,'minor')))));
        return [make('section','',label('h2',`${title} · ${found.length}`,'ops-section-title'),roster)];
      });
      status.textContent=`${total} / ${people.length} fiches affichées`;
      list.replaceChildren(...(sections.length?sections:[empty('Aucun matricule correspondant.')]));
    }
    search.addEventListener('input',draw);group.addEventListener('change',draw);
    pane.replaceChildren(make('div','ops-fields',radioField('council-roster-search','Rechercher dans le registre',search),
      radioField('council-roster-group','Catégorie',group)),status,list);
    draw();
  }catch(error){
    if(stillHere())pane.replaceChildren(label('p',toastText[error.message]??toastText.unavailable,'minor'),
      button('Réessayer',()=>renderCouncilRoster(root)));
  }
}
function renderSanctions(root){
  const subject=optionsList((campaign.operations?.subjects??[]).map(p=>[p.id,`${p.name} · ${p.matricule??p.id}`]));
  const kind=optionsList([['warning','Avertissement'],['suspension','Suspension de la recherche']]);
  const article=optionsList(charterChapters.flatMap(row=>row[2]).filter(item=>sanctionArticles.has(item[0])).map(item=>[item[0],`${item[0]} · ${item[1]}`]),'L-321');
  const reason=textArea('Décris le contexte et la décision RP.',950);reason.required=true;
  const form=opsForm('Rédiger une notification RP',[
    radioField('discipline-target','Personnel',subject),radioField('discipline-action','Décision',kind),
    radioField('discipline-article','Article de la charte',article),radioField('discipline-reason','Motif',reason)
  ],'Préparer la sanction',submit=>{
    form.querySelector('.operation-confirm')?.remove();
    const data={action:'discipline',target:subject.value,kind:kind.value,article:article.value,reason:reason.value};
    const yes=button('Notifier le destinataire',()=>command('action',data,'Décision enregistrée et envoyée en mail RP.',yes),'primary');
    const confirm=make('div','operation-confirm',label('p',`${kind.selectedOptions[0].text} · ${subject.selectedOptions[0].text} · ${article.value}`,'minor'),
      yes,button('Annuler',()=>{confirm.remove();submit.focus();}));
    form.append(confirm);yes.focus();
  });
  const sanctions=(campaign.operations?.sanctions??[]).map(item=>{
    const row=card(`${item.subjectName} · ${item.target}`,pill(item.lifted?'LEVÉE':item.title,item.lifted),
      label('p',`${item.id} · ${item.article} · ${item.by} · ${date(item.time)}`,'minor'),label('p',item.reason,'message-copy'));
    if(item.kind==='suspension'&&!item.lifted)row.append(confirmAction('Lever la suspension',
      'Rétablir les droits de recherche RP et envoyer un nouvel avis privé ?',
      {action:'discipline_lift',id:item.id},'Suspension levée et avis envoyé.'));
    return row;
  });
  root.replaceChildren(heading('CONSEIL DE SÉCURITÉ / JAMES MARCUS & OSWELL','Gestion des sanctions',
    'Décisions réservées aux deux présidents. Les sanctions restent privées ; le destinataire reçoit un mail RP et conserve l’accès à sa boîte.'),
    form,label('h2','Registre disciplinaire','ops-section-title'),
    sanctions.length?make('div','desk-grid ops-grid',...sanctions):empty('Aucune nouvelle décision consignée dans ce registre.'),refreshButton());
}
function renderBlackwater(root){
  const choices=[['brief','Mandat'],['projects','Projets classés'],['channel','Canal privé']];
  const tabs=choices.map(([id,title])=>{
    const node=button(title,()=>{blackwaterTab=id;renderBlackwater(root);root.querySelector(`[data-bw="${id}"]`)?.focus();},'secondary');
    node.dataset.bw=id;node.setAttribute('aria-pressed',String(id===blackwaterTab));return node;
  });
  const pages={
    brief:()=>make('div','',card('Bureau des séances',label('p','Le Conseil Blackwater tient son propre canal et ses propres dossiers. Ses décisions ne modifient pas les habilitations du Conseil de Sécurité.'),
      label('p','Les six sièges sous censure ne publient pas de matricule nominatif dans l’annuaire général.','minor')),
      organizationBiography('blackwater',campaign.operations?.blackwaterBiography)),
    projects:()=>make('div','desk-grid ops-grid',...(campaign.operations?.blackwaterProjects??[]).map(([name,text])=>card(name,label('p',text)))),
    channel:()=>card('Communications Blackwater',label('p','Le serveur réserve le canal aux membres de Blackwater et à la Direction. Il ne remplace pas le canal du Conseil de Sécurité.'),
      button('Rejoindre le canal Blackwater',()=>enterRadio('blackwater'),'primary'))
  };
  root.replaceChildren(heading('BLACKWATER / ACCÈS NOMINATIF','Conseil Blackwater','Espace privé distinct du Conseil de Sécurité et du Bastion.'),
    make('div','blackwater-hero',label('p','BW / CONSEIL INTERNE','tag mono'),label('strong','SESSION AUTORISÉE')),
    make('div','ops-actions blackwater-tabs',...tabs),pages[blackwaterTab]());
}
const opsViews={
  'field-map':renderFieldMap,'research-sites':renderResearchSites,'workshop-virus':root=>renderWorkshop(root,'virus'),
  'workshop-weapons':root=>renderWorkshop(root,'weapons'),'workshop-bio':root=>renderWorkshop(root,'bio'),
  stocks:renderStocks,industry:renderIndustry,market:renderMarket,blackwater:renderBlackwater,briefings:renderBriefings,
  biohazard:renderBiohazard,'council-manage':renderSanctions,'council-roster':renderCouncilRoster,charter:renderCharter,
  pda:root=>renderPda(root)
};
