'use strict';

(async function installStaticUmbrellaMode(){
  const profile = window.UMBRELLA_DEMO_PROFILE;
  const campaign = window.UMBRELLA_DEMO_CAMPAIGN;

  function waitUntilReady(){
    return new Promise(resolve => {
      const check = () => {
        if (typeof startSession === 'function' && typeof openWorkspace === 'function') {
          resolve();
        } else {
          setTimeout(check, 25);
        }
      };
      check();
    });
  }

  window.api = async function staticApi(route = 'state') {
    const now = Math.floor(Date.now() / 1000);
    const result = {
      campaign,
      now,
      revision: 0,
      rights: campaign.rights,
      highCouncil: null,
      curfew: null,
      maintenance: null,
      mobilizations: campaign.mobilizations,
      alerts: [],
      success: true
    };

    if (route === 'pulse') {
      return {
        ...result,
        alerts: campaign.operations?.incidents?.alerts ?? [],
        operations: campaign.operations,
        centerAlert: null,
        sectorAlert: null,
        centers: campaign.centers,
        labs: campaign.labs,
        lots: campaign.lots,
        cryoPipes: campaign.cryoPipes,
        siteSectors: campaign.siteSectors
      };
    }
    if (route === 'network') return {network:{centers:campaign.centers}, now};
    if (route === 'sites') return {sites:{labs:campaign.labs,siteSectors:campaign.siteSectors,lots:campaign.lots,cryoPipes:campaign.cryoPipes}, now};
    if (route === 'language') return {language:'fr'};
    if (route === 'briefing') return {entries:[], revision:0};
    if (route === 'pda') return {devices:[]};
    if (route === 'council-roster') return {people:[]};
    if (route === 'armory') return {inventory:[], canUse:false};
    if (route === 'direction') return {roster:[], notes:[], purges:[]};
    if (route === 'logout') return {success:true};
    return result;
  };

  window.syncPortalHealth = async function staticPortalHealth() {
    const caption = document.getElementById('login-caption');
    if (caption) caption.textContent = 'Aperçu de démonstration actif. Aucun compte réel ni serveur externe requis.';
  };

  await waitUntilReady();

  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', function enterStaticPreview(event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      const submit = document.getElementById('submit');
      if (submit) {
        submit.disabled = false;
        if (submit.firstElementChild) submit.firstElementChild.textContent = 'Entrer dans l’aperçu';
      }

      startSession({
        token:'static-demo',
        profile,
        campaign
      }).catch(() => {
        openWorkspace({token:'static-demo',profile,campaign},{now:Math.floor(Date.now()/1000)});
      });
    }, true);
  }

  const body = document.body;
  if (body) body.dataset.accessPending = 'false';
})();
