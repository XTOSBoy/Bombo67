'use strict';

const armoryReferences=[
  ['Resident Evil 2 Remake','https://www.evilresource.com/resident-evil-2-remake/weaponry'],
  ['Resident Evil 3 Remake','https://www.evilresource.com/resident-evil-3-remake/weaponry'],
  ['Resident Evil 4 Remake','https://www.evilresource.com/resident-evil-4-remake/weaponry'],
  ['Separate Ways','https://game8.co/games/Resident-Evil-4-Remake/archives/426877'],
  ['Resident Evil Requiem','https://www.evilresource.com/resident-evil-requiem/weaponry'],
  ['Resident Evil Village','https://www.evilresource.com/resident-evil-village/weaponry']
];

function armoryPanel(tab='council'){
  let grant=null;
  const panelSession=token;
  const title=label('h2','Armurerie du Bastion');
  const badge=pill('VERROUILLÉE',false);
  const content=make('div','armory-content');
  const panel=make('section','armory-panel',
    make('div','armory-header',make('div','',label('p','B01 / REGISTRE DE DOTATION','tag mono'),title),badge),
    content);
  panel.releaseArmory=()=>{
    const proof=grant;grant=null;
    if(proof&&panelSession===token&&current==='workspace')void api('armory',{op:'lock',grant:proof}).catch(()=>{});
  };
  function lock(focus=false){
    panel.releaseArmory();
    const session=token;
    badge.textContent='VERROUILLÉE';badge.classList.remove('online');
    const input=make('input','');input.type='password';input.required=true;input.maxLength=128;
    input.autocomplete='off';
    const field=radioField('armory-code','Code de l’armurerie',input);
    const helper=label('p','Accès réservé à la Direction et à la Sécurité.','minor');
    helper.id='armory-code-hint';input.setAttribute('aria-describedby',helper.id);
    const feedback=label('p','','armory-feedback');feedback.setAttribute('role','status');
    const attemptLabel=label('span','','mono minor');attemptLabel.setAttribute('aria-live','polite');
    const segments=make('span','armory-segments',...Array.from({length:3},()=>make('span','')));
    segments.setAttribute('aria-hidden','true');
    const attemptDisplay=make('div','attempts armory-attempts',attemptLabel,segments);
    attemptDisplay.hidden=true;
    const submit=label('button','Déverrouiller l’armurerie','primary');submit.type='submit';
    const form=make('form','armory-gate',make('div','',field,helper),submit,attemptDisplay,feedback);
    const reveal=button('Afficher le code',()=>{
      const show=input.type==='password';input.type=show?'text':'password';
      reveal.textContent=show?'Masquer le code':'Afficher le code';reveal.setAttribute('aria-pressed',String(show));
    },'text-button');
    reveal.setAttribute('aria-pressed','false');field.append(reveal);
    form.autocomplete='off';form.noValidate=true;
    const lockTitle=label('h3','Armurerie bloquée temporairement');
    lockTitle.tabIndex=-1;
    const clock=label('strong','','mono armory-clock');clock.setAttribute('role','timer');
    clock.setAttribute('aria-label','Temps avant un nouvel essai');
    const blocked=make('div','armory-blocked',lockTitle,
      label('p','Trois codes incorrects. Le reste de l’intranet reste accessible.','minor'),clock);
    blocked.hidden=true;
    const isCurrent=()=>session===token&&activeTab===tab&&form.isConnected;
    let locked=false, pending=false, timer;
    const controls=()=>{
      for(const node of [input,submit,reveal])node.disabled=pending||locked;
    };
    function displayAttempts(state){
      if(!Number.isInteger(state.attemptsLeft))return;
      attemptDisplay.hidden=false;
      const text=`ESSAIS RESTANTS : ${state.attemptsLeft}/${state.maxAttempts}`;
      if(attemptLabel.textContent!==text)attemptLabel.textContent=text;
      Array.from(segments.children).forEach((item,i)=>item.classList.toggle('used',i>=state.attemptsLeft));
    }
    function cooldown(seconds, focusNotice){
      const until=performance.now()+seconds*1000;
      locked=true;controls();clearTimeout(timer);
      badge.textContent='BLOQUÉE · 1 MIN';blocked.hidden=false;
      feedback.textContent='';
      if(focusNotice)lockTitle.focus();
      function tick(){
        if(!isCurrent())return;
        const remaining=Math.max(0,Math.ceil((until-performance.now())/1000));
        clock.textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
        if(remaining)timer=setTimeout(tick,200);
        else void readStatus(focusNotice&&document.activeElement===lockTitle);
      }
      tick();
    }
    async function readStatus(refocus=false){
      pending=true;controls();
      try{
        const state=await api('armory',{op:'status'});
        if(!isCurrent())return;
        displayAttempts(state);
        helper.textContent=state.dedicatedCode?'Saisis le code dédié du Bastion. Le code de connexion ne déverrouille pas l’armurerie.':
          'Utilise ton propre code de connexion RP.';
        input.inputMode=state.dedicatedCode?'numeric':'text';
        if(state.retryAfter>0){cooldown(state.retryAfter,refocus);return;}
        const restored=locked;
        locked=false;blocked.hidden=true;
        badge.textContent='VERROUILLÉE';
        feedback.textContent=restored?'Trois nouveaux essais sont disponibles.':'';
      }catch(error){
        if(!isCurrent())return;
        feedback.textContent=toastText[error.message]??toastText.unavailable;
        if(locked)timer=setTimeout(()=>{if(isCurrent())void readStatus(refocus);},3000);
      }finally{
        if(isCurrent()){pending=false;controls();if(refocus&&!locked)input.focus();}
      }
    }
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(pending||locked)return;
      const code=input.value.trim();
      if(!code){feedback.textContent='Entre le code de l’armurerie.';input.setAttribute('aria-invalid','true');input.focus();return;}
      input.value='';pending=true;controls();feedback.textContent='Vérification du code…';
      input.removeAttribute('aria-invalid');
      try {
        const {inventory,canUse,grant:proof}=await api('armory',{code});
        if(!isCurrent()){
          if(proof&&session===token&&current==='workspace')void api('armory',{op:'lock',grant:proof}).catch(()=>{});
          return;
        }
        if(!Array.isArray(inventory)||typeof proof!=='string')throw new Error('unavailable');
        grant=proof;
        badge.textContent='CONSULTATION AUTORISÉE';badge.classList.add('online');
        armoryInventory(content,inventory,()=>lock(true),canUse?async(model,expectedQuantity)=>{
          const activeGrant=grant;
          try{
            return (await api('armory',{op:'use',grant:activeGrant,model,expectedQuantity,confirmed:true})).inventory;
          }catch(error){
            if(error.message==='armory_relock'&&panel.isConnected&&activeGrant===grant)lock(true);
            if(['stock_changed','stock_shortage'].includes(error.message)){
              try{error.inventory=(await api('armory',{op:'inventory',grant:activeGrant})).inventory;}catch{}
            }
            throw error;
          }
        }:null);
        playSfx('send');
      } catch(error) {
        if(!isCurrent())return;
        displayAttempts(error);
        if(error.message==='armory_wait'){
          cooldown(Math.max(1,error.retryAfter??60),true);playSfx('alarm');return;
        }
        feedback.textContent=({
          armory_denied:'Code de l’armurerie incorrect.',
          forbidden:'Cette session ne possède pas l’habilitation niveau 5 ou SEC.',
          invalid:'Vérifie le code renseigné.'
        })[error.message]??toastText.unavailable;
        if(error.message==='armory_denied')input.setAttribute('aria-invalid','true');
        playSfx('denied');
      } finally {
        if(isCurrent()){pending=false;controls();if(!locked)input.focus();}
      }
    });
    input.addEventListener('input',()=>{if(!submit.disabled)feedback.textContent='';input.removeAttribute('aria-invalid');});
    content.replaceChildren(blocked,form);
    void readStatus(focus);
  }
  lock();
  return panel;
}

function armoryInventory(root,items,relock,useStock){
  const numeral=quantity=>formatter.format(quantity);
  const sources=make('div','armory-references');
  for(const [name,url] of armoryReferences){
    const link=label('a',name,'archive-reference');
    link.href=url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link);
  }
  const search=textInput('CQBR, Clatter Carbine, M4…',70,'search');
  function select(options,caption){
    const control=make('select','');
    const all=label('option',caption);all.value='';control.append(all);
    for(const value of options)control.append(label('option',value));
    return control;
  }
  const families=select(new Set(items.map(item=>item.category)),'Toutes les familles');
  const origins=select(new Set(items.flatMap(item=>item.origins??[item.origin])),'Toutes les origines');
  const filterRow=make('div','armory-filters',
    radioField('armory-search','Rechercher un modèle',search),
    radioField('armory-family','Famille',families),radioField('armory-origin','Origine',origins));
  const status=label('p','','archive-count mono');status.setAttribute('role','status');
  const reset=button('Effacer les filtres',()=>{search.value=families.value=origins.value='';paint();search.focus();},'text-button');
  const stockTotal=label('strong',numeral(items.reduce((total,item)=>total+item.quantity,0)),'mono');
  const stats=make('div','armory-stat',stockTotal,
    label('span','UNITÉS RP EN RÉSERVE','tag mono'));
  const headCells=['Modèle / origine','Famille','Stock RP'].map((title,i)=>{
    const cell=label('th',title,i===1?'armory-family-cell':'');cell.scope='col';return cell;
  });
  const body=make('tbody','');
  const table=make('table','armory-table',make('thead','',make('tr','',...headCells)),body);
  table.setAttribute('aria-label','Inventaire fictif du Bastion');
  const none=label('p','Aucun modèle ne correspond aux filtres.','archive-empty');
  const lock=button('Reverrouiller l’armurerie',relock);
  const rows=items.map(item=>{
    const heading=make('th','',label('strong',item.name),label('span',item.origin,'minor'),label('span',item.category,'minor armory-mobile-family'));
    heading.scope='row';
    const quantity=label('span',numeral(item.quantity),'mono armory-quantity');
    const stock=make('td','armory-stock-cell',quantity);
    const row=make('tr','',heading,label('td',item.category,'armory-family-cell'),stock);
    const syncQuantities=inventory=>{
      const latest=new Map(inventory.map(entry=>[entry.name,entry.quantity]));
      for(const view of rows)view.update(latest.get(view.item.name)??0);
      stockTotal.textContent=numeral(inventory.reduce((total,entry)=>total+entry.quantity,0));
    };
    const use=useStock?stockUseButton(item.name,item.quantity,async()=>{
      try{syncQuantities(await useStock(item.name,item.quantity));}
      catch(error){if(error.inventory)syncQuantities(error.inventory);throw error;}
      return ()=>use.control.disabled?search:use.control;
    }):null;
    if(use)stock.append(use.control);
    body.append(row);
    return {item,row,update(value){item.quantity=value;quantity.textContent=numeral(value);use?.update(value);}};
  });
  function paint(){
    const words=normalized(search.value).split(' ').filter(Boolean);
    let count=0;
    for(const {row,item} of rows){
      row.hidden=Boolean((families.value&&item.category!==families.value)||(origins.value&&!(item.origins??[item.origin]).includes(origins.value))||
        !words.every(word=>normalized(`${item.name} ${item.origin} ${item.category}`).includes(word)));
      if(!row.hidden)count++;
    }
    status.textContent=`${count} référence${count===1?'':'s'} affichée${count===1?'':'s'}`;
    table.hidden=count===0;none.hidden=count>0;
    reset.hidden=!search.value&&!families.value&&!origins.value;
  }
  search.addEventListener('input',paint);families.addEventListener('change',paint);origins.addEventListener('change',paint);
  const intro=label('h3','Inventaire RP');intro.tabIndex=-1;
  root.replaceChildren(make('div','armory-stock-header',make('div','',intro,
    label('p','Répliques, protections de costume et accessoires numériques. Le stock RP ne vient pas des jeux : un modèle à zéro reste au catalogue.','minor')),stats),
    filterRow,make('div','org-results-heading',status,reset),table,none,
    make('div','armory-footer',make('div','',label('p','RÉFÉRENCES DES JEUX','tag mono'),sources),lock));
  paint();intro.focus();
}
