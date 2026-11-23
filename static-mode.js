'use strict';

(async function installStaticUmbrellaMode(){
  const profile = window.UMBRELLA_DEMO_PROFILE;
  const campaign = window.UMBRELLA_DEMO_CAMPAIGN;
  const storageKey = 'umbrella-redcliff-static-v2';
  let activeMob = null;

  try{
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if(saved?.mobilizations)campaign.mobilizations=saved.mobilizations;
    if(saved?.activeMob?.endsAt>Date.now())activeMob=saved.activeMob;
  }catch{/* Storage is optional. */}

  function saveMob(){
    try{localStorage.setItem(storageKey,JSON.stringify({mobilizations:campaign.mobilizations,activeMob}));}catch{/* Storage is optional. */}

  function waitUntilReady(){
    return new Promise(resolve => {
      const check = () => {
        if (typeof startSession === 'function' && typeof openWorkspace === 'function') resolve();
        else setTimeout(check,25);
      };
      check();
    });
  }

  window.api = async function staticApi(route='state',data={}) {
    const nowSeconds=Math.floor(Date.now()/1000);
    const nowMs=Date.now();

    if(route==='action'&&data.action==='mobilization_start'){
      const startsAt=nowMs;
      const endsAt=startsAt+58000;
      const id=String(data.id||crypto?.randomUUID?.()||(`MOB-${nowMs}`));
      const entry={
        id,
        type:data.kind||'Générale',
        place:String(data.place||''),
        units:Array.isArray(data.units)?data.units:[String(data.units||'')].filter(Boolean),
        launchedAt:startsAt,
        launchedBy:{name:profile.name},
        liftedAt:null,
        liftedBy:null
      };
      campaign.mobilizations.unshift(entry);
      activeMob={id,startsAt,endsAt,type:entry.type,place:entry.place,units:entry.units};
      campaign.revision=(campaign.revision||0)+1;
      saveMob();
      return {campaign,now:nowSeconds,revision:campaign.revision,mobilizationSignal:activeMob};
    }

    if(route==='action'&&data.action==='mobilization_lift'){
      const entry=campaign.mobilizations.find(row=>row.id===data.id);
      if(entry){entry.liftedAt=nowMs;entry.liftedBy={name:profile.name};}
      if(activeMob?.id===data.id)activeMob=null;
      campaign.revision=(campaign.revision||0)+1;
      saveMob();
      return {campaign,now:nowSeconds,revision:campaign.revision,mobilizationSignal:null};
    }

    const result={
      campaign, now:nowSeconds, revision:campaign.revision||0,
      rights:campaign.rights, highCouncil:null, curfew:null,
      maintenance:null, mobilizations:campaign.mobilizations,
      mobilizationSignal:activeMob, alerts:[], success:true
    };

    if(route==='pulse'){
      return {
        ...result,
        alerts:campaign.operations?.incidents?.alerts??[],
        operations:campaign.operations,
        centerAlert:null,sectorAlert:null,
        centers:campaign.centers,labs:campaign.labs,lots:campaign.lots,
        cryoPipes:campaign.cryoPipes,siteSectors:campaign.siteSectors
      };
    }
    if(route==='network')return {network:{centers:campaign.centers},now:nowSeconds};
    if(route==='sites')return {sites:{labs:campaign.labs,siteSectors:campaign.siteSectors,lots:campaign.lots,cryoPipes:campaign.cryoPipes},now:nowSeconds};
    if(route==='language')return {language:'fr'};
    if(route==='briefing')return {entries:[],revision:0};
    if(route==='pda')return {devices:[]};
    if(route==='council-roster')return {people:[]};
    if(route==='armory')return {inventory:[],canUse:false};
    if(route==='direction')return {roster:[],notes:[],purges:[]};
    if(route==='logout')return {success:true};
    return result;
  };

  window.syncPortalHealth=async function staticPortalHealth(){
    const caption=document.getElementById('login-caption');
    if(caption)caption.textContent='Aperçu de démonstration actif. Mobilisations locales disponibles.';
  };

  await waitUntilReady();

  const form=document.getElementById('login-form');
  if(form){
    form.addEventListener('submit',function enterStaticPreview(event){
      event.preventDefault();
      event.stopImmediatePropagation();
      const submit=document.getElementById('submit');
      if(submit){submit.disabled=false;if(submit.firstElementChild)submit.firstElementChild.textContent='Entrer dans l’aperçu';}
      startSession({token:'static-demo',profile,campaign}).catch(()=>{
        openWorkspace({token:'static-demo',profile,campaign},{now:Math.floor(Date.now()/1000),mobilizationSignal:activeMob});
      });
    },true);
  }

  if(document.body)document.body.dataset.accessPending='false';
})();
