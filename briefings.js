'use strict';

const briefingGroups={
  wanted:{title:'Avis de recherche',new:'Nouvel avis',edit:'Modifier l’avis',empty:'Aucun avis de recherche pour le moment.',prefix:'AV',archive:'filed'},
  operations:{title:'Opérations RP',new:'Nouvelle opération',edit:'Modifier l’opération',empty:'Aucune opération RP pour le moment.',prefix:'OP',archive:'closed'},
  messages:{title:'Messages spéciaux',new:'Nouveau message',edit:'Modifier le message',empty:'Aucun message spécial pour le moment.',prefix:'MSG',archive:'archived'}
};
const briefingTypes={
  investigation:'Enquête RP',watch:'Veille RP',liaison:'Liaison RP',archives:'Recherche d’archives RP',
  assistance:'Assistance RP',other:'Autre scénario RP'
};
const briefingStatus={
  active:'Avis actif',filed:'Avis classé',planned:'Planifiée',running:'En cours',paused:'En pause',closed:'Clôturée',
  published:'Publié',archived:'Archivé'
};
const briefingMoves={
  wanted:{active:[['filed','Classer l’avis']],filed:[['active','Réactiver l’avis']]},
  operations:{planned:[['running','Lancer'],['closed','Clôturer']],running:[['paused','Suspendre'],['closed','Clôturer']],
    paused:[['running','Reprendre'],['closed','Clôturer']]},
  messages:{published:[['archived','Archiver le message']],archived:[['published','Republier le message']]}
};
const briefingSlots={portrait:'Portrait d’avatar RP',evidence:'Capture de preuve RP'};
const briefingClock=new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'medium',timeZone:'Europe/Paris'});
const briefingDate=value=>briefingClock.format(new Date(value));
function briefingOriginal(node){node.dataset.uiOriginal='';return node;}
function briefingError(error){
  return ({
    briefing_changed:'Une autre session a modifié ce dossier. Ferme ce formulaire, puis rouvre le dossier actualisé.',
    briefing_limit:'Ce registre a atteint sa limite. Aucun dossier n’a été supprimé.',
    briefing_fiction:'Confirme que le contenu concerne uniquement des personnages fictifs et la campagne RP.'
  })[error.message]??toastText[error.message]??toastText.unavailable;
}
function renderBriefings(root){
  const session=token;
  const initial=heading('REDCLIFF / BUREAU DE LIAISON RP','Avis de recherche & opérations',
    'Consulte les avis, les pièces du dossier et les décisions de la Direction pour la campagne Redcliff.');
  const role=label('p','','brief-access mono');
  const intro=make('p','brief-scope',label('strong','Fiction RP uniquement. '),
    label('span','Utilise des noms de personnages et des captures d’avatars. N’ajoute pas de photo ni de donnée sur une personne réelle.'));
  const tabs=make('div','brief-tabs'),tools=make('div','brief-tools'),pane=make('div','brief-pane');
  tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Vues du bureau de liaison');
  const feedback=label('p','','brief-feedback minor');feedback.setAttribute('role','status');
  const dialog=make('dialog','council-dialog brief-dialog');
  dialog.id='briefing-dialog';dialog.setAttribute('aria-labelledby','briefing-dialog-title');
  let opener=null;
  dialog.addEventListener('close',()=>{
    if(dialog.open)return;
    dialog.replaceChildren();
    if(current==='workspace'&&activeTab==='briefings'){
      const target=opener?.isConnected?opener:
        Array.from(pane.querySelectorAll('button[data-brief-focus]')).find(node=>node.dataset.briefFocus===opener?.dataset.briefFocus);
      (target??create)?.focus({preventScroll:true});
    }
  });
  const shell=make('div','brief-board',intro,tabs,tools,feedback,pane,dialog);
  let group='wanted',entries=null,revision,minimumRevision=0,loading=false,writing=false,readFailed=false;
  const canWrite=Boolean(campaign.rights.direction);
  role.textContent=canWrite?'ACCÈS DIRECTION · NIVEAU 5':'CONSULTATION UNIQUEMENT';
  initial.append(role);
  const live=()=>activeTab==='briefings'&&current==='workspace'&&session===token&&shell.isConnected;
  const photoCache=new Map();
  const observe=new IntersectionObserver((changes)=>{
    for(const {target,isIntersecting} of changes){
      if(!isIntersecting||!live())continue;
      observe.unobserve(target);
      const {group,id,slot,version}=target.dataset;
      const key=[group,id,slot,version].join(':');
      if(!photoCache.has(key)&&live()){
        photoCache.set(key,api('briefing',{op:'picture',group,id,slot}).then(({picture})=>picture)
          .catch(()=>{photoCache.delete(key);return null;}));
      }
      photoCache.get(key)?.then(picture=>{
        if(!live()||!target.isConnected)return;
        if(picture){target.src='data:image/jpeg;base64,'+picture;target.hidden=false;}
        else target.parentElement.querySelector('.brief-image-state').textContent='Image indisponible.';
      });
    }
  },{rootMargin:'180px'});
  const interval=setInterval(()=>{
    if(!shell.isConnected){clearInterval(interval);observe.disconnect();return;}
    if(!document.hidden)void refresh();
  },2800);
  const search=textInput('Chercher un titre ou une référence',80,'search');
  const recent=make('input','');recent.type='checkbox';recent.id='briefing-archives';
  const archiveLabel=label('label','Afficher les archives');archiveLabel.htmlFor=recent.id;
  const create=canWrite?button(briefingGroups[group].new,()=>editor(group,null,create),'primary'):null;
  const refreshButton=button('Actualiser',()=>void refresh(true),'secondary');
  const toolRow=make('div','brief-tool-actions',make('div','brief-check',recent,archiveLabel),refreshButton);
  if(create)toolRow.append(create);
  tools.append(radioField('briefing-search','Rechercher dans le registre',search),toolRow);
  search.addEventListener('input',()=>paint());
  recent.addEventListener('change',()=>paint());
  for(const [key,summary] of Object.entries(briefingGroups)){
    const view=button(summary.title,()=>{
      if(group===key)return;
      group=key;search.value='';recent.checked=false;
      for(const node of tabs.children)node.setAttribute('aria-pressed',String(node===view));
      if(create)create.textContent=summary.new;
      paint();
    });
    view.setAttribute('aria-pressed',String(group===key));
    tabs.append(view);
  }
  root.replaceChildren(initial,shell);
  paint();void refresh();

  function reference(key,id){return `${briefingGroups[key].prefix}-${id.slice(0,8).toUpperCase()}`;}
  function normalize(text){return text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();}
  async function refresh(force=false){
    if(!live()||loading||writing)return;
    loading=true;
    try{
      const result=await api('briefing',{op:'read',...(force?{}:{revision})});
      if(!live())return;
      const recovering=readFailed;
      if(result.entries&&result.revision>=minimumRevision){entries=result.entries;revision=result.revision;minimumRevision=revision;paint();}
      if(recovering){readFailed=false;feedback.textContent='';if(!result.entries)paint();}
    }catch(error){
      if(live()&&!readFailed){readFailed=true;feedback.textContent=briefingError(error);if(!entries)paint();}
    }finally{loading=false;}
  }
  function accept(result,key){
    if(!entries)return;
    const rows=entries[key], currentRow=rows.find(row=>row.id===result.entry.id);
    entries={...entries,[key]:currentRow?rows.map(row=>row.id===result.entry.id?result.entry:row):[result.entry,...rows]};
    // A local write may not include another director's intervening write. The next read must reconcile the full list.
    minimumRevision=Math.max(minimumRevision,result.revision);revision=undefined;
    paint();queueMicrotask(()=>void refresh(true));
  }
  function displayValue(name,value){
    return make('div','brief-line',label('h4',name,'mono'),briefingOriginal(label('p',value,'brief-copy')));
  }
  function imageFor(row,key,slot){
    const preview=make('img','');preview.alt=briefingSlots[slot];preview.decoding='async';
    preview.width=slot==='portrait'?136:520;preview.height=slot==='portrait'?164:310;
    Object.assign(preview.dataset,{group:key,slot,id:row.id,version:String(row.version)});
    const state=label('span','Chargement…','brief-image-state minor');
    preview.addEventListener('load',()=>{state.hidden=true;});
    preview.addEventListener('error',()=>{preview.hidden=true;state.hidden=false;state.textContent='Image indisponible.';});
    // Keep a sized observer target, even before its source arrives.
    observe.observe(preview);
    return make('figure',`brief-image brief-${slot}`,preview,state);
  }
  function detailsFor(row,key){
    const details=make('details','brief-details');
    details.dataset.detailKey=row.id;
    const summary=label('summary',key==='messages'?'Historique du message':'Pièces et historique RP');
    const inner=make('div','brief-details-body');
    if(key!=='messages'){
      inner.append(displayValue('Preuves et éléments RP',row.evidence||''),
        ...(!row.evidence&&!row.attachments.includes('evidence')?[label('p','Aucune pièce jointe ni preuve écrite.','minor')]:[]),
        ...(row.attachments.includes('evidence')?[imageFor(row,key,'evidence')]:[]));
    }
    const timeline=make('ol','brief-history');
    for(const step of row.timeline){
      timeline.append(make('li','',label('strong',briefingStatus[step.status]),
        briefingOriginal(label('span',`${briefingDate(step.at)} · ${step.by}`,'minor'))));
    }
    inner.append(label('h4','Journal des statuts','mono'),timeline);
    details.append(summary,inner);
    return details;
  }
  function paint(){
    if(create)create.disabled=!entries;
    const open=new Set(Array.from(pane.querySelectorAll('details[open]'),item=>item.dataset.detailKey));
    const focus=pane.contains(document.activeElement)?document.activeElement:null;
    const focusKey=focus?.dataset.briefFocus??focus?.parentElement?.dataset.detailKey;
    observe.disconnect();
    const descriptor=briefingGroups[group], title=label('h2',descriptor.title,'brief-section-title');
    if(!entries){
      pane.replaceChildren(title,label('p',readFailed?'Registre indisponible.':'Chargement…','brief-empty minor'));return;
    }
    const query=normalize(search.value);
    const view=entries[group].filter(row=>(recent.checked||row.status!==descriptor.archive)&&
      (!query||normalize(`${row.title} ${reference(group,row.id)}`).includes(query)));
    const list=make('div',`brief-records brief-records-${group}`);
    for(const row of view){
      const key=group;
      const portrait=key==='wanted'?(row.attachments.includes('portrait')?imageFor(row,key,'portrait'):
        make('div','brief-placeholder',label('span','AV / RP','mono'),label('span','Sans portrait','minor'))):null;
      const meta=make('div','brief-meta',label('span',reference(key,row.id),'mono brief-ref'),
        label('span',briefingStatus[row.status],`brief-state mono brief-${row.status}`));
      const rowTitle=briefingOriginal(label('h3',row.title));
      const lead=make('div','brief-record-lead',meta,rowTitle);
      if(row.type)lead.append(label('p',briefingTypes[row.type],'brief-type mono'));
      lead.append(briefingOriginal(label('p',`${briefingDate(row.updatedAt)} · ${row.updatedBy}`,'brief-by minor')));
      const top=make('div','brief-record-top',...(portrait?[portrait]:[]),lead);
      const content=key==='messages'?briefingOriginal(label('p',row.body,'brief-copy')):
        displayValue(key==='wanted'?'Motif de la recherche':'Objectif RP',row.body);
      const block=make('article','brief-record',top,content);
      if(row.linked){
        const refGroup=key==='operations'?'wanted':'operations';
        const linked=entries[refGroup].find(item=>item.id===row.linked);
        if(linked)block.append(make('p','brief-linked',label('strong',key==='operations'?'Avis lié : ':'Opération liée : '),
          briefingOriginal(label('span',`${reference(refGroup,linked.id)} · ${linked.title}`))));
      }
      const expandable=detailsFor(row,key);expandable.open=open.has(row.id);
      block.append(expandable);
      if(canWrite){
        const edit=button(descriptor.edit,()=>editor(key,row,edit));
        edit.dataset.briefFocus=`${row.id}:edit`;
        const actions=make('div','brief-record-actions',edit);
        for(const [status,copy] of briefingMoves[key]?.[row.status]??[]){
          const control=button(copy,()=>confirm(key,row,status,copy,control));
          control.dataset.briefFocus=`${row.id}:${status}`;actions.append(control);
        }
        block.append(actions);
      }
      list.append(block);
    }
    pane.replaceChildren(title,view.length?list:label('p',query?'Aucun résultat pour cette recherche.':descriptor.empty,'brief-empty minor'));
    if(focusKey&&!dialog.open){
      const control=Array.from(pane.querySelectorAll('[data-brief-focus],summary')).find(node=>
        (node.dataset.briefFocus??node.parentElement.dataset.detailKey)===focusKey);
      (control??search).focus({preventScroll:true});
    }
  }
  function dialogHeading(text){
    const node=label('h2',text);node.id='briefing-dialog-title';return node;
  }
  function openDialog(from,content){
    opener=from;dialog.replaceChildren(content);dialog.showModal();
  }
  function fileField(slot,row){
    const file=make('input','');file.type='file';file.accept='image/jpeg,image/png,image/webp';
    const field=radioField(`briefing-file-${slot}`,briefingSlots[slot],file);
    const remove=make('input','');remove.type='checkbox';remove.id=`briefing-remove-${slot}`;
    if(row?.attachments.includes(slot)){
      const caption=label('label','Retirer l’image actuelle');caption.htmlFor=remove.id;
      field.append(make('div','brief-check',remove,caption));
      remove.addEventListener('change',()=>{if(remove.checked)file.value='';});
      file.addEventListener('change',()=>{if(file.files.length)remove.checked=false;});
    }
    return {slot,field,file,remove};
  }
  function editor(key,row,from){
    const item=briefingGroups[key], isMessage=key==='messages';
    const title=textInput('',90);title.value=row?.title??'';title.required=true;title.minLength=2;title.autofocus=true;
    const type=optionsField(Object.entries(briefingTypes),'Choisir un type',row?.type);
    type.required=true;
    const body=textArea('',isMessage?1800:1400);body.value=row?.body??'';body.required=true;body.minLength=3;
    const evidence=textArea('',1500);evidence.value=row?.evidence??'';
    const linkGroup=key==='operations'?'wanted':'operations';
    const link=optionsField(entries[linkGroup].map(item=>[item.id,`${reference(linkGroup,item.id)} · ${item.title}`]),
      key==='operations'?'Aucun avis lié':'Aucune opération liée',row?.linked,true);
    const media=(key==='wanted'?['portrait','evidence']:key==='operations'?['evidence']:[]).map(slot=>fileField(slot,row));
    const fields=make('div','ops-fields brief-fields',
      radioField('briefing-entry-title',key==='wanted'?'Nom du personnage RP':isMessage?'Titre du message':'Nom de l’opération RP',title),
      ...(!isMessage?[radioField('briefing-entry-type','Type d’opération',type)]:[]),
      ...(key!=='wanted'?[radioField('briefing-entry-link',key==='operations'?'Avis associé (facultatif)':'Opération associée (facultatif)',link)]:[]),
      radioField('briefing-entry-body',key==='wanted'?'Motif de la recherche':isMessage?'Contenu du message':'Objectif RP',body),
      ...(!isMessage?[radioField('briefing-entry-evidence','Preuves et éléments RP',evidence)]:[]),...media.map(entry=>entry.field));
    const check=make('input','');check.type='checkbox';check.id='briefing-fiction';check.required=true;
    const statement=label('label','Je confirme que ce contenu concerne uniquement des personnages fictifs et la campagne RP.');statement.htmlFor=check.id;
    const status=label('p','','brief-form-feedback');status.setAttribute('role','status');
    const cancel=button('Annuler',()=>dialog.close());
    const save=label('button',row?'Enregistrer les modifications':key==='operations'?'Créer l’opération':'Publier','primary');save.type='submit';
    const form=make('form','brief-form',dialogHeading(row?item.edit:item.new),
      label('p','Visible par tout le personnel connecté. Le niveau 5 est seul habilité à écrire.','minor'),
      fields,...(media.length?[label('p','Images RP : JPG, PNG ou WebP, 10 Mo maximum par fichier.','minor')]:[]),
      make('div','brief-check',check,statement),status,make('div','ops-actions',save,cancel));
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(writing||!live())return;
      const data={op:'save',group:key,fictional:check.checked,title:title.value,body:body.value,
        ...(row?{id:row.id,version:row.version}:{}),
        ...(!isMessage?{type:type.value,evidence:evidence.value}:{}),
        ...(key!=='wanted'?{linked:link.value}:{})};
      writing=true;save.disabled=true;cancel.disabled=true;status.textContent='Enregistrement…';
      try{
        const images={};
        for(const {slot,file,remove} of media){
          if(file.files[0])images[slot]=await preparePhoto(file.files[0],{maxSide:800,maxEncoded:72000});
          else if(remove.checked)images[slot]=null;
        }
        if(!live())return;
        const result=await api('briefing',{...data,images});
        if(!live())return;
        dialog.close();search.value='';if(result.entry.status===item.archive)recent.checked=true;
        accept(result,key);feedback.textContent='Dossier enregistré dans le registre.';
      }catch(error){if(live())status.textContent=briefingError(error);}
      finally{writing=false;save.disabled=false;cancel.disabled=false;}
    });
    openDialog(from,form);
  }
  function optionsField(choices,emptyLabel,selected,original=false){
    const control=make('select','');
    const placeholder=label('option',emptyLabel);placeholder.value='';control.append(placeholder);
    for(const [value,name] of choices){
      const option=label('option',name);option.value=value;
      control.append(original?briefingOriginal(option):option);
    }
    control.value=selected??'';return control;
  }
  function confirm(key,row,next,copy,from){
    const status=label('p','','brief-form-feedback');status.setAttribute('role','status');
    const cancel=button('Annuler',()=>dialog.close());
    const submit=button('Confirmer',async()=>{
      if(writing||!live())return;
      writing=true;submit.disabled=true;cancel.disabled=true;status.textContent='Enregistrement…';
      try{
        const result=await api('briefing',{op:'transition',group:key,id:row.id,version:row.version,status:next});
        if(!live())return;
        dialog.close();if(next===briefingGroups[key].archive)recent.checked=true;
        accept(result,key);feedback.textContent='Statut mis à jour dans le registre.';
      }catch(error){if(live())status.textContent=briefingError(error);}
      finally{writing=false;submit.disabled=false;cancel.disabled=false;}
    },'primary');
    openDialog(from,make('div','brief-form',dialogHeading(copy),briefingOriginal(label('p',row.title)),
      make('p','brief-change',label('span',briefingStatus[row.status]),label('span',' → '),label('strong',briefingStatus[next])),
      label('p','Le changement est ajouté au journal RP et visible par le personnel connecté.','minor'),
      status,make('div','ops-actions',submit,cancel)));
  }
  dialog.addEventListener('cancel',event=>{if(writing)event.preventDefault();});
}
