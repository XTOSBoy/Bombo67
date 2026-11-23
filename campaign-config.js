'use strict';

// L’aperçu utilise le proxy. Un déploiement autonome peut servir /api sur la même origine.
const campaignPort=window.REDCLIFF_PORT;
window.UMBRELLA_API ??= typeof campaignPort==='string'&&!campaignPort.startsWith('__PORT_')?campaignPort:'';
