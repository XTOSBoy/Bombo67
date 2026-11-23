'use strict';
const radioState={channel:'general',rooms:[],revision:undefined,messages:[],mailMode:'inbox',stamp:0,request:0,loading:false,sending:false,directory:null};
function clearPrivateViews(){
  resetMobilization(true);
  resetPdaInventory();
  Object.assign(radioState,{channel:'general',rooms:[],revision:undefined,messages:[],mailMode:'inbox',loading:false,sending:false,directory:null});
  radioState.stamp++;
  for(const id of ['radio','direction','council','research','europe','labs','cryo','security','reports','centers','finance','archive-list',...Object.keys(opsViews)]) $(id).replaceChildren();
  clearOpsSession();
  resetOrganizationViews();
  const dialog=$('council-notice');if(dialog.open)dialog.close();dialog.replaceChildren();
  $('profile-notice').replaceChildren();$('profile-notice').hidden=true;
}
function radioField(id,caption,control){
  control.id=id;
  const prompt=label('label',caption);prompt.htmlFor=id;
  return make('div','field',prompt,control);
}
function textInput(placeholder,max,type='text'){
  const input=make('input','');input.type=type;input.maxLength=max;input.placeholder=placeholder;return input;
}
function textArea(placeholder,max){
  const area=make('textarea','');area.rows=3;area.maxLength=max;area.placeholder=placeholder;return area;
}
function enterRadio(channel){
  if(channel===radioState.channel&&activeTab==='radio')return;
  radioState.channel=channel;
  go('radio');
}
function radioError(error,target=$('radio-status')){
  if(target)target.textContent=toastText[error.message]??toastText.unavailable;
}
function photoButton(message){
  if(!message.photo)return null;
  const frame=make('figure','message-photo');
  const attach=button('Afficher la photo RP',async()=>{
    const channel=radioState.channel,session=token,generation=radioState.stamp;
    attach.disabled=true;
    try{
      const data=await api('radio',{op:'picture',channel,id:message.id});
      if(session!==token||radioState.stamp!==generation||!frame.isConnected)return;
      const image=make('img','');image.alt='Photo RP jointe par '+message.sender.name;
      image.src='data:image/jpeg;base64,'+data.picture;
      frame.replaceChildren(image,label('figcaption','Pièce jointe RP · '+message.sender.name,'minor'));
    }catch(error){if(frame.isConnected)radioError(error);}
    finally{attach.disabled=false;}
  },'text-button');
  frame.append(attach);return frame;
}
function messageCard(m){
  const mail=radioState.channel==='mail',mine=m.mine??m.sender.id===connectedProfile.id;
  const header=make('div','message-meta',label('strong',m.sender.name),
    label('time',date(m.at),'mono minor'));
  header.lastChild.dateTime=m.at;
  const body=make('article',`radio-message${mine?' is-mine':''}`,header);
  if(mail){
    const subject=label('h3',m.subject);subject.setAttribute('data-ui-original','');
    body.append(subject,label('p',`À : ${m.recipient.name} · ${m.recipient.matricule??m.recipient.id}`,'minor'));
  }
  if(m.text)body.append(label('p',m.text,'message-copy'));
  const photo=photoButton(m);if(photo)body.append(photo);
  if(mail&&!mine&&!m.system&&(m.sender.id!=='CEN-000'||m.sender.address))body.append(button('Répondre',()=>{
    $('radio-recipient').value=m.sender.address??m.sender.matricule??m.sender.id;
    $('radio-subject').value=(/^Re : /i.test(m.subject)?m.subject:'Re : '+m.subject).slice(0,90);
    $('radio-body').focus();
  },'text-button'));
  return body;
}
function paintThread(){
  const thread=$('radio-thread');
  if(!thread)return;
  const atEnd=thread.scrollTop+thread.clientHeight+88>=thread.scrollHeight;
  const room=radioState.rooms.find(r=>r.id===radioState.channel);
  const mail=radioState.channel==='mail';
  const messages=mail?[...radioState.messages].reverse().filter(m=>radioState.mailMode==='inbox'
    ?!(m.mine??m.sender.id===connectedProfile.id):(m.mine??m.sender.id===connectedProfile.id)):radioState.messages;
  const empty=room?.status==='maintenance'?'Ce salon est en maintenance. Son historique sera disponible à la réouverture.':
    room?.status==='repairing'?'Réparation en cours. Le salon rouvrira automatiquement.':
    room?.destroyed?'Centre détruit dans le RP. Le canal est fermé et ses messages ont été effacés.':room&&!room.online?'Centre hors ligne. Ce salon est indisponible.':mail
    ?(radioState.mailMode==='inbox'?'Aucun mail RP reçu.':'Aucun mail RP envoyé.')
    :'Aucun message dans ce salon. Lance la conversation.';
  thread.replaceChildren(...(messages.length&&(!room||room.online)?messages.map(messageCard):[label('p',empty,'radio-empty')]));
  if(!mail&&atEnd)thread.scrollTop=thread.scrollHeight;
}
function paintRadioMeta(){
  const links=$('radio-channels');if(!links)return;
  const active=links.contains(document.activeElement)?document.activeElement.dataset.radioRoom:null;
  const mail=radioState.channel==='mail',room=radioState.rooms.find(r=>r.id===radioState.channel);
  const central=$('radio').querySelector('.radio-central');
  const centralRoom=radioState.rooms.find(r=>r.id==='DC-01');
  if(central&&centralRoom)central.disabled=!centralRoom.online||radioState.channel==='DC-01';
  links.replaceChildren(...[...radioState.rooms,{id:'mail',name:'Mails RP',online:true}].map(r=>{
    const b=button('',()=>enterRadio(r.id),'radio-room');
    b.dataset.radioRoom=r.id;
    b.setAttribute('aria-pressed',String(radioState.channel===r.id));
    b.append(label('span',r.id==='general'?'GÉNÉRAL':r.id==='mail'?'BOÎTE RP':r.id==='council'?'CANAL CLASSÉ':r.id,'mono room-number'),
      label('strong',r.name),label('small',r.status==='maintenance'?'Maintenance locale':r.status==='repairing'?'Réparation en cours':
        r.destroyed?'Fermé · messages effacés':r.id==='mail'||r.id==='council'?'Interne':r.online?(r.central?'En ligne · relais principal':'En ligne'):'Hors ligne',
        r.online?'online':r.until?'in-service':'offline'));
    return b;
  }));
  if(active)links.querySelector(`[data-radio-room="${CSS.escape(active)}"]`)?.focus({preventScroll:true});
  $('radio-room-title').textContent=mail?'Mails RP':room?.name??'Connexion au salon…';
  const eta=$('radio-room-eta');
  eta.hidden=!room?.until;
  eta.replaceChildren(...(room?.until?['Réouverture : ',centerClock(room.until)]:[]));
  const purge=room?.lastPurge;
  $('radio-purge').textContent=purge
    ?`Dernière purge : ${date(purge.at)} · ${purge.count} message${purge.count===1?'':'s'} effacé${purge.count===1?'':'s'}.`:'';
  $('radio-purge').hidden=!purge;
  $('radio-fields').disabled=!mail&&!room?.online;
}
function updateRadio(data){
  const wasOnline=radioState.rooms.find(room=>room.id===radioState.channel)?.online;
  const changed=JSON.stringify(radioState.rooms)!==JSON.stringify(data.rooms);
  radioState.rooms=data.rooms;
  if(changed||!$('radio-channels').childElementCount)paintRadioMeta();
  if(data.messages!==null){
    radioState.messages=data.messages;radioState.revision=data.revision;paintThread();
  }else if(wasOnline!==radioState.rooms.find(room=>room.id===radioState.channel)?.online)paintThread();
}
async function refreshRadio(force=false){
  if(activeTab!=='radio'||current!=='workspace'||!token||radioState.loading||radioState.sending||!$('radio-thread'))return;
  const stamp=radioState.stamp,channel=radioState.channel,request=++radioState.request;
  radioState.loading=true;
  try{
    const data=await api('radio',{op:'read',channel,...(force||radioState.revision===undefined?{}:{revision:radioState.revision})});
    if(activeTab==='radio'&&stamp===radioState.stamp&&request===radioState.request)updateRadio(data);
  }catch(error){if(activeTab==='radio'&&stamp===radioState.stamp&&request===radioState.request)radioError(error);}
  finally{if(stamp===radioState.stamp&&request===radioState.request)radioState.loading=false;}
}
async function preparePhoto(file,{maxSide=1080,maxEncoded=160000}={}){
  if(!file)return undefined;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type.toLowerCase())||file.size>10*1024*1024)throw new Error('picture');
  let bitmap;
  try{
    bitmap=await createImageBitmap(file);
    if(bitmap.width*bitmap.height>30_000_000)throw new Error('picture');
    const canvas=make('canvas',''),scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#eee';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const quality of [.84,.7,.56,.42,.3]){
      const encoded=canvas.toDataURL('image/jpeg',quality).split(',')[1];
      if(encoded?.length<=maxEncoded)return encoded;
    }
  }catch{throw new Error('picture');}
  finally{bitmap?.close();}
  throw new Error('picture');
}
function renderRadio(root){
  const stamp=++radioState.stamp;
  Object.assign(radioState,{revision:undefined,messages:[],loading:false,sending:false});
  const mail=radioState.channel==='mail';
  const list=make('div','radio-thread',label('p','Chargement…','radio-empty'));
  list.id='radio-thread';list.setAttribute('aria-label',mail?'Courrier RP':'Historique du salon');list.tabIndex=0;
  const channels=make('nav','radio-channels');channels.id='radio-channels';channels.setAttribute('aria-label','Salons et boîte RP');
  const roomTitle=label('h2',mail?'Mails RP':'Connexion au salon…');roomTitle.id='radio-room-title';
  const purge=label('p','','purge-note');purge.id='radio-purge';purge.hidden=true;
  const status=label('p','','minor radio-status');status.id='radio-status';status.setAttribute('role','status');
  const text=textArea(mail?'Rédige un mail dans le cadre du RP…':'Écris dans le salon…',mail?2500:1200);
  const file=make('input','');file.type='file';file.accept='image/jpeg,image/png,image/webp';
  const send=label('button',mail?'Envoyer le mail RP':'Envoyer le message','primary');send.type='submit';
  const recipient=textInput('Saisis le matricule RP',32),subject=textInput('Objet du mail RP',90);
  const directory=make('datalist','');directory.id='radio-directory';recipient.setAttribute('list',directory.id);recipient.autocomplete='off';
  recipient.required=subject.required=mail;
  const updateDirectory=()=>{
    directory.replaceChildren(...(radioState.directory??[]).filter(person=>person.id!==connectedProfile.id).map(person=>{
      const option=make('option','');option.value=person.matricule??person.id;option.label=person.name;return option;
    }));
  };
  const fields=make('fieldset','radio-fields',
    ...(mail?[make('div','mail-address',radioField('radio-recipient','Destinataire RP',recipient),radioField('radio-subject','Objet',subject)),directory]:[]),
    radioField('radio-body',mail?'Message du mail':'Message du salon',text),
    make('div','radio-compose-bar',radioField('radio-file','Joindre une photo RP',file),send));
  fields.id='radio-fields';fields.disabled=!mail;
  const form=make('form','radio-compose',fields,status);
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(fields.disabled||send.disabled)return;
    if(!text.value.trim()&&!file.files[0]){status.textContent='Écris un message ou joins une photo.';text.focus();return;}
    const channel=radioState.channel,session=token;
    send.disabled=true;radioState.sending=true;radioState.request++;radioState.loading=false;status.textContent='Envoi en cours…';
    try{
      const picture=await preparePhoto(file.files[0]);
      if(session!==token||stamp!==radioState.stamp||activeTab!=='radio'||current!=='workspace')return;
      const result=await api('radio',{op:'send',channel,text:text.value,picture,
        ...(mail?{subject:subject.value,recipient:recipient.value}:{})});
      if(session!==token||stamp!==radioState.stamp||activeTab!=='radio'||current!=='workspace')return;
      form.reset();if(mail){radioState.mailMode='outbox';paintMailButtons();}
      updateRadio(result);status.textContent=mail?'Mail RP envoyé.':'Message envoyé.';playSfx('send');
    }catch(error){
      if(session===token&&stamp===radioState.stamp&&current==='workspace'){radioError(error,status);playSfx('denied');}
    }finally{send.disabled=false;if(stamp===radioState.stamp){radioState.sending=false;void refreshRadio();}}
  });
  const inbox=button('Reçus',()=>{radioState.mailMode='inbox';paintMailButtons();paintThread();},'secondary');
  const outbox=button('Envoyés',()=>{radioState.mailMode='outbox';paintMailButtons();paintThread();},'secondary');
  function paintMailButtons(){
    inbox.setAttribute('aria-pressed',String(radioState.mailMode==='inbox'));
    outbox.setAttribute('aria-pressed',String(radioState.mailMode==='outbox'));
  }
  paintMailButtons();
  const central=campaign.centers.find(center=>center.id==='DC-01');
  const openCentral=central?button('Ouvrir DC-01 · Relais central',()=>enterRadio('DC-01'),'secondary radio-central'):null;
  if(openCentral)openCentral.disabled=!central.online||radioState.channel==='DC-01';
  const eta=label('p','','minor radio-room-eta');eta.id='radio-room-eta';eta.hidden=true;
  root.replaceChildren(heading('UMB.NET / RÉSEAU DE CAMPAGNE','Communications','Salons de discussion, photos et mails vers les matricules RP. Aucun message n’est envoyé à une adresse e-mail réelle.'),
    make('div','scene-cover scene-servers',label('span','POSTE DE LIAISON · REDCLIFF','mono tag')),
    ...(openCentral?[openCentral]:[]),
    label('p','Salon visible aux joueurs habilités. Mails réservés à l’expéditeur et au destinataire sur le site, sans chiffrement de bout en bout. Ne publie pas de données personnelles.','minor radio-warning'),
    make('div','radio-layout',channels,make('div','radio-main',make('div','radio-room-head',roomTitle,
      eta,...(mail?[make('div','mail-tabs',inbox,outbox)]:[])),purge,list,form)));
  paintRadioMeta();void refreshRadio(true);
  if(mail){
    if(radioState.directory)updateDirectory();
    else api('radio',{op:'directory'}).then(data=>{
      if(radioState.stamp===stamp){radioState.directory=data.recipients;updateDirectory();}
    }).catch(error=>{if(radioState.stamp===stamp)radioError(error,status);});
  }
}
setInterval(()=>{if(!document.hidden)void refreshRadio();},3500);

function sameCurfewSchedule(left,right){
  return Boolean(left&&right&&left.configured===right.configured&&left.enabled===right.enabled&&left.start===right.start&&left.end===right.end);
}
function paintCurfewStatus(target=$('direction-curfew-state')){
  if(!target)return;
  const schedule=campaign.curfew;
  const line=schedule?.configured
    ?`${schedule.enabled?'Dispositif armé':'Plage enregistrée · dispositif désactivé'} · ${schedule.start} à ${schedule.end}${schedule.end<schedule.start?' le lendemain':''} (Paris).`
    :'Aucune plage horaire enregistrée.';
  if(target.textContent!==line)target.textContent=line;
}
function directionCurfewCard(){
  const schedule=campaign.curfew;
  const status=label('p','','mono');status.id='direction-curfew-state';status.setAttribute('role','status');
  paintCurfewStatus(status);
  const host=make('div','');
  const trigger=button(schedule?.configured?'Modifier la plage horaire':'Programmer la plage horaire',()=>{
    const start=make('input',''),end=make('input','');
    start.type=end.type='time';start.required=end.required=true;
    start.value=schedule?.configured?schedule.start:'00:00';end.value=schedule?.configured?schedule.end:'15:30';
    const save=label('button','Enregistrer les horaires',schedule?.enabled?'primary':'secondary');
    const enable=label('button','Enregistrer et activer','primary');
    save.type=enable.type='submit';
    const form=make('form','operation-confirm curfew-form',
      make('div','ops-fields',radioField('curfew-start','Heure de début',start),radioField('curfew-end','Heure de fin',end)),
      label('p','Si la fin précède le début, le couvre-feu se termine le lendemain. Si la plage active inclut l’heure actuelle, le verrouillage est immédiat.','minor'),
      make('div','ops-actions',save,...(schedule?.enabled?[]:[enable]),button('Annuler',()=>{host.replaceChildren(trigger);trigger.focus();})));
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const activate=event.submitter===enable;
      void command('action',{action:'curfew_set',start:start.value,end:end.value,confirmed:true,...(activate?{activate:true}:{})},
        activate||schedule?.enabled?'Horaires enregistrés. Le couvre-feu est programmé.':'Horaires enregistrés. Le couvre-feu reste désactivé.',event.submitter??save);
    });
    host.replaceChildren(form);start.focus();
  });
  host.append(trigger);
  const activate='Activer le couvre-feu';
  const activation=schedule?.enabled
    ?confirmAction('Désactiver le dispositif','Désactiver la répétition quotidienne sans effacer la plage enregistrée ?',
      {action:'curfew_lift',confirmed:true},'Dispositif désactivé.')
    :schedule?.configured
      ?confirmAction(activate,'Tout le personnel, y compris le niveau 5, sera bloqué pendant cette plage quotidienne. Si elle inclut l’heure actuelle, le blocage commence dès la confirmation.',
        {action:'curfew_enable',confirmed:true},'Dispositif armé pour la plage enregistrée.')
      :make('div','',label('button',activate,'secondary'));
  if(!schedule?.configured){const unavailable=activation.querySelector('button');unavailable.type='button';unavailable.disabled=true;}
  const panel=card('Maintenance générale et couvre-feu',status,
    label('p','Programme une plage quotidienne en heure de Paris. Le site se verrouille au début et rouvre automatiquement à la fin. Modifier les horaires ne change pas l’état d’activation.','minor'),
    host,activation);
  panel.id='direction-curfew';panel.classList.add('site-maintenance-control');
  return panel;
}

function renderDirection(root){
  const session=token,canvas=make('div','direction-main',label('p','Lecture du registre…','minor'));
  const maintenance=card('Maintenance générale manuelle',
    label('p','Cette commande suspend tout le site pour la durée choisie. Pour interrompre un seul canal, utilise les commandes de son data center.','minor'),
    maintenanceControl('Sonner la maintenance générale','Les connexions, les communications et les activités de toute la campagne seront suspendues. Aucune donnée ne sera supprimée.',
      {action:'site_maintenance'},'Maintenance générale sonnée.'));
  maintenance.classList.add('site-maintenance-control');
  root.replaceChildren(heading('DIRECTION / HABILITATION 05','Registre Direction','Registre classé : personnel RP, contrôle des accès, notes internes et traçabilité des purges. Accès réservé aux deux chefs.'),
    renderHighCouncilCard(),directionCurfewCard(),maintenance,canvas);
  const stillHere=()=>session===token&&activeTab==='direction'&&canvas.isConnected;
  const feedback=label('p','','minor');feedback.setAttribute('role','status');
  const draw=data=>{
    if(!stillHere())return;
    const lookup=textInput('Nom, matricule ou division',70,'search');
    const roster=make('div','roster direction-roster');
    const paintRoster=()=>{
      const query=normalized(lookup.value);
      const records=data.roster.filter(p=>normalized(`${p.name} ${p.matricule??p.id} ${p.division} ${p.group} ${p.status??''}`).includes(query));
      roster.replaceChildren(...(records.length?records.map(p=>make('div','direction-person',
          make('div','',label('strong',p.name),label('p',`${p.matricule??p.id} · ${p.id.startsWith('DOS-')?'Dossier non jouable':p.level===null?(p.roleCode??'SEC'):`Niveau ${p.level}`}`,'mono minor'),
            label('p',p.division,'minor'),...(p.status?[label('p',p.status,'lost-status')]:[])))):[empty('Aucun matricule correspondant.')]));
    };
    lookup.addEventListener('input',paintRoster);paintRoster();
    const title=textInput('Titre de la note',90),copy=textArea('Consigne ou élément de scénario…',1800);
    title.required=copy.required=true;
    const add=label('button','Verser au registre','primary');add.type='submit';
    const form=make('form','direction-form',radioField('direction-title','Titre de la note',title),
      radioField('direction-copy','Note classée RP',copy),add,feedback);
    form.addEventListener('submit',async event=>{
      event.preventDefault();add.disabled=true;
      try{
        const updated=await api('direction',{op:'note',title:title.value,text:copy.value});
        if(stillHere()){draw(updated);feedback.textContent='Note versée au registre Direction.';playSfx('send');}
      }catch(error){if(stillHere()){radioError(error,feedback);playSfx('denied');}}
      finally{add.disabled=false;}
    });
    const notes=data.notes.map(n=>{
      const title=label('strong',n.title);title.setAttribute('data-ui-original','');
      return make('details','archive-entry',make('summary','',title),
        make('div','archive-biography',label('p',`${n.by} · ${date(n.at)}`,'minor'),label('p',n.text,'message-copy')));
    });
    canvas.replaceChildren(make('div','direction-counters',
      card('Personnel RP',label('p',String(data.roster.length),'count-stat mono')),
      card('Notes classées',label('p',String(data.notes.length),'count-stat mono')),
      card('Purges consignées',label('p',String(data.purges.length),'count-stat mono'))),
    card('Notes de la Direction',form,make('div','archive-list',...(notes.length?notes:[empty('Aucune note classée.')]))),
    card('Journal des salons',make('div','roster',...(data.purges.length?data.purges.map(p=>logRow(`${p.channel} · ${p.reason}`,`${p.count} effacé(s)`,`${p.by} · ${date(p.at)}`)):[empty('Aucune purge de salon consignée.')]))),
    card('Registre du personnel',
      label('p','Profils, habilitations et statuts RP. Aucun code de connexion n’est affiché.','minor'),
      radioField('direction-filter','Rechercher dans le personnel',lookup),roster));
  };
  api('direction',{op:'read'}).then(draw).catch(error=>{if(stillHere())radioError(error,canvas);});
}

const councilDialog=$('council-notice');
councilDialog.addEventListener('cancel',event=>event.preventDefault());
function showCouncilNotice(){
  const record=campaign?.notice,profile=$('profile-notice');
  if(!record){profile.hidden=true;profile.replaceChildren();return;}
  profile.hidden=false;
  profile.className='profile-disciplinary';
  profile.replaceChildren(label('p',record.reference,'mono tag'),label('h2',record.subject),
    label('p',record.text),label('p',record.boundary,'minor'),
    button(record.seen?'Relire l’avis du Conseil':'Ouvrir l’avis du Conseil',()=>openCouncilNotice(record),'secondary'));
  if(!record.seen&&!councilDialog.open&&!highRun)openCouncilNotice(record);
}
function openCouncilNotice(record){
  const title=label('h2',record.subject);title.id='notice-title';
  const feedback=label('p','','minor');feedback.setAttribute('role','status');
  const accept=button(record.seen?'Fermer l’avis':'Accuser réception',async()=>{
    if(record.seen){councilDialog.close();return;}
    accept.disabled=true;
    try{
      const data=await api('notice',{id:record.id});
      if(current==='workspace'&&campaign?.notice?.id===record.id){
        receiveCampaign(data.campaign);
        councilDialog.close();showCouncilNotice();playSfx('send');
      }
    }catch(error){radioError(error,feedback);}
    finally{accept.disabled=false;}
  },'primary');
  councilDialog.replaceChildren(label('p',record.reference,'mono tag'),title,label('p',record.text),
    label('p',record.boundary,'minor'),make('div','inline-controls',accept,
      ...(!record.seen?[button('Fermer la session',()=>{$('logout').click();},'secondary')]:[])),feedback);
  if(!councilDialog.open)councilDialog.showModal();
  accept.focus();
}
