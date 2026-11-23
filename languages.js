'use strict';

// Keep the source copy in French. Translate interface strings, not documents or messages.
const uiTerms = new Map(`
Langue|Language
Langue de l’interface|Interface language
Mobilisation des unités|Unit mobilization
Mobilisation du Haut-Conseil|High Council mobilization
Mobiliser la Garde élitaire|Mobilize the Elite Guard
Mobiliser la Garde élitaire ?|Mobilize the Elite Guard?
PROTOCOLE CONTACT / HABILITATION 05|CONTACT PROTOCOL / CLEARANCE 05
UMB.NET / PROTOCOLE CONTACT / PRIORITÉ ABSOLUE|UMB.NET / CONTACT PROTOCOL / TOP PRIORITY
La Garde élitaire verrouille tout l’intranet le temps de la piste. Toutes les sessions reçoivent la diffusion et reprennent automatiquement à la fin.|The Elite Guard locks down the entire intranet for the duration of the track. All sessions receive the broadcast and resume automatically when it ends.
Toutes les sessions, y compris la Direction, seront verrouillées pendant la diffusion de 4 min 09 s. La reprise sera automatique, sans déconnexion.|All sessions, including the Executive Board, will be locked during the 4 min 09 s broadcast. Access resumes automatically without signing out.
Confirmer la mobilisation générale|Confirm full mobilization
La Garde élitaire a placé l’intranet sous scellés. Toutes les activités sont suspendues jusqu’à la fin de la diffusion.|The Elite Guard has sealed the intranet. All activities are suspended until the broadcast ends.
SYNCHRONISATION DE LA DIFFUSION|SYNCHRONIZING BROADCAST
INTRANET SOUS SCELLÉS|INTRANET SEALED
VÉRIFICATION DE LA RÉOUVERTURE|CHECKING ACCESS RESTORATION
Réouverture automatique. Ta session reste connectée.|Access resumes automatically. You remain signed in.
Historique du Haut-Conseil|High Council history
Aucune mobilisation du Haut-Conseil enregistrée.|No High Council mobilizations recorded.
Préparation de la diffusion…|Preparing the broadcast…
Piste indisponible : aucun verrouillage lancé.|Track unavailable. No lockdown was started.
Impossible de confirmer le lancement. Vérifie le statut avant de réessayer.|Could not confirm the launch. Check the status before retrying.
Le Haut-Conseil a suspendu les activités. Réessaie après la diffusion.|The High Council has suspended activities. Retry after the broadcast.
Son indisponible. Tu peux réessayer sans quitter cet écran.|Sound unavailable. You can retry without leaving this screen.
CONSEIL DE SÉCURITÉ / BUNKER B01|SECURITY COUNCIL / BUNKER B01
Prépare une mobilisation RP pour le Conseil de Sécurité.|Prepare an RP mobilization for the Security Council.
Configurer l’appel|Configure call
Type de mobilisation|Mobilization type
Générale|General
Partielle|Partial
De renfort|Reinforcements
D’évacuation|Evacuation
Personnalisée|Custom
Type personnalisé|Custom type
Noms des unités RP|RP unit names
Lieu de mobilisation RP|RP mobilization location
Ex. de reconnaissance|E.g. reconnaissance
Ex. Alpha-01, équipe médicale|E.g. Alpha-01, medical team
Ex. la mairie, au Bastion|E.g. town hall, at the Bastion
Lancer la mobilisation|Start mobilization
Interrompre|Stop sequence
Couper le son|Mute audio
PDA de terrain|Field PDAs
CONSEIL DE SÉCURITÉ / CONSULTATION 04|SECURITY COUNCIL / LEVEL 4 VIEW
Consultation uniquement. Les positions sont simulées sur la carte de Redcliff ; seul le niveau 5 peut relever une position, neutraliser ou réparer un PDA.|Read-only. Locations are simulated on the Redcliff map. Only level 5 can record a location, disable or repair a PDA.
PDA DE TERRAIN / RELEVÉ RP|FIELD PDA / RP LOCATION
Retour au registre PDA|Back to PDA registry
Aucun trajet RP entre deux laboratoires n’est disponible.|No roleplay route between two laboratories is available.
PDA neutralisé|PDA disabled
Remise en service du PDA|Restoring PDA access
PDA rétabli|PDA restored
PDA ISOLÉ|PDA ISOLATED
UMB.NET / SÉCURITÉ DES TERMINAUX|UMB.NET / TERMINAL SECURITY
TERMINAL|TERMINAL
Registre des terminaux attribués. La localisation est simulée dans Redcliff : aucune donnée GPS réelle n’est collectée.|Assigned devices. Locations are simulated in Redcliff; no real GPS data is collected.
Un malware simulé a été placé dans ce PDA. La session est inutilisable tant qu’un membre de la Direction de niveau 5 n’a pas autorisé la remise en service.|Simulated malware was placed on this PDA. The session is unusable until a level 5 director authorizes recovery.
La Direction a retiré le malware simulé. Le PDA restera inactif jusqu’à la fin de la remise en service de 10 minutes.|The Directorate removed the simulated malware. The PDA remains offline for the 10-minute recovery window.
La remise en service est terminée. Identifie-toi à nouveau pour ouvrir une nouvelle session.|Recovery is complete. Sign in again to open a new session.
SESSION INACTIVE · VERROUILLAGE DE NIVEAU 5|SESSION INACTIVE · LEVEL 5 LOCK
SESSION INACTIVE · RÉPARATION VALIDÉE|SESSION INACTIVE · REPAIR APPROVED
NOUVELLE CONNEXION AUTORISÉE|NEW SIGN-IN AVAILABLE
Progression de la remise en service|Recovery progress
Se reconnecter|Sign in again
Retour à la connexion|Back to sign-in
Statut indisponible. Tu peux revenir à la connexion pour le vérifier à nouveau.|Status unavailable. Return to sign-in to check again.
PDA enregistrés|Registered PDAs
En ligne|Online
Hors ligne|Offline
Neutralisés|Disabled
Neutralisé|Disabled
En réparation|Recovering
En attente|Waiting
Remise en service|Recovery
Affectation|Assignment
Nom, matricule ou secteur RP|Name, ID, or RP sector
Rechercher un PDA|Find a PDA
Lecture du registre PDA…|Loading the PDA register…
Aucune position RP relevée|No RP location recorded
Localiser (RP)|Locate (RP)
Neutraliser (RP)|Disable (RP)
Réparer le PDA|Repair PDA
PDA de Direction protégé|Protected Directorate PDA
Réactivation automatique|Automatic reactivation
Position RP relevée.|RP location recorded.
PDA neutralisé. Les sessions ont été coupées.|PDA disabled. Its sessions were disconnected.
Réparation validée. Décompte de 10 minutes lancé.|Repair approved. Ten-minute countdown started.
Aucun PDA ne correspond aux filtres.|No PDA matches the filters.
Impossible de charger le registre PDA.|Unable to load the PDA register.
Le serveur réserve le canal aux membres de Blackwater et à la Direction. Il ne remplace pas le canal du Conseil de Sécurité.|Only Blackwater members and the Directorate can access this channel. It does not replace the Security Council channel.
Activer le son|Enable audio
Rétablir le son|Unmute audio
Temps restant|Time remaining
Progression de la séquence|Sequence progress
REGISTRE DE MOBILISATION|MOBILIZATION RECORD
Renseigne le type, le lieu et les unités pour préparer le signal.|Enter the type, location, and units to prepare the signal.
ALERTE DE MOBILISATION · CONSEIL DE SÉCURITÉ|MOBILIZATION ALERT · SECURITY COUNCIL
SIGNAL REÇU|SIGNAL RECEIVED
PROTOCOLE VERONICA / B01|VERONICA PROTOCOL / B01
Mobilisation réceptionnée|Mobilization received
Le Conseil de Sécurité a réceptionné la mobilisation.|The Security Council has received the mobilization.
Quand le Conseil s’éveille, Redcliff retient son souffle.|When the Council awakens, Redcliff holds its breath.
N04H / CANAL DE MOBILISATION|N04H / MOBILIZATION CHANNEL
EN ATTENTE|STANDBY
PRÉPARATION DU SIGNAL|PREPARING SIGNAL
MOBILISATION EN COURS|MOBILIZATION IN PROGRESS
SÉQUENCE TERMINÉE|SEQUENCE COMPLETE
SÉQUENCE INTERROMPUE|SEQUENCE STOPPED
MOBILISATION LEVÉE|MOBILIZATION LIFTED
NAVIGATION VERROUILLÉE · SESSION ACTIVE|NAVIGATION LOCKED · SESSION ACTIVE
Revenir à l’intranet|Return to the intranet
Préparation de la piste et de l’alarme…|Preparing the track and alarm…
Son indisponible. Réessaie avant de lancer la mobilisation.|Audio unavailable. Try again before starting mobilization.
Impossible de confirmer la mobilisation dans le registre. Réessaie.|Could not confirm the mobilization in the register. Try again.
L’alerte Veronica est diffusée à tous les joueurs connectés. Revenir à l’intranet ne coupe pas le son : il s’arrête à 00:00 ou à la levée de la mobilisation.|The Veronica alert is broadcast to all signed-in players. Returning to the intranet does not mute it: the audio stops at 00:00 or when mobilization is lifted.
Son indisponible sur ce terminal.|Audio is unavailable on this terminal.
Une alerte est déjà diffusée sur l’intranet.|An alert is already being broadcast on the intranet.
Branche armée d’élite d’Umbrella|Umbrella’s elite armed branch
Campagne Redcliff (hors canon)|Redcliff campaign (non-canon)
Projets et archives de la campagne|Campaign projects and archives
Dossiers de Black Umbrella, propres à la campagne Redcliff.|Black Umbrella records from the Redcliff campaign.
Historique des mobilisations|Mobilization history
Le compte à rebours termine le son, pas la mobilisation. À l’arrivée des unités, lève-la depuis le registre.|The countdown ends the audio, not the mobilization. Lift it from the register once the units have arrived.
Aucune mobilisation enregistrée.|No mobilizations recorded.
Lever la mobilisation|Lift mobilization
LEVÉE|LIFTED
ACTIVE|ACTIVE
Déclenchée :|Started:
Levée :|Lifted:
Mobilisation levée. Elle reste dans l’historique.|Mobilization lifted. It remains in the history.
Impossible de lever la mobilisation. Réessaie.|Could not lift the mobilization. Try again.
Aller au contenu|Skip to content
INTRANET DU PERSONNEL|STAFF INTRANET
TERMINAL PRÊT|TERMINAL READY
CAMPAGNE EN LIGNE|CAMPAIGN ONLINE
CAMPAGNE ACTIVE|CAMPAIGN ACTIVE
SESSION ACTIVE|SESSION ACTIVE
SESSION FERMÉE|SIGNED OUT
TERMINAL ISOLÉ|TERMINAL ISOLATED
COUVRE-FEU|CURFEW
MAINTENANCE GÉNÉRALE|GENERAL MAINTENANCE
INITIALISATION|INITIALIZING
Heure de Paris|Paris time
Voix N04H|N04H voice (original French)
Effets sonores|Sound effects
ARCHIVE VISUELLE|VISUAL ARCHIVE
Complexe|Facility
de Redcliff|in Redcliff
Point d’accès du personnel scientifique|Access point for scientific staff
et du Conseil de Sécurité.|and the Security Council.
NEST · SECTEUR EST|NEST · EAST SECTOR
Capture Capcom via Polygon|Capcom screenshot via Polygon
Capture du laboratoire NEST dans Resident Evil 2|Screenshot of the NEST lab in Resident Evil 2
ACCÈS RESTREINT|RESTRICTED ACCESS
AUTHENTIFICATION DU PERSONNEL|STAFF AUTHENTICATION
Portail Umbrella|Umbrella Portal
Saisis ton matricule et ton code RP pour accéder à ta campagne.|Enter your staff ID and RP access code to access your campaign.
La campagne Redcliff est active. Saisis ton matricule et ton code RP.|The Redcliff campaign is active. Enter your staff ID and RP access code.
Ouvrir l’intranet dans un nouvel onglet|Open the intranet in a new tab
Matricule|Staff ID
Code d’accès RP|RP access code
Saisir le code attribué|Enter your assigned code
Afficher le code|Show code
Masquer le code|Hide code
Initialiser la connexion|Sign in
Vérification…|Verifying…
Renseigne ton matricule et ton code RP.|Enter your staff ID and RP access code.
Trop de tentatives récentes. Attends une minute avant de réessayer. Aucun essai décompté.|Too many recent attempts. Wait a minute before trying again. No attempt was counted.
Le serveur ne répond pas. Réessaie : aucun essai n’a été décompté.|The server did not respond. Try again: no attempt was counted.
Le statut d’accès vient de changer. Réessaie de te connecter.|The access status just changed. Try signing in again.
Serveur de campagne momentanément indisponible. Réessaie dans quelques instants.|The campaign server is temporarily unavailable. Try again in a moment.
Serveur de campagne non configuré dans cet aperçu.|The campaign server is not configured for this preview.
Aucun serveur de campagne n’est configuré dans cet aperçu. Aucun essai décompté.|This preview has no campaign server. No attempt was counted.
UMB.NET / DIRECTION SUPRÊME|UMB.NET / EXECUTIVE BOARD
Couvre-feu en cours|Curfew in effect
couvre-feu activé par le Conseil de la Direction. Veuillez attendre que le couvre feu se finisse. Le personnel est donc inactif pendant ce temps.|The Executive Board has imposed a curfew. Please wait until it ends. All personnel are off duty during this period.
MAINTENANCE GÉNÉRALE · TOUS NIVEAUX SUSPENDUS|GENERAL MAINTENANCE · ALL CLEARANCE LEVELS SUSPENDED
HEURE RÉELLE · PARIS|LIVE TIME · PARIS
PLAGE DU COUVRE-FEU|CURFEW HOURS
TEMPS RESTANT|TIME REMAINING
Temps restant avant la réouverture|Time until reopening
Temps avant la réouverture|Time until reopening
Réouverture…|Reopening…
Réouverture en cours…|Reopening…
Calcul en cours…|Calculating…
Fermer la session|Sign out
Activer le son d’attente|Play waiting audio
Couper le son d’attente|Mute waiting audio
Levée d’urgence · niveau 5|Emergency lift · level 5
N’ouvre pas de session. Cette commande lève le couvre-feu et désactive sa répétition, sans lever une éventuelle maintenance manuelle.|This does not sign you in. It ends the curfew and disables its recurrence without ending any manual maintenance.
Matricule de Direction|Executive staff ID
Confirmer la levée d’urgence|Confirm emergency lift
Des identifiants de niveau 5 sont requis.|Level 5 credentials are required.
Trop de tentatives. Réessaie dans une minute.|Too many attempts. Try again in one minute.
Le couvre-feu a déjà pris fin.|The curfew has already ended.
Levée d’urgence indisponible.|Emergency lift unavailable.
Le serveur ne répond pas. Réessaie dans quelques instants.|The server did not respond. Try again in a moment.
Couvre-feu terminé. La campagne est de nouveau accessible.|Curfew has ended. The campaign is available again.
UMB.NET / ARRÊT GÉNÉRAL|UMB.NET / SYSTEM SHUTDOWN
DIRECTION SUPRÊME / N04H|EXECUTIVE BOARD / N04H
Maintenance générale|General maintenance
Les connexions, les communications et les opérations RP sont suspendues. Les données sont conservées et l’intranet rouvrira automatiquement.|Sign-ins, communications and RP operations are suspended. Data is preserved and the intranet will reopen automatically.
Rouvrir l’intranet|Reopen the intranet
Maintenance terminée. La campagne est de nouveau accessible.|Maintenance has ended. The campaign is available again.
ACCÈS VALIDÉ|ACCESS GRANTED
Initialisation|Initializing
Initialisation de l’intranet|Initializing the intranet
Ouverture du canal interne…|Opening the internal channel…
Lecture de l’habilitation…|Checking clearance…
Synchronisation du poste…|Synchronizing the workstation…
Connexion de la Reine Rouge…|Connecting to the Red Queen…
Accès au réseau Redcliff…|Accessing the Redcliff network…
VERROUILLÉ|LOCKED
Accès bloqué|Access blocked
Séquence Veronica|Veronica Sequence
Trois échecs d’authentification consécutifs ont été enregistrés. Le terminal a été isolé et ne peut plus ouvrir de session tant qu’il n’a pas été réinitialisé.|Three consecutive sign-in failures were recorded. The terminal is isolated and cannot sign in again until it is reset.
Rapport d’intrusion simulé|Simulated intrusion report
RAPPORT D’INTRUSION · VERONICA|INTRUSION REPORT · VERONICA
STATUT : ISOLÉ|STATUS: ISOLATED
HORODATAGE|TIMESTAMP
MATRICULE TENTÉ|ATTEMPTED STAFF ID
MASQUÉ|HIDDEN
Simulation RP. Aucun rapport réel ni donnée personnelle transmis.|RP simulation. No real report or personal data was sent.
Écouter l’alerte|Play the alert
Réinitialiser le terminal RP|Reset the RP terminal
ALERTE CRITIQUE DE SÉCURITÉ · TENTATIVE D’INTRUSION DÉTECTÉE · TERMINAL VERROUILLÉ|CRITICAL SECURITY ALERT · INTRUSION ATTEMPT DETECTED · TERMINAL LOCKED
TERMINAL SCELLÉ · SÉQUENCE VERONICA ACTIVE|TERMINAL SEALED · VERONICA SEQUENCE ACTIVE
TERMINAL UC–01 / FIN DE SESSION|TERMINAL UC–01 / SESSION ENDED
UMB.NET / TERMINAL PERSONNEL|UMB.NET / STAFF TERMINAL
Urgence BIOHAZARD|BIOHAZARD emergency
Menu des modules|Module menu
Modules du terminal|Terminal modules
01 / TERMINAL|01 / TERMINAL
02 / GROUPE UMBRELLA|02 / UMBRELLA GROUP
03 / RECHERCHE|03 / RESEARCH
04 / SÉCURITÉ|04 / SECURITY
05 / LOGISTIQUE|05 / LOGISTICS
RÉSEAU REDCLIFF|REDCLIFF NETWORK
Poste de travail|Workstation
Communications|Communications
Boîte mails RP|RP Inbox
Data centers|Data Centers
Annuaire du groupe|Group Directory
Autres organisations|Other organizations
Registre des agents|Agent Registry
Recherche & création|Research & Creation
Recherche et création|Research and Creation
Localisation de nos labos|Lab Locations
Carte des laboratoires|Laboratory Map
Plans et secteurs|Plans and Sectors
Cryogénisation|Cryogenic Storage
Salles de cryogénisation|Cryogenic Storage Rooms
Sites de recherche|Research Sites
Mélanger les virus (RP)|Virus Workshop (RP)
Maintien de la sécurité|Security Monitoring
Articles et rapports d’incident|Articles and Incident Reports
Rapports d’incident|Incident Reports
Bastion & armurerie|Bastion & Armory
Le Bastion|The Bastion
Registre privé du Conseil|Private Council Registry
Gestion des sanctions|Disciplinary Actions
Alertes BIOHAZARD|BIOHAZARD Alerts
Charte Umbrella|Umbrella Charter
Création des armes (RP)|Weapons Workshop (RP)
Créations biologiques (RP)|Biological Workshop (RP)
Armureries & convois|Armories & Convoys
Armureries et convois|Armories and Convoys
LOGISTIQUE / DOTATIONS REDCLIFF|LOGISTICS / REDCLIFF SUPPLIES
Consulte le stock de chaque site, prépare un convoi RP et joins un message pour le laboratoire de destination.|Check each site's stock, prepare an RP convoy, and attach a message for the receiving lab.
Stocks par armurerie|Stock by Armory
Dotation RP|RP supplies
Cette armurerie ne contient aucun objet.|This armory is empty.
Accès protégé|Protected access
Nouvel envoi|New Shipment
Expédier des objets en stock|Ship Items from Stock
Armurerie de départ|Sending armory
Objet à envoyer|Item to send
Laboratoire de destination|Receiving lab
Choisir un laboratoire|Choose a lab
Quantité à envoyer|Quantity to send
Message au laboratoire (facultatif)|Message to the lab (optional)
Message au laboratoire|Message to the lab
Ex. À déposer au bureau de réception.|E.g. Leave at the receiving desk.
Expédier le convoi RP|Dispatch RP Convoy
Convoi créé. Les objets sont en transit.|Convoy created. The items are in transit.
Aucun objet en stock à expédier depuis les armureries ouvertes.|No items are available to ship from the open armories.
Convois en transit|Convoys in Transit
Aucun convoi en transit.|No convoys in transit.
Commandes à expédier|Orders Ready to Ship
Aucune commande à expédier.|No orders ready to ship.
Derniers convois réceptionnés|Recently Received Convoys
Aucun convoi réceptionné.|No convoys received.
Ex. Umbrella Corporation|E.g. Umbrella Corporation
Nom de l’entreprise ou du bon|Company or requisition name
Nom de l’entreprise (facultatif)|Company name (optional)
Historique logistique|Logistics History
Réinitialiser l’historique logistique|Reset Logistics History
Historique des bons clôturés|Closed Requisitions
Aucun bon clôturé.|No closed requisitions.
Aucune entrée logistique clôturée à archiver.|There are no closed logistics records to archive.
Aucun bon industriel en cours.|No industrial requisitions are in progress.
Archiver les bons clôturés et les convois réceptionnés dans toutes les vues logistiques ? Les stocks, les opérations en cours, les messages et la trésorerie ne changeront pas.|Archive closed requisitions and received convoys from all logistics views? Stock, active operations, messages, and treasury will remain unchanged.
Historique logistique réinitialisé dans toutes les vues.|Logistics history reset across all views.
Programmer un convoi RP|Schedule an RP Convoy
Payer et ouvrir le convoi|Pay and Open Convoy
Convoi RP payé et créé.|RP convoy paid for and created.
Réceptionner le convoi RP|Receive RP Convoy
Dotation RP ajoutée au registre du site.|RP supplies added to the site's inventory.
Stock insuffisant. Aucun objet n’a été retiré et aucun débit n’a été effectué.|Insufficient stock. No items were removed and no payment was made.
Utiliser|Use
Épuisé|Out of stock
Enregistrer une utilisation RP|Record RP Item Use
Une unité de cet objet sera retirée du stock de cette armurerie.|One unit of this item will be removed from this armory’s stock.
Retirer 1 unité|Remove 1 unit
Utilisation enregistrée : 1 unité retirée.|Use recorded: 1 unit removed.
Le stock a changé. Vérifie la quantité disponible avant de réessayer.|Stock has changed. Check the available quantity before trying again.
Déverrouille à nouveau l’armurerie du Bastion pour continuer.|Unlock the Bastion Armory again to continue.
Arrêt d’urgence|Emergency Shutdown
ARRÊT D’URGENCE|EMERGENCY SHUTDOWN
Arrêt d’urgence de l’intranet|Emergency Intranet Shutdown
Toute la campagne sera inaccessible pendant 24 heures, même pour le niveau 5. Il n’y a pas de réouverture anticipée. Aucune donnée ne sera effacée.|The entire campaign will be unavailable for 24 hours, including to level 5. It cannot be reopened early. No data will be deleted.
Couper l’intranet pour 24 h|Shut Down for 24 Hours
Intranet arrêté d’urgence|Emergency Shutdown in Effect
Toutes les activités sont bloquées pendant 24 heures, niveau 5 compris. Les données sont conservées. L’arrêt prendra fin automatiquement.|All activities are locked for 24 hours, including for level 5. Data is preserved. The shutdown ends automatically.
Fin de l’arrêt d’urgence (heure de Paris) :|Shutdown ends (Paris time):
Arrêt d’urgence terminé. La campagne est de nouveau accessible.|Emergency shutdown ended. The campaign is available again.
Armurerie du Bastion|Bastion Armory
Code de l’armurerie|Armory code
Déverrouiller l’armurerie|Unlock Armory
CONSULTATION AUTORISÉE|ACCESS GRANTED
VERROUILLÉE|LOCKED
Afficher le code|Show code
Masquer le code|Hide code
Utilise ton propre code de connexion RP.|Use your own RP login code.
Saisis le code dédié du Bastion. Le code de connexion ne déverrouille pas l’armurerie.|Enter the dedicated Bastion code. Your login code will not unlock the armory.
TRÉSORERIE PARTAGÉE|SHARED TREASURY
Dollars fictifs, sans conversion ni paiement réel.|Fictional dollars, with no conversion or real payment.
Industrie de l’armement|Arms Industry
Trésorerie RP|RP Treasury
Registre Direction|Executive Registry
DOSSIER DU PERSONNEL / SESSION AUTORISÉE|PERSONNEL FILE / AUTHORIZED SESSION
REINE ROUGE / N04H|RED QUEEN / N04H
Écouter N04H|Play N04H audio
Habilitation|Clearance
Division / fonction|Division / role
Voir les virus et agents|View viruses and agents
Accès rapides|Quick links
REDCLIFF / DIVISION RECHERCHE|REDCLIFF / RESEARCH DIVISION
Dossiers par nature de l’agent : origines, cas documentés, observations et distinctions.|Files by agent type: origins, documented cases, observations and distinctions.
Mon dossier|My file
Filtrer par nature|Filter by type
Tous les agents|All agents
Parasites|Parasites
Agents fongiques|Fungal agents
Autres dossiers|Other records
Rechercher dans les archives|Search the archives
Ex. Veronica, Raccoon City…|E.g. Veronica, Raccoon City…
Planches d’observation : sang, circulation et agent fictif|Observation plates: blood, circulation and a fictional agent
Aucune fiche ne correspond. Essaie un autre terme ou sélectionne « Tous les agents ».|No matching files. Try another term or select “All agents”.
Archives de fiction : les fiches peuvent révéler l’intrigue. Les observations servent au RP ; elles ne décrivent pas de mécanismes médicaux réels.|Fictional archives: files may contain spoilers. These observations are for RP and do not describe real medical mechanisms.
Fiction non officielle · Aucun compte Roblox requis|Unofficial fiction · No Roblox account required
Crédits audio|Audio credits
Agent habilité|Authorized agent
DIRECTION / HABILITATION 05|EXECUTIVE BOARD / CLEARANCE 05
Registre classé : personnel RP, contrôle des accès, notes internes et traçabilité des purges. Accès réservé aux deux chefs.|Classified registry for RP personnel, access controls, internal notes and purge records. Reserved for the two directors.
Maintenance générale et couvre-feu|General maintenance and curfew
Aucune plage horaire enregistrée.|No schedule saved.
Programmer la plage horaire|Set the schedule
Modifier la plage horaire|Edit the schedule
Enregistrer les horaires|Save the schedule
Enregistrer et activer|Save and enable
Heure de début|Start time
Heure de fin|End time
Activer le couvre-feu|Enable curfew
Désactiver le dispositif|Disable the schedule
Si la fin précède le début, le couvre-feu se termine le lendemain. Si la plage active inclut l’heure actuelle, le verrouillage est immédiat.|If the end is before the start, curfew ends the next day. If the enabled period includes the current time, the lockout starts immediately.
Tout le personnel, y compris le niveau 5, sera bloqué pendant cette plage quotidienne. Si elle inclut l’heure actuelle, le blocage commence dès la confirmation.|All personnel, including level 5, will be locked out during this daily period. If it includes the current time, the lockout starts upon confirmation.
Désactiver la répétition quotidienne sans effacer la plage enregistrée ?|Disable daily recurrence without deleting the saved hours?
Programme une plage quotidienne en heure de Paris. Le site se verrouille au début et rouvre automatiquement à la fin. Modifier les horaires ne change pas l’état d’activation.|Set a daily schedule in Paris time. The site locks at the start and reopens automatically at the end. Editing the schedule does not change whether it is enabled.
Horaires enregistrés. Le couvre-feu reste désactivé.|Schedule saved. Curfew remains disabled.
Horaires enregistrés. Le couvre-feu est programmé.|Schedule saved. Curfew is enabled.
Dispositif armé pour la plage enregistrée.|The saved schedule has been enabled.
Dispositif désactivé.|Schedule disabled.
Maintenance générale manuelle|Manual general maintenance
Sonner la maintenance générale|Start general maintenance
Cette commande suspend tout le site pour la durée choisie. Pour interrompre un seul canal, utilise les commandes de son data center.|This suspends the entire site for the selected duration. To interrupt just one channel, use its data center controls.
Les connexions, les communications et les activités de toute la campagne seront suspendues. Aucune donnée ne sera supprimée.|Sign-ins, communications and campaign activities will be suspended. No data will be deleted.
Maintenance générale sonnée.|General maintenance started.
Durée (minutes)|Duration (minutes)
Durée de maintenance (1 à 120 minutes)|Maintenance duration (1 to 120 minutes)
Confirmer|Confirm
Annuler|Cancel
Lecture du registre…|Loading the registry…
Personnel RP|RP Personnel
Notes classées|Classified Notes
Purges consignées|Logged Purges
Notes de la Direction|Executive Notes
Aucune note classée.|No classified notes.
Journal des salons|Channel Log
Aucune purge de salon consignée.|No channel purges logged.
Registre du personnel|Staff Registry
Profils, habilitations et statuts RP. Aucun code de connexion n’est affiché.|RP profiles, clearances and statuses. Access codes are never shown.
Rechercher dans le personnel|Search personnel
Nom, matricule ou division|Name, staff ID or division
Aucun matricule correspondant.|No matching staff ID.
Titre de la note|Note title
Note classée RP|Classified RP note
Verser au registre|Add to registry
Note versée au registre Direction.|Note added to the Executive Registry.
Consigne ou élément de scénario…|Instruction or story note…
UMB.NET / RÉSEAU DE CAMPAGNE|UMB.NET / CAMPAIGN NETWORK
Salons de discussion, photos et mails vers les matricules RP. Aucun message n’est envoyé à une adresse e-mail réelle.|Chat channels, photos and messages to RP staff IDs. No message is sent to a real email address.
Salon général|General channel
Salon de discussion|Chat channel
Salons RP|RP Channels
Répertoire|Directory
Boîte de réception|Inbox
Reçus|Inbox
Envoyés|Sent
Destinataire RP|RP recipient
Objet|Subject
Message du mail|Email message
Message du salon|Channel message
Joindre une photo RP|Attach an RP photo
Envoyer|Send
Envoyer le message|Send message
Envoyer le mail RP|Send RP email
Message envoyé.|Message sent.
Mail RP envoyé.|RP email sent.
Envoi en cours…|Sending…
Écris un message ou joins une photo.|Write a message or attach a photo.
Afficher la photo RP|Show RP photo
Lire le message|Read message
Aucun message pour le moment.|No messages yet.
DIRECTION SUPRÊME / COMPTABILITÉ|EXECUTIVE BOARD / ACCOUNTING
Solde partagé de campagne. Les achats, créations et ventes des ateliers sont inscrits automatiquement.|Shared campaign balance. Workshop purchases, creations and sales are logged automatically.
Dotation automatique|Automatic Funding
Solde de campagne|Campaign Balance
Journal de trésorerie|Treasury Ledger
Contrats de campagne|Campaign Contracts
VENTES SCÉNARISÉES|SCRIPTED SALES
JOURNAL COMPTABLE|ACCOUNTING LEDGER
Aucun mouvement comptable enregistré.|No transactions recorded.
RÉSEAU / INFRASTRUCTURE REDCLIFF|NETWORK / REDCLIFF INFRASTRUCTURE
Chaque centre gère son propre salon RP. Une panne, une autodestruction ou une réparation ne bloque ni l’intranet ni les autres salons.|Each center runs its own RP channel. An outage, self-destruct or repair does not block the intranet or the other channels.
EN LIGNE|ONLINE
HORS LIGNE|OFFLINE
ISOLÉ|ISOLATED
MAINTENANCE DU SALON|CHANNEL MAINTENANCE
RÉPARATION DU SALON|CHANNEL REPAIR
Mettre le salon en maintenance|Start channel maintenance
Réparer le salon|Repair the channel
Retour à l’annuaire|Back to the directory
Rechercher une organisation|Search for an organization
Biographie|Biography
Implantation|Location
Spécialité|Specialty
Rôle dans le RP|Role in RP
Sources|Sources
Tous les rapports|All reports
Rechercher dans les rapports|Search the reports
Filtrer|Filter
Rechercher|Search
Catégorie|Category
Quantité|Quantity
Choisir un site|Select a site
Sélectionner|Select
Site de destination|Destination site
Site de départ|Departure site
Options|Options
Autres|Other
Ouvrir|Open
Fermer|Close
Enregistrer|Save
Actualiser|Refresh
Modifier|Edit
Retour|Back
Voir les alertes|View alerts
Masquer|Hide
PÉRIMÈTRE SOUS VEILLE|PERIMETER UNDER WATCH
ENQUÊTE INTERNE|INTERNAL INVESTIGATION
Disponible|Available
Vendu|Sold
En convoi|In transit
Réceptionné|Received
Habilitation insuffisante.|Insufficient clearance.
L’état a déjà changé. Actualise les données.|The status has already changed. Refresh the data.
Vérifie les champs renseignés.|Check the information you entered.
Le journal de campagne est plein.|The campaign log is full.
Service indisponible. Aucune confirmation reçue.|Service unavailable. No confirmation received.
Ce canal a été coupé. Choisis un salon en ligne.|This channel was shut down. Select an online channel.
Photo invalide ou trop volumineuse.|The photo is invalid or too large.
Élément introuvable ou indisponible.|That item is unavailable or could not be found.
Les opérations sont suspendues pendant la maintenance générale.|Operations are suspended during general maintenance.
Choisis une durée entière entre 1 et 120 minutes.|Choose a whole number between 1 and 120 minutes.
Ce compte ne dispose pas d’un accès pendant le couvre-feu.|This account cannot access the site during curfew.
Choisis deux heures différentes, entre 00:00 et 23:59.|Choose two different times between 00:00 and 23:59.
Enregistre d’abord une heure de début et une heure de fin.|Save a start and end time first.
Solde RP insuffisant. Aucun débit effectué.|Insufficient RP funds. No payment was made.
Les textes RP et les voix restent dans leur langue d’origine.|RP texts and voice recordings remain in their original language.
Avis de recherche & opérations|Wanted Notices & Operations
REDCLIFF / BUREAU DE LIAISON RP|REDCLIFF / RP LIAISON OFFICE
Consulte les avis, les pièces du dossier et les décisions de la Direction pour la campagne Redcliff.|View notices, case evidence and Executive Board decisions for the Redcliff campaign.
Fiction RP uniquement.|Fictional roleplay only.
Utilise des noms de personnages et des captures d’avatars. N’ajoute pas de photo ni de donnée sur une personne réelle.|Use character names and avatar screenshots. Do not add photos or information about real people.
ACCÈS DIRECTION · NIVEAU 5|EXECUTIVE ACCESS · LEVEL 5
CONSULTATION UNIQUEMENT|READ ONLY
Vues du bureau de liaison|Liaison office views
Avis de recherche|Wanted notices
Opérations RP|RP operations
Messages spéciaux|Special messages
Nouvel avis|New notice
Nouvelle opération|New operation
Nouveau message|New message
Modifier l’avis|Edit notice
Modifier l’opération|Edit operation
Modifier le message|Edit message
Aucun avis de recherche pour le moment.|No wanted notices yet.
Aucune opération RP pour le moment.|No RP operations yet.
Aucun message spécial pour le moment.|No special messages yet.
Enquête RP|RP inquiry
Veille RP|RP monitoring
Liaison RP|RP liaison
Recherche d’archives RP|RP archive research
Assistance RP|RP assistance
Autre scénario RP|Other roleplay scenario
Avis actif|Active notice
Avis classé|Filed notice
Planifiée|Planned
En cours|In progress
En pause|Paused
Clôturée|Closed
Publié|Published
Archivé|Archived
Classer l’avis|File notice
Réactiver l’avis|Reactivate notice
Lancer|Start
Suspendre|Pause
Reprendre|Resume
Clôturer|Close operation
Archiver le message|Archive message
Republier le message|Republish message
Portrait d’avatar RP|RP avatar portrait
Capture de preuve RP|RP evidence screenshot
Image indisponible.|Image unavailable.
Une autre session a modifié ce dossier. Ferme ce formulaire, puis rouvre le dossier actualisé.|Another session updated this record. Close this form, then reopen the updated record.
Ce registre a atteint sa limite. Aucun dossier n’a été supprimé.|This registry is full. No records were deleted.
Confirme que le contenu concerne uniquement des personnages fictifs et la campagne RP.|Confirm that the content concerns only fictional characters and the RP campaign.
Chercher un titre ou une référence|Search by title or reference
Afficher les archives|Show archives
Rechercher dans le registre|Search the registry
Historique du message|Message history
Pièces et historique RP|Evidence and RP history
Preuves et éléments RP|Evidence and RP details
Aucune pièce jointe ni preuve écrite.|No attachment or written evidence.
Journal des statuts|Status history
Registre indisponible.|Registry unavailable.
Sans portrait|No portrait
Motif de la recherche|Reason for the notice
Objectif RP|RP objective
Avis lié :|Linked notice:
Opération liée :|Linked operation:
Aucun résultat pour cette recherche.|No matching records.
Retirer l’image actuelle|Remove current image
Choisir un type|Select a type
Aucun avis lié|No linked notice
Aucune opération liée|No linked operation
Nom du personnage RP|RP character name
Titre du message|Message title
Nom de l’opération RP|RP operation name
Type d’opération|Operation type
Avis associé (facultatif)|Linked notice (optional)
Opération associée (facultatif)|Linked operation (optional)
Contenu du message|Message content
Je confirme que ce contenu concerne uniquement des personnages fictifs et la campagne RP.|I confirm that this content concerns only fictional characters and the RP campaign.
Enregistrer les modifications|Save changes
Créer l’opération|Create operation
Publier|Publish
Visible par tout le personnel connecté. Le niveau 5 est seul habilité à écrire.|Visible to all signed-in staff. Only level 5 can write.
Images RP : JPG, PNG ou WebP, 10 Mo maximum par fichier.|RP images: JPG, PNG or WebP, up to 10 MB each.
Enregistrement…|Saving…
Dossier enregistré dans le registre.|Record saved in the registry.
Statut mis à jour dans le registre.|Status updated in the registry.
Le changement est ajouté au journal RP et visible par le personnel connecté.|The change is added to the RP log and visible to signed-in staff.
`.trim().split('\n').map(line=>line.split('|')));

const uiPatterns=[
  [/^Entre (.+) \(([A-Z0-9]+)\) et (.+) \(([A-Z0-9]+)\)$/u,(_,from,fromId,to,toId)=>`Between ${from} (${fromId}) and ${to} (${toId})`],
  [/^ESSAIS RESTANTS : (.+)$/u,(_,value)=>`ATTEMPTS LEFT: ${value}`],
  [/^Matricule ou code incorrect\. Il reste (\d+) essai(?:s)?\.$/u,(_,n)=>`Incorrect staff ID or code. ${n} attempt${n==='1'?'':'s'} left.`],
  [/^Niveau (\d+)( · Accès total)?$/u,(_,n,total)=>`Level ${n}${total?' · Full access':''}`],
  [/^(.+) \/ NIVEAU (\d+)$/u,(_,id,n)=>`${id} / LEVEL ${n}`],
  [/^Bienvenue, (.+)\. Ravie de vous revoir\.$/u,(_,name)=>`Welcome back, ${name}.`],
  [/^Dispositif armé · (\d\d:\d\d) à (\d\d:\d\d)( le lendemain)? \(Paris\)\.$/u,(_,start,end,next)=>`Schedule enabled · ${start} to ${end}${next?' next day':''} (Paris).`],
  [/^Plage enregistrée · dispositif désactivé · (\d\d:\d\d) à (\d\d:\d\d)( le lendemain)? \(Paris\)\.$/u,(_,start,end,next)=>`Schedule saved · disabled · ${start} to ${end}${next?' next day':''} (Paris).`],
  [/^(\d\d:\d\d - \d\d:\d\d) \(\+1 j\)$/u,(_,hours)=>`${hours} (+1 day)`],
  [/^Prochain versement : (.+)$/u,(_,value)=>`Next payment: ${value}`],
  [/^Prochain crédit prévu le (.+) \(heure de Paris\)\. Les crédits apparaissent dans le journal comptable\.$/u,(_,value)=>`Next payment: ${value} (Paris time). Payments appear in the accounting ledger.`],
  [/^À : (.+)$/u,(_,recipient)=>`To: ${recipient}`],
  [/^Objets en stock : (\d+)$/u,(_,count)=>`Items in stock: ${count}`],
  [/^Disponible au départ : (\d+)$/u,(_,count)=>`Available to ship: ${count}`],
  [/^Quantité envoyée : (\d+)$/u,(_,count)=>`Quantity sent: ${count}`],
  [/^Trajet : (.+)$/u,(_,route)=>`Route: ${route}`],
  [/^Coût du convoi : (.+)$/u,(_,cost)=>`Convoy cost: ${cost}`],
  [/^Entrées clôturées à archiver : (\d+)$/u,(_,count)=>`Closed records to archive: ${count}`],
  [/^Utiliser : (.+)$/u,(_,model)=>`Use: ${model}`],
  [/^Épuisé : (.+)$/u,(_,model)=>`Out of stock: ${model}`],
  [/^Confirmer l’arrivée de (\d+) entrée\(s\) à (.+) \?$/u,(_,count,site)=>`Confirm receipt of ${count} at ${site}?`],
  [/^\+ (.+) tous les (\d+) h$/u,(_,amount,hours)=>`+ ${amount} every ${hours} hrs`],
];
let uiLanguage='fr';
function uiText(source){
  if(uiLanguage!=='en'||typeof source!=='string'||!source.trim())return source;
  const content=source.trim(),key=content.replace(/'/g,'’');
  let target=uiTerms.get(key);
  if(!target)for(const [pattern,render] of uiPatterns){
    const match=key.match(pattern);
    if(match){target=render(...match);break;}
  }
  return target?source.replace(content,()=>target):source;
}

document.addEventListener('DOMContentLoaded',()=>{
  const controls=[document.getElementById('site-language'),document.getElementById('curfew-language')];
  const sourceText=new WeakMap(),sourceAttrs=new WeakMap(),attrs=['aria-label','placeholder','title','alt'];
  const skip='script,style,[data-ui-original],.message-copy,[lang]:not(html)';
  function translateText(node){
    if(!node.parentElement||node.parentElement.closest(`${skip},textarea`))return;
    const prior=sourceText.get(node);
    const original=prior&&node.data===prior.output?prior.original:node.data;
    const output=uiText(original);
    if(output!==original)sourceText.set(node,{original,output});
    else sourceText.delete(node);
    if(node.data!==output)node.data=output;
  }
  function translateAttr(element,key){
    if(!element.hasAttribute(key)||element.closest(skip))return;
    let record=sourceAttrs.get(element);
    const value=element.getAttribute(key),prior=record?.get(key);
    const original=prior&&value===prior.output?prior.original:value;
    const output=uiText(original);
    if(output!==original){
      if(!record)sourceAttrs.set(element,record=new Map());
      record.set(key,{original,output});
    }else record?.delete(key);
    if(value!==output)element.setAttribute(key,output);
  }
  function translateTree(node){
    if(node.nodeType===Node.TEXT_NODE){translateText(node);return;}
    if(node.nodeType!==Node.ELEMENT_NODE||node.matches(skip))return;
    for(const key of attrs)translateAttr(node,key);
    for(const child of node.childNodes)translateTree(child);
  }
  const observer=new MutationObserver(records=>{
    if(uiLanguage==='fr')return;
    for(const record of records){
      if(record.type==='attributes')translateAttr(record.target,record.attributeName);
      else if(record.type==='characterData')translateText(record.target);
      else for(const node of record.addedNodes)translateTree(node);
    }
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
  function show(language){
    uiLanguage=language;
    document.documentElement.lang=language;
    for(const control of controls)control.value=language;
    translateTree(document.body);
  }
  const url=new URL(location.href);
  const valid=value=>value==='en'||value==='fr';
  const localChoice=url.searchParams.get('lang');
  if(valid(localChoice))show(localChoice);
  let chosen=valid(localChoice),prefsWrite=Promise.resolve();
  for(const control of controls)control.addEventListener('change',()=>{
    const language=control.value;
    if(!valid(language))return;
    chosen=true;show(language);
    try{
      const next=new URL(location.href);
      next.searchParams.set('lang',language);
      history.replaceState(history.state,'',next);
    }catch{/* Restricted iframe: use the server-side browser preference. */}
    if(window.UMBRELLA_API!==null){
      const write=()=>fetch(endpoint('language'),{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({language}),signal:AbortSignal.timeout(5000)});
      prefsWrite=prefsWrite.then(write,write).catch(()=>{});
    }
  });
  if(!chosen&&window.UMBRELLA_API!==null)void fetch(endpoint('language'),{cache:'no-store',signal:AbortSignal.timeout(5000)})
    .then(response=>response.ok?response.json():null)
    .then(result=>{if(!chosen&&valid(result?.language))show(result.language);}).catch(()=>{});
});
