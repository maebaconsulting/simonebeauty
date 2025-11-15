# Spécifications Complètes - Plateforme Simone Paris

**Version Fusionnée:** 2.0  
**Date:** Novembre 2025  
**Statut:** Document de Référence Unifié

---

## Note sur ce Document

Ce document fusionne intelligemment deux spécifications complémentaires :
- **Spec_01** : Rapport fonctionnel détaillé (focus UX, design système, conventions)
- **Spec_02** : Spécifications techniques (focus architecture, modèle de données, API)

Le résultat est un document unique, sans redondance, couvrant tous les aspects de la plateforme.

---

## Table des Matières

1. [Sommaire Exécutif](#1-sommaire-exécutif)
2. [Vision Produit](#2-vision-produit)
3. [Écosystème des Utilisateurs](#3-écosystème-des-utilisateurs)
4. [Architecture Technique](#4-architecture-technique)
5. [Modèle de Données](#5-modèle-de-données)
6. [Gestion des Utilisateurs](#6-gestion-des-utilisateurs)
7. [Parcours de Réservation](#7-parcours-de-réservation)
8. [Système de Disponibilités](#8-système-de-disponibilités)
9. [Monétisation et Paiements](#9-monétisation-et-paiements)
10. [Gestion des Prestataires](#10-gestion-des-prestataires)
11. [Administration](#11-administration)
12. [Fonctionnalités B2B](#12-fonctionnalités-b2b)
13. [Communication](#13-communication)
14. [Design Système](#14-design-système)
15. [Sécurité](#15-sécurité)
16. [Exigences Non-Fonctionnelles](#16-exigences-non-fonctionnelles)
17. [Edge Functions (API)](#17-edge-functions-api)
18. [Conventions de Développement](#18-conventions-de-développement)

---

**Rapport Fonctionnel de la Plateforme Simone**

**Sommaire Exécutif**

La plateforme Simone est une solution SaaS premium conçue pour
orchestrer la gestion des services de bien-être à domicile. Sa
proposition de valeur fondamentale repose sur trois piliers fonctionnels
: un parcours de réservation intelligent et flexible qui optimise
l\'expérience client et la logistique des prestataires ; un écosystème
commercial robuste pour la monétisation, incluant la gestion des
paiements, les promotions et une offre B2B dédiée ; et des outils
d\'administration complets qui assurent un pilotage opérationnel et
stratégique de l\'activité. La plateforme s\'adresse à un écosystème
d\'utilisateurs interconnectés : les clients particuliers et entreprises
en quête d\'une expérience fluide, les prestataires de services
cherchant à optimiser leur activité, et les administrateurs supervisant
l\'ensemble des opérations.

**1.0 Introduction et Vision Produit**

La plateforme Simone est une solution logicielle (SaaS) premium et
complète, conçue pour orchestrer avec élégance la gestion des services
de bien-être à domicile. Elle s\'articule autour d\'une double
proposition de valeur : offrir une expérience de réservation
exceptionnellement fluide et intuitive pour le client final, tout en
fournissant un écosystème d\'outils de gestion puissants pour les
administrateurs et les prestataires de services. Chaque interaction, de
la découverte d\'un soin à la finalisation du paiement, a été pensée
pour refléter un standard de qualité et de simplicité élevé. Ce document
a pour objectif de détailler l\'ensemble des capacités fonctionnelles de
la plateforme, structuré pour offrir une vision claire et exploitable à
un Product Owner.

**2.0 Gestion des Utilisateurs et des Accès**

La gestion stratégique des utilisateurs et de leurs droits d\'accès
constitue le fondement d\'une plateforme sécurisée et personnalisée. Le
système de Simone est conçu pour être à la fois robuste et flexible,
garantissant que chaque acteur --- client, prestataire, gestionnaire ou
administrateur --- interagisse avec une interface et des outils
parfaitement adaptés à son rôle. Cette segmentation fine est la clé pour
offrir des expériences sur mesure, optimiser les workflows opérationnels
et protéger l\'intégrité des données à tous les niveaux.

**2.1 Système d\'Authentification Sécurisé**

Le module d\'authentification garantit un accès sécurisé et une
expérience utilisateur fluide, en intégrant des mécanismes de
vérification modernes.

-   **Inscription et Vérification :** Le processus d\'inscription
    requiert une vérification obligatoire par e-mail. Un code unique à 6
    chiffres est envoyé à l\'utilisateur, qui doit le saisir pour
    activer son compte. Pour renforcer la sécurité, ce code a une durée
    de validité limitée à 15 minutes et le nombre de tentatives de
    saisie est plafonné.

-   **Connexion :** L\'accès à la plateforme s\'effectue de manière
    standard et sécurisée via la saisie d\'un e-mail et d\'un mot de
    passe.

-   **Réinitialisation de Mot de Passe :** En cas d\'oubli,
    l\'utilisateur peut initier une procédure de réinitialisation de mot
    de passe. Un code de vérification est envoyé par e-mail pour
    autoriser la création d\'un nouveau mot de passe, garantissant que
    seul le propriétaire du compte peut effectuer cette action.

-   **Gestion de Session :** La session utilisateur est maintenue de
    manière persistante après la connexion, permettant une navigation
    fluide sans avoir à s\'identifier à chaque visite, tout en
    respectant les meilleures pratiques de sécurité.

**2.2 Rôles et Profils Utilisateurs**

La plateforme segmente les utilisateurs en plusieurs profils distincts,
chacun disposant de droits et d\'interfaces spécifiques à ses fonctions
au sein de l\'écosystème.

  --------------------------------------------------------------------------
  ID de    Type             Description du Rôle Fonctionnel
  Profil   d\'Utilisateur   
  -------- ---------------- ------------------------------------------------
  1, 5     Administrateur / Accès complet à la gestion de la plateforme, à
           Super Admin      la configuration système, à la supervision des
                            opérations et aux analytiques.

  4        Manager /        Gestion des opérations quotidiennes, y compris
           Gestionnaire     les réservations, les prestataires et le support
                            client, avec des droits inférieurs à
                            l\'administrateur.

  7        Prestataire      Professionnel indépendant offrant ses services.
           (Contractor)     Gère son profil public, ses disponibilités, ses
                            services, ses réservations et ses revenus.

  2        Client           Utilisateur final qui recherche, réserve et paie
           Particulier      pour des services à domicile. Gère son compte,
                            son historique et ses moyens de paiement.

  3        Client           Compte d\'entreprise qui réserve des services
           Entreprise (B2B) pour ses employés ou événements, bénéficiant de
                            tarifs et de fonctionnalités spécifiques.

  6        Staff            Rôle interne avec des permissions limitées pour
                            des tâches de support spécifiques.
  --------------------------------------------------------------------------

**2.3 Espace Client**

Une fois connecté, le client particulier dispose d\'un espace personnel
complet pour gérer l\'ensemble de son activité sur la plateforme.

-   Gestion du profil personnel (nom, coordonnées de contact, mot de
    passe).

-   Gestion des adresses de service enregistrées pour accélérer les
    futures réservations.

-   Consultation de l\'historique détaillé des réservations (passées, à
    venir, annulées).

-   Gestion des moyens de paiement sauvegardés de manière sécurisée via
    l\'intégration Stripe.

-   Gestion et activation des cartes cadeaux pour les utiliser comme
    moyen de paiement.

-   Configuration des préférences de notification (e-mail, SMS, in-app).

**2.4 Interface Prestataire**

Les prestataires bénéficient d\'une interface dédiée et centralisée,
conçue pour leur permettre de gérer leur activité en toute autonomie et
efficacité.

-   **Tableau de Bord :** Une vue d\'ensemble synthétique présentant les
    revenus générés, les réservations à venir, ainsi que des
    statistiques de performance clés.

-   **Gestion du Profil Public :** Des outils pour personnaliser leur
    page publique, incluant la modification de la photo de profil, des
    spécialités, des zones d\'intervention desservies, et la création
    d\'une URL personnalisée (slug).

-   **Gestion des Disponibilités :** Un calendrier interactif pour
    configurer les horaires de travail réguliers, ajouter des
    indisponibilités ponctuelles ou récurrentes. Cette fonctionnalité
    est le cœur de leur autonomie et s\'appuie sur le nouveau système de
    rendez-vous (appointment_contractor_schedules,
    appointment_unavailabilities), leur permettant également de
    synchroniser leur planning avec des calendriers externes comme
    Google Calendar.

-   **Gestion des Réservations :** Une interface pour consulter les
    détails des réservations assignées, les confirmer, les refuser ou
    les annuler en cas de besoin.

-   **Catalogue de Services :** La possibilité de visualiser les
    services disponibles sur la plateforme et de soumettre des demandes
    pour être autorisé à en proposer de nouveaux.

-   **Suivi des Revenus :** Un accès transparent à l\'historique des
    paiements reçus, au détail des commissions prélevées par la
    plateforme, et aux informations sur les virements à venir.

*Implication Stratégique : La gestion rigoureuse des rôles et des accès
n\'est pas une simple fonctionnalité de sécurité. C\'est le fondement
qui permet de créer des expériences utilisateurs distinctes et
optimisées pour chaque partie prenante. Pour un prestataire, cela
signifie autonomie et efficacité ; pour un client, simplicité et
confiance ; pour un administrateur, contrôle et vision globale. Cette
segmentation est un prérequis essentiel à la scalabilité de la
plateforme.*

**3.0 Parcours de Réservation : Le Cœur de l\'Expérience**

Le système de réservation est la fonctionnalité centrale et la plus
critique de la plateforme Simone. Il a été conçu pour être à la fois
intelligent, flexible et intuitif, guidant l\'utilisateur de manière
transparente depuis la découverte d\'un service jusqu\'à sa confirmation
finale. Ce parcours optimisé vise à éliminer toute friction pour
transformer l\'intention en une réservation confirmée en quelques clics.

**3.1 Découverte et Sélection des Services**

Pour permettre aux utilisateurs de trouver le service idéal, la
plateforme met à leur disposition plusieurs outils de navigation et de
recherche performants.

-   **Catalogue Structuré :** Les services sont organisés de manière
    logique en catégories et sous-catégories (ex: Beauté \> Soins du
    visage), facilitant une exploration intuitive de l\'offre.

-   **Recherche Intelligente :** Une barre de recherche textuelle permet
    de trouver rapidement des services. Le moteur de recherche
    sous-jacent est performant et insensible aux accents, garantissant
    des résultats pertinents même en cas de saisie approximative.

-   **Filtrage Avancé :** Les utilisateurs peuvent affiner les résultats
    de recherche en appliquant des filtres multiples tels que la zone
    géographique (code postal), la catégorie de service, une fourchette
    de prix ou la durée de la prestation.

**3.2 Calcul et Affichage des Disponibilités**

Le système de calcul des disponibilités est l\'un des piliers de
l\'intelligence de la plateforme et constitue une évolution stratégique
majeure par rapport au système hérité (basé sur la table reservations).
Ce \"Nouveau Système de Rendez-vous\", s\'appuyant sur les tables
appointment\_\*, garantit que seuls les créneaux réalisables sont
proposés au client.

-   **Calcul en Temps Réel :** Les créneaux horaires présentés à
    l\'utilisateur ne sont pas statiques ; ils sont calculés
    dynamiquement au moment de la demande pour refléter la situation la
    plus à jour.

-   **Prise en Compte des Contraintes :** L\'algorithme de calcul
    intègre un ensemble complexe de contraintes pour assurer la
    faisabilité de chaque rendez-vous :

    -   Les horaires de travail définis par le prestataire.

    -   Les indisponibilités enregistrées, qu\'elles soient saisies
        manuellement ou synchronisées depuis un calendrier externe.

    -   Les réservations déjà confirmées dans son agenda.

    -   Le temps de trajet estimé entre deux rendez-vous consécutifs
        pour optimiser les tournées.

    -   Un temps tampon (buffer) de préparation entre deux prestations.

**3.3 Processus de Réservation Étape par Étape**

Le parcours de réservation est découpé en étapes claires et logiques
pour guider l\'utilisateur sans effort jusqu\'à la confirmation.

1.  **Sélection du Service et Adresse :** L\'utilisateur choisit le
    service désiré et renseigne l\'adresse d\'intervention. La saisie de
    l\'adresse est simplifiée par une fonction d\'autocomplétion fournie
    par Google Places.

2.  **Choix du Créneau :** Une interface de calendrier conviviale
    présente les créneaux disponibles, calculés en temps réel en
    fonction des contraintes du prestataire et de l\'adresse fournie.

3.  **Assignation du Prestataire :** Le système propose automatiquement
    le prestataire le plus pertinent en se basant sur un algorithme
    d\'assignation intelligent qui prend en compte la localisation, les
    spécialités et la charge de travail.

4.  **(Optionnel) Sélection Manuelle :** Si la configuration le permet,
    l\'utilisateur peut avoir la possibilité de choisir manuellement son
    prestataire parmi une liste de professionnels disponibles pour le
    créneau sélectionné.

5.  **Ajout de Services Additionnels :** Avant de finaliser,
    l\'utilisateur a la possibilité d\'agrémenter sa réservation avec
    des options ou des extensions de durée proposées.

6.  **Paiement et Confirmation :** L\'utilisateur finalise sa
    réservation en procédant à une pré-autorisation de paiement
    sécurisée via Stripe. Il peut également appliquer un code
    promotionnel ou le solde d\'une carte cadeau. Un récapitulatif
    complet est affiché avant la validation finale.

**3.4 Gestion Post-Réservation**

Une fois la réservation confirmée, la plateforme offre des outils pour
la gérer de manière flexible, tout en appliquant des règles claires.

-   **Statuts de Réservation :** Chaque réservation évolue à travers
    différents statuts qui reflètent son cycle de vie.

  ----------------------------------------------------------------------------
  Statut          Signification Fonctionnelle
  --------------- ------------------------------------------------------------
  **En attente**  La réservation est créée mais attend la confirmation du
                  prestataire.

  **Confirmée**   Le prestataire a accepté la réservation ; le rendez-vous est
                  bloqué.

  **Terminée**    La prestation a eu lieu.

  **Annulée**     La réservation a été annulée par le client ou le
                  prestataire.
  ----------------------------------------------------------------------------

-   **Modification :** Le client a la possibilité de modifier
    gratuitement sa réservation jusqu\'à deux fois, à condition que la
    demande soit faite plus de 24 heures avant le début prévu de la
    prestation.

-   **Annulation :** La politique d\'annulation est gérée
    automatiquement par le système. Un remboursement intégral (100%) est
    effectué pour toute annulation à plus de 48h. Ce montant passe à
    **70%** si l\'annulation intervient entre 24 et 48h avant le
    rendez-vous, et à **50%** pour toute annulation à moins de 24h.

*Implication Stratégique : L\'intelligence de l\'algorithme de
disponibilité, qui intègre les temps de trajet et les tampons, n\'est
pas seulement une commodité pour le client. C\'est un levier majeur
d\'optimisation opérationnelle pour les prestataires, augmentant leur
capacité de revenus journaliers et réduisant les retards, ce qui
renforce directement la fiabilité et la perception premium de la marque
Simone.*

**4.0 Écosystème Commercial et Monétisation**

Au-delà de la simple mise en relation, la plateforme Simone intègre un
ensemble de fonctionnalités commerciales sophistiquées. Celles-ci sont
conçues pour gérer les flux financiers de manière sécurisée, stimuler
les ventes grâce à des outils marketing ciblés, et adresser des segments
de clientèle spécifiques tels que le marché B2B. Cet écosystème
commercial est essentiel pour assurer la croissance et la rentabilité de
la plateforme.

**4.1 Gestion des Paiements**

Le traitement des transactions financières est entièrement sécurisé et
automatisé, offrant une tranquillité d\'esprit aux clients comme aux
prestataires.

-   **Intégration Stripe :** L\'ensemble des flux de paiement est géré
    via Stripe, une référence mondiale en matière de paiement en ligne,
    garantissant sécurité et conformité.

-   **Flux de Pré-autorisation et Capture :** Lors de la réservation, le
    montant n\'est pas débité immédiatement. Une pré-autorisation est
    effectuée sur la carte du client. La capture du paiement (le débit
    effectif) n\'est déclenchée qu\'après la confirmation du service par
    le prestataire, ou une fois la prestation terminée.

-   **Gestion des Commissions :** La plateforme calcule et prélève
    automatiquement sa commission sur chaque transaction. Le revenu net
    est ensuite versé directement sur le compte du prestataire via
    Stripe Connect.

-   **Remboursements :** Les remboursements, en cas d\'annulation
    éligible, sont gérés automatiquement par le système, en application
    directe des règles commerciales définies.

**4.2 Produits, Services et Packages**

Le catalogue de la plateforme est structuré pour permettre une gestion
flexible des offres commerciales.

-   **Gestion du Catalogue :** Les administrateurs peuvent définir des
    services avec des attributs précis : prix, durée, description,
    photos, catégories, etc.

-   **Packages :** La plateforme permet de créer des \"packages\",
    regroupant plusieurs services en une offre unique. Cette
    fonctionnalité est idéale pour proposer des offres thématiques ou
    des parcours de soins complets, souvent à un tarif préférentiel.

-   **Boutique E-commerce :** En complément des services, une boutique
    e-commerce intégrée permet la vente de produits physiques, avec une
    gestion des stocks en temps réel.

**4.3 Promotions et Cartes Cadeaux**

Pour dynamiser les ventes et fidéliser la clientèle, Simone intègre des
outils marketing puissants.

-   **Codes Promotionnels :** Les administrateurs peuvent créer des
    codes de réduction personnalisés (en montant fixe ou en
    pourcentage). Des conditions d\'application fines peuvent être
    définies : période de validité, montant d\'achat minimum, services
    éligibles, etc.

-   **Cartes Cadeaux :** Un système complet de cartes cadeaux est
    disponible, offrant une grande flexibilité :

    -   Disponibilité de cartes **virtuelles** (envoyées par e-mail) et
        **physiques**.

    -   Un processus d\'**activation sécurisé** qui lie la carte au
        compte de l\'utilisateur.

    -   Utilisation comme moyen de paiement, pour un règlement **partiel
        ou total** d\'une réservation.

    -   Une gestion administrative complète du **solde**, de
        l\'historique d\'utilisation et de la période de validité.

**4.4 Offre Entreprise (B2B)**

Simone a développé une verticale stratégique dédiée aux entreprises,
avec des services et des fonctionnalités sur mesure.

-   **Catalogue de Services Dédiés :** Une offre de services spécialisés
    a été conçue pour le monde de l\'entreprise, organisée autour de
    piliers clairs : Bien-être, Beauté, Santé et Événementiel.
    Actuellement, sur 88 services visibles, 7 sont marqués comme
    \"entreprise ready\", l\'objectif étant d\'étendre cette sélection
    pour couvrir l\'ensemble de l\'offre B2B.

-   **Service \"Ready to Go\" :** Un service premium d\'intervention
    urgente en moins de 2 heures est proposé, avec un **surcoût de
    +30%**, pour répondre aux besoins de dernière minute des
    professionnels.

-   **Comptes et Tarifs Négociés :** Les entreprises peuvent demander la
    création d\'un compte B2B. Après validation manuelle, elles accèdent
    à des tarifs négociés et à des options de facturation groupée.

-   **Cartes Cadeaux Corporate :** Les cartes cadeaux B2B bénéficient
    d\'avantages spécifiques. Alors que les cartes standard ont une
    validité de 12 mois, celle des cartes corporate est étendue à 24
    mois, et elles peuvent être personnalisées avec le logo de
    l\'entreprise.

*Implication Stratégique : L\'écosystème commercial transforme la
plateforme d\'un simple outil de réservation en un moteur de croissance.
Les promotions et cartes cadeaux sont des leviers directs pour
l\'acquisition et la fidélisation, augmentant la valeur vie client. La
verticale B2B, avec ses offres sur mesure, ouvre un segment de marché à
forte valeur et à revenus récurrents, diversifiant ainsi les sources de
profit de l\'entreprise.*

**5.0 Outils d\'Administration et de Pilotage (Back-Office)**

Le back-office est le centre de contrôle névralgique de la plateforme
Simone. Il a été conçu pour fournir aux équipes administratives un
ensemble complet d\'outils leur permettant de superviser les opérations
en temps réel, de gérer l\'ensemble des utilisateurs, de configurer le
système et d\'analyser la performance globale de l\'activité.

**5.1 Tableau de Bord Analytique**

Dès la connexion, l\'administrateur accède à un tableau de bord
synthétique qui présente les indicateurs de performance (KPIs) les plus
critiques.

-   **Indicateurs Financiers :** Suivi des revenus mensuels et annuels,
    avec une répartition visuelle par type de service pour identifier
    les offres les plus populaires.

-   **Métrique de Réservation :** Visualisation du volume total de
    réservations, ainsi que des taux de confirmation et d\'annulation,
    permettant de mesurer la fluidité opérationnelle.

-   **Performance des Prestataires :** Classement des prestataires les
    plus performants (en termes de chiffre d\'affaires ou de volume) et
    suivi des nouvelles inscriptions.

-   **Activité des Clients :** Suivi de l\'acquisition de nouveaux
    clients, analyse du taux de rétention et du panier moyen par
    réservation.

**5.2 Gestion Opérationnelle**

Le back-office centralise les outils nécessaires à la gestion des
opérations quotidiennes de la plateforme.

-   **Gestion Centralisée des Réservations :** Les administrateurs ont
    la capacité de visualiser, modifier, et si nécessaire, d\'annuler
    n\'importe quelle réservation transitant par la plateforme.

-   **Gestion des Utilisateurs :** Des outils complets permettent de
    créer, modifier, activer ou désactiver les comptes des clients et
    des prestataires, assurant un contrôle total sur la base
    d\'utilisateurs.

-   **Validation des Prestataires :** Un workflow dédié permet
    d\'examiner les candidatures de nouveaux prestataires, incluant la
    vérification des documents légaux et des certifications avant
    d\'activer leur profil.

-   **Configuration Système :** Une interface de configuration permet
    d\'ajuster les paramètres généraux de la plateforme, tels que la
    configuration des intégrations externes (Easy Appointments) ou les
    paramètres de paiement.

**5.3 Système de Tâches Internes**

Pour optimiser les processus internes, la plateforme intègre un système
de gestion de tâches qui fonctionne comme un outil de workflow
collaboratif.

-   **Création et Assignation :** Les administrateurs peuvent créer des
    tâches spécifiques (ex: \"Vérifier un paiement échoué\", \"Contacter
    un client suite à une plainte\") et les assigner à des membres de
    l\'équipe administrative.

-   **Suivi par Statut et Priorité :** Chaque tâche peut être suivie à
    l\'aide de statuts clairs (À faire, En cours, Terminé) et de niveaux
    de priorité, assurant que les actions les plus urgentes sont
    traitées en premier.

-   **Lien avec les Opérations :** Pour fournir un contexte immédiat,
    les tâches peuvent être directement liées à des entités de la
    plateforme comme une réservation, un client ou un prestataire.

**5.4 Gestion de Contenu (CMS)**

La plateforme intègre un système de gestion de contenu (CMS) qui offre
une autonomie complète aux équipes marketing et éditoriales.

-   **Gestion des Pages et Sections :** Il est possible de créer, de
    modifier et de publier le contenu des pages institutionnelles du
    site (par exemple, \"À propos\", \"FAQ\") sans nécessiter
    d\'intervention technique.

-   **Blog Intégré :** Un outil de blogging complet permet de rédiger,
    catégoriser, et publier des articles pour animer la communication de
    la marque et améliorer le référencement naturel.

-   **Bibliothèque Média :** Un espace centralisé permet de téléverser
    et de gérer l\'ensemble des images et des fichiers médias utilisés
    sur le site, garantissant cohérence et facilité de mise à jour.

*Implication Stratégique : Le back-office est le garant de la
scalabilité et de la qualité de service. Il fournit les leviers de
contrôle pour gérer la croissance (validation des prestataires, support
client), les outils de pilotage pour prendre des décisions basées sur
les données (analytics), et l\'agilité pour s\'adapter au marché (CMS).
C\'est le centre névralgique qui permet à l\'entreprise de maîtriser ses
opérations tout en se développant.*

**6.0 Outils de Communication**

Dans une plateforme de services où l\'humain est au cœur de
l\'expérience, la communication est un pilier fondamental. C\'est
pourquoi Simone intègre des outils de communication en temps réel ainsi
qu\'un système de notifications automatisé et multicanal. L\'objectif
est de garantir que les clients, les prestataires et les administrateurs
restent parfaitement informés à chaque étape clé du parcours, renforçant
ainsi la confiance et la qualité de service.

**6.1 Chat en Temps Réel**

Un système de messagerie instantanée est intégré à la plateforme pour
faciliter les échanges directs et efficaces.

-   **Communication Contextuelle :** Le chat est le plus souvent lié à
    une réservation spécifique. Cela permet au client et au prestataire
    d\'échanger des informations pratiques (ex: précisions sur
    l\'adresse, matériel à prévoir) avec un contexte clair, évitant
    toute confusion.

-   **Canal de Support :** Un canal de chat dédié est également
    disponible pour permettre aux utilisateurs de contacter directement
    l\'équipe de support de Simone en cas de question ou de problème.

-   **Fonctionnalités :** L\'outil de chat offre les fonctionnalités
    essentielles : messagerie instantanée, partage d\'images et envoi de
    notifications pour alerter d\'un nouveau message non lu.

**6.2 Système de Notifications Automatisé**

Pour assurer une information proactive et pertinente, la plateforme
s\'appuie sur un système de notifications automatisé qui utilise le
canal le plus approprié pour chaque type de message.

  --------------------------------------------------------------------------
  Canal              Événements Déclencheurs Typiques
  ------------------ -------------------------------------------------------
  **Notifications    Nouveau message de chat, changement de statut d\'une
  in-app**           réservation, nouvelle tâche assignée à un
                     administrateur.

  **E-mails (via     Confirmation d\'inscription, récapitulatif de commande,
  Resend)**          rappel de rendez-vous, procédure de réinitialisation de
                     mot de passe, reçu de paiement.

  **SMS (via         Notifications urgentes, confirmation de rendez-vous de
  Twilio/Vonage)**   dernière minute, rappel la veille du rendez-vous (J-1),
                     envoi des codes de vérification pour
                     l\'authentification.
  --------------------------------------------------------------------------

L\'expérience utilisateur globale est enrichie par des choix
technologiques modernes qui transcendent les modules individuels, comme
l\'approche Progressive Web App.

**7.0 Expérience Plateforme et Fonctionnalités Transverses**

La qualité de l\'expérience utilisateur sur la plateforme Simone ne
repose pas uniquement sur des modules fonctionnels isolés, mais aussi
sur des choix technologiques et ergonomiques transverses. L\'approche
\"mobile-first\" est au cœur de la conception, garantissant une
interaction fluide, performante et cohérente, que l\'utilisateur accède
à la plateforme depuis un ordinateur de bureau, une tablette ou un
smartphone.

**7.1 Expérience Mobile et Progressive Web App (PWA)**

L\'expérience mobile a été particulièrement soignée pour répondre aux
usages nomades des clients et des prestataires.

-   **Design Responsive :** L\'intégralité de l\'interface a été conçue
    selon une approche \"mobile-first\", ce qui signifie qu\'elle
    s\'adapte parfaitement à toutes les tailles d\'écran, des grands
    moniteurs aux smartphones, en optimisant la disposition des éléments
    pour chaque contexte.

-   **Fonctionnalités PWA :** La plateforme est développée comme une
    Progressive Web App (PWA), offrant des avantages similaires à ceux
    d\'une application native sans les contraintes d\'un magasin
    d\'applications :

    -   **Installation sur l\'écran d\'accueil** du téléphone pour un
        accès direct et rapide.

    -   **Notifications push** pour recevoir des alertes importantes
        (confirmation de réservation, message, etc.) même lorsque le
        navigateur est fermé.

    -   **Accès hors-ligne** à certaines informations essentielles
        (comme les détails d\'un prochain rendez-vous) grâce à une mise
        en cache intelligente des données.

**7.2 Recherche d\'Instituts et Géolocalisation**

En plus des services à domicile, la plateforme permet de trouver des
instituts de bien-être partenaires.

-   **Recherche par Localisation :** Les utilisateurs peuvent rechercher
    des instituts partenaires situés à proximité d\'une adresse
    spécifique, idéal pour trouver un service près de chez soi ou de son
    lieu de travail.

-   **Carte Interactive :** Les résultats de la recherche sont affichés
    de manière visuelle sur une carte Google Maps interactive,
    permettant de situer facilement les établissements.

-   **Filtrage et Tri :** Il est possible d\'affiner la recherche en
    filtrant les instituts par type de service proposé, par distance ou
    par note moyenne laissée par les autres utilisateurs.

**7.3 Design System et Interface Utilisateur**

La conception de l\'interface est guidée par une philosophie de
cohérence et de qualité perçue.

-   **Esthétique Premium :** Le style visuel de la plateforme est
    volontairement élégant, luxueux et épuré, afin de refléter le
    positionnement haut de gamme de la marque Simone.

-   **Cohérence Visuelle :** Un système de design (Design System)
    unifié, basé sur des technologies modernes comme shadcn/ui et
    Tailwind CSS, est utilisé sur l\'ensemble des pages et des
    composants. Cela garantit une expérience utilisateur cohérente,
    prédictible et intuitive, réduisant la charge cognitive pour
    l\'utilisateur.

-   **Accessibilité :** L\'interface est conçue en gardant
    l\'accessibilité à l\'esprit, en respectant les standards de
    contraste des couleurs et en assurant une navigation complète au
    clavier pour être utilisable par le plus grand nombre.

\# Spécifications UI/UX - Simone Paris

\## 1. Vue d\'ensemble du Design Système

\### 1.1 Philosophie de Design

\- \*\*Style\*\*: Premium, luxueux, élégant

\- \*\*Approche\*\*: Mobile-first, responsive, accessible

\- \*\*Framework CSS\*\*: Tailwind CSS avec design tokens personnalisés

\- \*\*Système de tokens\*\*: HSL pour tous les thèmes (light/dark)

\-\--

\## 2. Système de Couleurs

\### 2.1 Tokens CSS (Variables HSL)

\#### Mode Light (\`:root\`)

\`\`\`css

\--background: 0 0% 100%; /\* Blanc pur \*/

\--foreground: 240 10% 3.9%; /\* Texte principal noir \*/

\--card: 0 0% 100%; /\* Fond des cartes \*/

\--card-foreground: 240 10% 3.9%; /\* Texte des cartes \*/

\--popover: 0 0% 100%; /\* Fond popover \*/

\--popover-foreground: 240 10% 3.9%;/\* Texte popover \*/

\--primary: 14 85% 60%; /\* Couleur primaire corail #dd6055 \*/

\--primary-foreground: 0 0% 98%; /\* Texte sur primaire \*/

\--secondary: 240 4.8% 95.9%; /\* Gris très clair \*/

\--secondary-foreground: 240 5.9% 10%; /\* Texte sur secondaire \*/

\--muted: 240 4.8% 95.9%; /\* Élément désactivé/atténué \*/

\--muted-foreground: 240 3.8% 46.1%; /\* Texte atténué \*/

\--accent: 240 4.8% 95.9%; /\* Accent gris clair \*/

\--accent-foreground: 240 5.9% 10%; /\* Texte sur accent \*/

\--destructive: 0 84.2% 60.2%; /\* Rouge pour erreurs \*/

\--destructive-foreground: 0 0% 98%; /\* Texte sur destructive \*/

\--border: 240 5.9% 90%; /\* Bordures \*/

\--input: 240 5.9% 90%; /\* Champs input \*/

\--ring: 14 85% 60%; /\* Focus ring (primaire) \*/

/\* Couleurs personnalisées \*/

\--dark-bg: 0 0% 10%; /\* Fond sombre \*/

\--dark-surface: 0 0% 15%; /\* Surface sombre \*/

\--light-text: 0 0% 98%; /\* Texte clair \*/

\--soft-gray: 240 4.8% 95.9%; /\* Gris doux \*/

\`\`\`

\#### Mode Dark (\`.dark\`)

\`\`\`css

\--background: 240 10% 3.9%; /\* Fond sombre \*/

\--foreground: 0 0% 98%; /\* Texte clair \*/

\--card: 240 10% 3.9%; /\* Fond cartes sombre \*/

\--card-foreground: 0 0% 98%; /\* Texte cartes clair \*/

\--popover: 240 10% 3.9%; /\* Fond popover sombre \*/

\--popover-foreground: 0 0% 98%; /\* Texte popover clair \*/

\--primary: 14 85% 60%; /\* Primaire inchangé \*/

\--primary-foreground: 0 0% 98%; /\* Texte sur primaire \*/

\--secondary: 240 3.7% 15.9%; /\* Gris sombre \*/

\--secondary-foreground: 0 0% 98%; /\* Texte clair \*/

\--muted: 240 3.7% 15.9%; /\* Muted sombre \*/

\--muted-foreground: 240 5% 64.9%; /\* Texte muted clair \*/

\--accent: 240 3.7% 15.9%; /\* Accent sombre \*/

\--accent-foreground: 0 0% 98%; /\* Texte accent clair \*/

\--destructive: 0 62.8% 30.6%; /\* Rouge foncé \*/

\--destructive-foreground: 0 0% 98%; /\* Texte sur destructive \*/

\--border: 240 3.7% 15.9%; /\* Bordures sombres \*/

\--input: 240 3.7% 15.9%; /\* Input sombre \*/

\--ring: 14 85% 60%; /\* Focus ring primaire \*/

/\* Couleurs personnalisées dark \*/

\--dark-bg: 0 0% 10%;

\--dark-surface: 0 0% 15%;

\--light-text: 0 0% 98%;

\--soft-gray: 240 3.7% 15.9%;

\`\`\`

\#### Couleurs Fixes (Non-thématiques)

\`\`\`css

\--accent-gold: #dd6055; /\* Corail signature \*/

\--header-bg: #1a1a1a; /\* Header sombre fixe \*/

\--button-primary: #dd6055; /\* Bouton primaire corail \*/

\`\`\`

\### 2.2 Utilisation dans Tailwind

\`\`\`typescript

// tailwind.config.ts

colors: {

border: \'hsl(var(\--border))\',

input: \'hsl(var(\--input))\',

ring: \'hsl(var(\--ring))\',

background: \'hsl(var(\--background))\',

foreground: \'hsl(var(\--foreground))\',

primary: {

DEFAULT: \'hsl(var(\--primary))\',

foreground: \'hsl(var(\--primary-foreground))\'

},

secondary: {

DEFAULT: \'hsl(var(\--secondary))\',

foreground: \'hsl(var(\--secondary-foreground))\'

},

// \... etc

\'accent-gold\': \'#dd6055\',

\'button-primary\': \'#dd6055\',

}

\`\`\`

\### 2.3 Classes Utilitaires Personnalisées

\`\`\`css

.text-button-primary { color: #dd6055; }

.bg-button-primary { background-color: #dd6055; }

.text-accent-gold { color: #dd6055; }

.bg-accent-gold { background-color: #dd6055; }

\`\`\`

\-\--

\## 3. Typographie

\### 3.1 Polices

\`\`\`css

/\* Google Fonts \*/

\@import
url(\'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap\');

\@import
url(\'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap\');

/\* Familles \*/

font-family: {

\'inter\': \[\'DM Sans\', \'sans-serif\'\], /\* Police par défaut \*/

\'playfair\': \[\'Playfair Display\', \'serif\'\] /\* Police titre
élégante \*/

}

\`\`\`

\### 3.2 Classes de Police

\`\`\`css

.font-inter { font-family: \'DM Sans\', sans-serif; }

.font-dm-sans { font-family: \'DM Sans\', sans-serif; }

.font-playfair { font-family: \'Playfair Display\', serif; }

\`\`\`

\### 3.3 Échelle Typographique

\- \*\*Titres H1\*\*: \`text-4xl\` (36px) ou \`text-5xl\` (48px) -
\`font-playfair font-bold\`

\- \*\*Titres H2\*\*: \`text-3xl\` (30px) - \`font-playfair
font-semibold\`

\- \*\*Titres H3\*\*: \`text-2xl\` (24px) - \`font-semibold\`

\- \*\*Titres H4\*\*: \`text-xl\` (20px) - \`font-semibold\`

\- \*\*Body Large\*\*: \`text-lg\` (18px) - \`font-normal\`

\- \*\*Body\*\*: \`text-base\` (16px) - \`font-normal\`

\- \*\*Body Small\*\*: \`text-sm\` (14px) - \`font-normal\`

\- \*\*Caption\*\*: \`text-xs\` (12px) - \`font-normal\`

\### 3.4 Poids de Police

\- \*\*Light\*\*: \`font-light\` (300)

\- \*\*Normal\*\*: \`font-normal\` (400)

\- \*\*Medium\*\*: \`font-medium\` (500)

\- \*\*Semibold\*\*: \`font-semibold\` (600)

\- \*\*Bold\*\*: \`font-bold\` (700)

\-\--

\## 4. Espacements

\### 4.1 Container

\`\`\`typescript

container: {

center: true,

padding: {

DEFAULT: \'1rem\', // 16px

sm: \'1rem\', // 16px

lg: \'1.5rem\', // 24px

xl: \'2rem\', // 32px

},

screens: {

\'2xl\': \'1400px\'

}

}

\`\`\`

\### 4.2 Échelle d\'Espacement Tailwind

\- \`p-0\` / \`m-0\`: 0px

\- \`p-1\` / \`m-1\`: 4px

\- \`p-2\` / \`m-2\`: 8px

\- \`p-3\` / \`m-3\`: 12px

\- \`p-4\` / \`m-4\`: 16px

\- \`p-6\` / \`m-6\`: 24px

\- \`p-8\` / \`m-8\`: 32px

\- \`p-12\` / \`m-12\`: 48px

\- \`p-16\` / \`m-16\`: 64px

\### 4.3 Spacing Patterns

\- \*\*Cards\*\*: \`p-6\` (padding interne)

\- \*\*Sections\*\*: \`py-12\` ou \`py-16\` (espacement vertical)

\- \*\*Gaps\*\*: \`gap-4\` (grilles), \`gap-6\` (listes)

\- \*\*Buttons\*\*: \`px-4 py-2\` (default), \`px-8\` (large)

\-\--

\## 5. Bordures et Radius

\### 5.1 Border Radius

\`\`\`css

\--radius: 0.5rem; /\* 8px par défaut \*/

borderRadius: {

lg: \'var(\--radius)\', /\* 8px \*/

md: \'calc(var(\--radius) - 2px)\', /\* 6px \*/

sm: \'calc(var(\--radius) - 4px)\', /\* 4px \*/

}

\`\`\`

\### 5.2 Classes Courantes

\- \`rounded-lg\`: 8px

\- \`rounded-md\`: 6px

\- \`rounded-sm\`: 4px

\- \`rounded-full\`: Complètement arrondi

\### 5.3 Bordures

\- \`border\`: 1px solid hsl(var(\--border))

\- \`border-2\`: 2px solid

\- \`border-input\`: Couleur des inputs

\-\--

\## 6. Composants UI (Shadcn)

\### 6.1 Button

\#### Variantes

\`\`\`typescript

variant: {

default: \"bg-button-primary text-white hover:bg-button-primary/90\",

destructive: \"bg-destructive text-destructive-foreground
hover:bg-destructive/90\",

outline: \"border border-input bg-background hover:bg-accent
hover:text-accent-foreground\",

secondary: \"bg-secondary text-secondary-foreground
hover:bg-secondary/80\",

mobile: \"bg-black text-white hover:bg-gray-800\",

ghost: \"hover:bg-accent hover:text-accent-foreground\",

link: \"text-primary underline-offset-4 hover:underline\",

}

\`\`\`

\#### Tailles

\`\`\`typescript

size: {

default: \"h-10 px-4 py-2\",

sm: \"h-9 rounded-md px-3\",

lg: \"h-11 rounded-md px-8\",

icon: \"h-10 w-10\",

}

\`\`\`

\#### Exemple

\`\`\`tsx

\<Button variant=\"default\" size=\"lg\"\>Réserver\</Button\>

\<Button variant=\"outline\"\>Annuler\</Button\>

\<Button variant=\"ghost\" size=\"icon\"\>\<X /\>\</Button\>

\`\`\`

\### 6.2 Card

\#### Structure

\`\`\`tsx

\<Card\>

\<CardHeader\>

\<CardTitle\>Titre\</CardTitle\>

\<CardDescription\>Description\</CardDescription\>

\</CardHeader\>

\<CardContent\>

{/\* Contenu \*/}

\</CardContent\>

\<CardFooter\>

{/\* Actions \*/}

\</CardFooter\>

\</Card\>

\`\`\`

\#### Classes par défaut

\- Card: \`rounded-lg border bg-card text-card-foreground shadow-sm\`

\- CardHeader: \`flex flex-col space-y-1.5 p-6\`

\- CardTitle: \`text-2xl font-semibold leading-none tracking-tight\`

\- CardDescription: \`text-sm text-muted-foreground\`

\- CardContent: \`p-6 pt-0\`

\- CardFooter: \`flex items-center p-6 pt-0\`

\### 6.3 Badge

\#### Variantes

\`\`\`typescript

variant: {

default: \"border-transparent bg-primary text-primary-foreground
hover:bg-primary/80\",

secondary: \"border-transparent bg-secondary text-secondary-foreground
hover:bg-secondary/80\",

destructive: \"border-transparent bg-destructive
text-destructive-foreground hover:bg-destructive/80\",

outline: \"text-foreground\",

}

\`\`\`

\#### Classes de base

\`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
font-semibold\`

\### 6.4 Alert

\#### Variantes

\`\`\`typescript

variant: {

default: \"bg-background text-foreground\",

destructive: \"border-destructive/50 text-destructive
dark:border-destructive \[&\>svg\]:text-destructive\",

}

\`\`\`

\#### Structure

\`\`\`tsx

\<Alert variant=\"default\"\>

\<AlertIcon /\>

\<AlertTitle\>Titre\</AlertTitle\>

\<AlertDescription\>Description\</AlertDescription\>

\</Alert\>

\`\`\`

\### 6.5 Dialog

\#### Classes principales

\- Overlay: \`fixed inset-0 z-50 bg-black/80\`

\- Content: \`fixed left-\[50%\] top-\[50%\] z-50 grid w-full max-w-lg
translate-x-\[-50%\] translate-y-\[-50%\] gap-4 border bg-background p-6
shadow-lg\`

\- Close: Position absolute \`right-4 top-4\`

\#### Exemple

\`\`\`tsx

\<Dialog\>

\<DialogTrigger asChild\>

\<Button\>Ouvrir\</Button\>

\</DialogTrigger\>

\<DialogContent\>

\<DialogHeader\>

\<DialogTitle\>Titre\</DialogTitle\>

\<DialogDescription\>Description\</DialogDescription\>

\</DialogHeader\>

{/\* Contenu \*/}

\<DialogFooter\>

\<Button\>Confirmer\</Button\>

\</DialogFooter\>

\</DialogContent\>

\</Dialog\>

\`\`\`

\### 6.6 Input

\#### Classes de base

\`\`\`css

flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
text-base

ring-offset-background file:border-0 file:bg-transparent file:text-sm
file:font-medium

file:text-foreground placeholder:text-muted-foreground

focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2

disabled:cursor-not-allowed disabled:opacity-50 md:text-sm

\`\`\`

\### 6.7 Select

\#### Utilise React Select avec theme personnalisé

\`\`\`typescript

customStyles = {

control: (provided) =\> ({

\...provided,

backgroundColor: \'hsl(var(\--background))\',

borderColor: \'hsl(var(\--border))\',

}),

menu: (provided) =\> ({

\...provided,

backgroundColor: \'hsl(var(\--popover))\',

}),

// \... etc

}

\`\`\`

\### 6.8 Checkbox

\#### Classes

\`\`\`css

peer h-4 w-4 shrink-0 rounded-sm border border-primary
ring-offset-background

focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2

disabled:cursor-not-allowed disabled:opacity-50

data-\[state=checked\]:bg-primary
data-\[state=checked\]:text-primary-foreground

\`\`\`

\### 6.9 Avatar

\#### Structure

\`\`\`tsx

\<Avatar\>

\<AvatarImage src=\"/image.jpg\" alt=\"User\" /\>

\<AvatarFallback\>AB\</AvatarFallback\>

\</Avatar\>

\`\`\`

\#### Classes

\- Root: \`relative flex h-10 w-10 shrink-0 overflow-hidden
rounded-full\`

\- Image: \`aspect-square h-full w-full\`

\- Fallback: \`flex h-full w-full items-center justify-center
rounded-full bg-muted\`

\### 6.10 Accordion

\#### Structure

\`\`\`tsx

\<Accordion type=\"single\" collapsible\>

\<AccordionItem value=\"item-1\"\>

\<AccordionTrigger\>Question?\</AccordionTrigger\>

\<AccordionContent\>

Réponse

\</AccordionContent\>

\</AccordionItem\>

\</Accordion\>

\`\`\`

\-\--

\## 7. Animations

\### 7.1 Keyframes

\`\`\`typescript

keyframes: {

\'accordion-down\': {

from: { height: \'0\' },

to: { height: \'var(\--radix-accordion-content-height)\' }

},

\'accordion-up\': {

from: { height: \'var(\--radix-accordion-content-height)\' },

to: { height: \'0\' }

},

\'slide-in-right\': {

\'0%\': { transform: \'translateX(100%)\' },

\'100%\': { transform: \'translateX(0)\' }

},

\'slide-down\': {

from: { height: \'0\', opacity: \'0\' },

to: { height: \'var(\--radix-accordion-content-height)\', opacity: \'1\'
}

},

\'fade-in\': {

\'0%\': { opacity: \'0\', transform: \'translateY(10px)\' },

\'100%\': { opacity: \'1\', transform: \'translateY(0)\' }

},

}

\`\`\`

\### 7.2 Classes d\'Animation

\`\`\`typescript

animation: {

\'accordion-down\': \'accordion-down 0.2s ease-out\',

\'accordion-up\': \'accordion-up 0.2s ease-out\',

\'slide-in-right\': \'slide-in-right 0.3s ease-out\',

\'slide-down\': \'slide-down 0.3s ease-out\',

\'fade-in\': \'fade-in 0.3s ease-out\',

}

\`\`\`

\### 7.3 Transitions

\`\`\`css

/\* Classe par défaut dans les composants \*/

transition-colors

/\* Transitions personnalisées \*/

transition-all duration-200 ease-in-out

transition-transform duration-300

\`\`\`

\-\--

\## 8. Responsive Design

\### 8.1 Breakpoints

\`\`\`typescript

sm: \'640px\', // Mobile large

md: \'768px\', // Tablette

lg: \'1024px\', // Desktop

xl: \'1280px\', // Large desktop

2xl: \'1400px\' // Container max-width

\`\`\`

\### 8.2 Classes Utilitaires Responsive

\`\`\`css

.mobile-only { display: block; }

\@media (min-width: 768px) {

.mobile-only { display: none; }

}

.desktop-only { display: none; }

\@media (min-width: 768px) {

.desktop-only { display: block; }

}

\`\`\`

\### 8.3 Patterns Mobiles Courants

\`\`\`tsx

{/\* Mobile: stack, Desktop: row \*/}

\<div className=\"flex flex-col md:flex-row gap-4\"\>

{/\* Grille responsive \*/}

\<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6\"\>

{/\* Padding responsive \*/}

\<div className=\"p-4 md:p-6 lg:p-8\"\>

{/\* Text size responsive \*/}

\<h1 className=\"text-3xl md:text-4xl lg:text-5xl\"\>

\`\`\`

\-\--

\## 9. PWA & Mobile-Specific

\### 9.1 Safe Areas (iOS)

\`\`\`css

.safe-area-bottom {

padding-bottom: env(safe-area-inset-bottom, 16px);

}

.safe-container {

padding-left: max(1rem, env(safe-area-inset-left));

padding-right: max(1rem, env(safe-area-inset-right));

}

\`\`\`

\### 9.2 Styles PWA

\`\`\`css

/\* PWA Install Prompt \*/

.pwa-install-prompt {

position: fixed;

bottom: 80px;

left: 50%;

transform: translateX(-50%);

z-index: 1000;

max-width: 90vw;

}

/\* Offline Indicator \*/

.offline-indicator {

position: fixed;

top: 0;

left: 0;

right: 0;

z-index: 9999;

}

\`\`\`

\### 9.3 Touch Optimizations

\`\`\`css

/\* Minimum tap target 44x44px \*/

.touch-target {

min-width: 44px;

min-height: 44px;

}

/\* Prevent text selection on UI elements \*/

.no-select {

-webkit-user-select: none;

user-select: none;

}

\`\`\`

\-\--

\## 10. Effets Visuels

\### 10.1 Shadows

\`\`\`css

/\* Tailwind defaults \*/

shadow-sm /\* 0 1px 2px 0 rgb(0 0 0 / 0.05) \*/

shadow /\* 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
\*/

shadow-md /\* 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0
/ 0.1) \*/

shadow-lg /\* 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0
0 / 0.1) \*/

shadow-xl /\* 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0
0 / 0.1) \*/

\`\`\`

\### 10.2 Glass Effect

\`\`\`css

.glass-effect {

background: rgba(255, 255, 255, 0.1);

backdrop-filter: blur(10px);

border: 1px solid rgba(255, 255, 255, 0.2);

}

\`\`\`

\### 10.3 Gradients

\`\`\`css

/\* Gradient backgrounds \*/

bg-gradient-to-r

bg-gradient-to-br

/\* Exemples courants \*/

className=\"bg-gradient-to-br from-gray-50 to-white\"

className=\"bg-gradient-to-r from-primary to-primary/80\"

\`\`\`

\-\--

\## 11. États Interactifs

\### 11.1 Hover States

\`\`\`css

/\* Buttons \*/

hover:bg-button-primary/90

hover:bg-accent

hover:bg-secondary/80

/\* Links \*/

hover:underline

hover:text-primary

/\* Cards \*/

hover:shadow-lg

hover:scale-105

\`\`\`

\### 11.2 Focus States

\`\`\`css

focus-visible:outline-none

focus-visible:ring-2

focus-visible:ring-ring

focus-visible:ring-offset-2

\`\`\`

\### 11.3 Disabled States

\`\`\`css

disabled:pointer-events-none

disabled:opacity-50

disabled:cursor-not-allowed

\`\`\`

\### 11.4 Active States

\`\`\`css

active:scale-95

active:bg-primary/80

\`\`\`

\-\--

\## 12. Icônes (Lucide React)

\### 12.1 Installation & Usage

\`\`\`tsx

import { Home, User, ShoppingCart, Menu } from \'lucide-react\'

\<Home size={24} /\>

\<User className=\"h-5 w-5\" /\>

\<ShoppingCart strokeWidth={1.5} /\>

\`\`\`

\### 12.2 Sizing Standards

\- \*\*Small\*\*: \`size={16}\` ou \`className=\"h-4 w-4\"\`

\- \*\*Default\*\*: \`size={20}\` ou \`className=\"h-5 w-5\"\`

\- \*\*Large\*\*: \`size={24}\` ou \`className=\"h-6 w-6\"\`

\- \*\*XL\*\*: \`size={32}\` ou \`className=\"h-8 w-8\"\`

\### 12.3 Couleurs d\'Icônes

\`\`\`tsx

{/\* Utiliser les tokens \*/}

\<Icon className=\"text-primary\" /\>

\<Icon className=\"text-muted-foreground\" /\>

\<Icon className=\"text-destructive\" /\>

\`\`\`

\-\--

\## 13. Formulaires

\### 13.1 Structure Standard

\`\`\`tsx

\<form className=\"space-y-6\"\>

\<div className=\"space-y-2\"\>

\<Label htmlFor=\"email\"\>Email\</Label\>

\<Input

id=\"email\"

type=\"email\"

placeholder=\"email@example.com\"

/\>

\</div\>

\<Button type=\"submit\" className=\"w-full\"\>

Envoyer

\</Button\>

\</form\>

\`\`\`

\### 13.2 Validation Visuelle

\`\`\`tsx

{/\* Error state \*/}

\<Input

className=\"border-destructive focus-visible:ring-destructive\"

/\>

\<p className=\"text-sm text-destructive mt-1\"\>Message d\'erreur\</p\>

{/\* Success state \*/}

\<Input

className=\"border-green-500 focus-visible:ring-green-500\"

/\>

\`\`\`

\-\--

\## 14. Layouts Courants

\### 14.1 Page Layout

\`\`\`tsx

\<div className=\"min-h-screen bg-background\"\>

\<Header /\>

\<main className=\"container py-8\"\>

{children}

\</main\>

\<Footer /\>

\</div\>

\`\`\`

\### 14.2 Two-Column Layout

\`\`\`tsx

\<div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\"\>

\<aside className=\"lg:col-span-1\"\>

{/\* Sidebar \*/}

\</aside\>

\<main className=\"lg:col-span-2\"\>

{/\* Main content \*/}

\</main\>

\</div\>

\`\`\`

\### 14.3 Card Grid

\`\`\`tsx

\<div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
gap-6\"\>

{items.map(item =\> (

\<Card key={item.id}\>

{/\* Card content \*/}

\</Card\>

))}

\</div\>

\`\`\`

\-\--

\## 15. Navigation

\### 15.1 Header

\`\`\`tsx

\<header className=\"sticky top-0 z-50 bg-header-bg text-white
border-b\"\>

\<div className=\"container flex h-16 items-center justify-between\"\>

\<Logo /\>

\<Navigation /\>

\<UserMenu /\>

\</div\>

\</header\>

\`\`\`

\### 15.2 Mobile Bottom Navigation

\`\`\`tsx

\<nav className=\"fixed bottom-0 left-0 right-0 z-50 bg-white border-t
safe-area-bottom\"\>

\<div className=\"flex justify-around items-center h-16\"\>

{navItems.map(item =\> (

\<Link key={item.id} className=\"flex flex-col items-center\"\>

\<Icon /\>

\<span className=\"text-xs\"\>{item.label}\</span\>

\</Link\>

))}

\</div\>

\</nav\>

\`\`\`

\-\--

\## 16. Patterns de Chargement

\### 16.1 Skeleton

\`\`\`tsx

\<div className=\"space-y-3\"\>

\<Skeleton className=\"h-4 w-full\" /\>

\<Skeleton className=\"h-4 w-3/4\" /\>

\<Skeleton className=\"h-4 w-1/2\" /\>

\</div\>

\`\`\`

\### 16.2 Spinner

\`\`\`tsx

\<div className=\"flex items-center justify-center p-8\"\>

\<div className=\"animate-spin rounded-full h-8 w-8 border-b-2
border-primary\" /\>

\</div\>

\`\`\`

\-\--

\## 17. Toasts & Notifications

\### 17.1 Sonner Toast

\`\`\`tsx

import { toast } from \'sonner\'

// Success

toast.success(\'Opération réussie\')

// Error

toast.error(\'Une erreur est survenue\')

// Info

toast.info(\'Information importante\')

// Custom

toast.custom((t) =\> (

\<div className=\"bg-white rounded-lg shadow-lg p-4\"\>

Custom content

\</div\>

))

\`\`\`

\### 17.2 Position et Style

\`\`\`tsx

\<Toaster

position=\"top-right\"

toastOptions={{

className: \'bg-background text-foreground border\',

}}

/\>

\`\`\`

\-\--

\## 18. Images & Media

\### 18.1 Images Responsives

\`\`\`tsx

\<img

src=\"/image.jpg\"

alt=\"Description\"

className=\"w-full h-auto object-cover rounded-lg\"

loading=\"lazy\"

/\>

\`\`\`

\### 18.2 Aspect Ratios

\`\`\`tsx

import { AspectRatio } from \'@/components/ui/aspect-ratio\'

\<AspectRatio ratio={16/9}\>

\<img src=\"/image.jpg\" className=\"object-cover w-full h-full\" /\>

\</AspectRatio\>

\`\`\`

\-\--

\## 19. Accessibilité

\### 19.1 Règles Essentielles

\- Toujours inclure \`alt\` sur les images

\- Utiliser des labels avec les inputs (\`htmlFor\`/\`id\`)

\- Focus visible avec \`focus-visible:ring-2\`

\- Contraste minimum WCAG AA

\- Navigation au clavier complète

\- ARIA labels sur icônes seules

\### 19.2 Exemples

\`\`\`tsx

{/\* Button avec icône seule \*/}

\<Button variant=\"ghost\" size=\"icon\" aria-label=\"Fermer\"\>

\<X className=\"h-4 w-4\" /\>

\</Button\>

{/\* Link accessible \*/}

\<a href=\"/page\" className=\"underline focus-visible:ring-2\"\>

Lien accessible

\</a\>

\`\`\`

\-\--

\## 20. Conventions de Code

\### 20.1 Nommage

\- \*\*Components\*\*: PascalCase (\`UserProfile.tsx\`)

\- \*\*Hooks\*\*: camelCase avec préfixe \`use\` (\`useAuth.ts\`)

\- \*\*Utils\*\*: camelCase (\`formatDate.ts\`)

\- \*\*CSS Classes\*\*: kebab-case ou tailwind

\### 20.2 Structure de Fichier

\`\`\`

src/

├── components/

│ ├── ui/ \# Composants Shadcn

│ ├── mobile/ \# Composants mobile

│ └── \[feature\]/ \# Composants métier

├── hooks/

├── utils/

├── pages/

└── lib/

\`\`\`

\### 20.3 Import des Composants UI

\`\`\`tsx

import { Button } from \'@/components/ui/button\'

import { Card } from \'@/components/ui/card\'

\`\`\`

\-\--

\## 21. Dark Mode

\### 21.1 Activation

\`\`\`tsx

import { useTheme } from \'next-themes\'

const { theme, setTheme } = useTheme()

\<Button onClick={() =\> setTheme(theme === \'dark\' ? \'light\' :
\'dark\')}\>

Toggle theme

\</Button\>

\`\`\`

\### 21.2 Classes Conditionnelles

\`\`\`tsx

\<div className=\"bg-white dark:bg-gray-900 text-black
dark:text-white\"\>

Content

\</div\>

\`\`\`

\### 21.3 Best Practice

\*\*Toujours utiliser les tokens CSS\*\* au lieu de classes
conditionnelles:

\`\`\`tsx

{/\* ✅ CORRECT \*/}

\<div className=\"bg-background text-foreground\"\>

{/\* ❌ INCORRECT \*/}

\<div className=\"bg-white dark:bg-gray-900\"\>

\`\`\`

\-\--

\## 22. Performance UI

\### 22.1 Images

\- Utiliser \`loading=\"lazy\"\` sur toutes les images non-critiques

\- Optimiser les tailles avec responsive breakpoints

\- WebP avec fallback

\### 22.2 Animations

\- Privilégier \`transform\` et \`opacity\` (GPU-accelerated)

\- Utiliser \`will-change\` avec parcimonie

\- \`transition-colors\` par défaut

\### 22.3 Lists

\- Utiliser \`key\` unique dans les \`.map()\`

\- Virtualiser les longues listes (react-window)

\- Lazy load les éléments hors viewport

\-\--

\## 23. Checklist Designer → Développeur

\### ✅ Avant de démarrer

\- \[ \] Comprendre le système de tokens CSS

\- \[ \] Installer Tailwind CSS Intellisense (VSCode)

\- \[ \] Familiarisation avec les composants Shadcn

\- \[ \] Configurer Prettier + Tailwind plugin

\### ✅ Pendant le développement

\- \[ \] Utiliser uniquement les tokens de couleur (pas de HEX/RGB
direct)

\- \[ \] Respecter les tailles de police définies

\- \[ \] Appliquer les espacements standardisés

\- \[ \] Tester responsive (mobile/tablet/desktop)

\- \[ \] Vérifier accessibilité (contraste, keyboard nav)

\- \[ \] Tester dark mode si applicable

\### ✅ Avant de livrer

\- \[ \] Toutes les images ont un \`alt\`

\- \[ \] Focus visible sur tous les éléments interactifs

\- \[ \] Animations fluides (60fps)

\- \[ \] Performance optimale (Lighthouse)

\- \[ \] Pas de console errors/warnings

\- \[ \] Code review avec design système

\-\--

\## 24. Outils Recommandés

\### 24.1 Extensions VSCode

\- \*\*Tailwind CSS IntelliSense\*\*: Autocomplete pour Tailwind

\- \*\*ES7+ React/Redux snippets\*\*: Snippets React

\- \*\*Prettier\*\*: Formattage automatique

\- \*\*ESLint\*\*: Linting

\### 24.2 Plugins Figma

\- \*\*Tailwind CSS Color Generator\*\*: Conversion HSL

\- \*\*Design Tokens\*\*: Export de tokens

\- \*\*Iconify\*\*: Recherche d\'icônes Lucide

\### 24.3 Testing

\- \*\*Storybook\*\*: Catalogue de composants

\- \*\*Chromatic\*\*: Tests visuels

\- \*\*Axe DevTools\*\*: Tests accessibilité

\-\--

\## 25. Ressources

\### 25.1 Documentation Officielle

\- \[Tailwind CSS\](https://tailwindcss.com/docs)

\- \[Shadcn/ui\](https://ui.shadcn.com/)

\- \[Lucide Icons\](https://lucide.dev/)

\- \[Radix UI\](https://www.radix-ui.com/)

\### 25.2 Design Tokens

\- Fichier: \`src/index.css\` (variables CSS)

\- Config: \`tailwind.config.ts\` (configuration Tailwind)

\### 25.3 Composants UI

\- Répertoire: \`src/components/ui/\`

\- Tous les composants sont personnalisables

\- Base Radix UI + styling Tailwind

\-\--

\## Conclusion

Ce design système est conçu pour être:

\- \*\*Cohérent\*\*: Tokens réutilisables partout

\- \*\*Scalable\*\*: Facile d\'ajouter de nouveaux composants

\- \*\*Accessible\*\*: WCAG AA par défaut

\- \*\*Performant\*\*: Optimisé pour le web et mobile

\- \*\*Maintenable\*\*: Structure claire et documentée

\*\*Règle d\'or\*\*: Toujours utiliser les tokens du design système au
lieu de valeurs en dur. Si un token n\'existe pas, l\'ajouter au système
plutôt que de créer une exception.
-e 

---

# PARTIE 2 : SPÉCIFICATIONS TECHNIQUES DÉTAILLÉES

**Spécifications Fonctionnelles et Techniques Complètes -- Plateforme
Simone**

**1.0 Vision Produit et Architecture Générale**

**1.1 Introduction et Vision Produit**

La plateforme Simone est une solution logicielle en tant que service
(SaaS) premium, conçue pour orchestrer avec élégance la gestion complète
des services de bien-être à domicile. Sa proposition de valeur
s\'articule autour d\'une double mission : offrir une expérience de
réservation exceptionnellement fluide et intuitive pour le client final,
tout en fournissant un écosystème d\'outils de gestion puissants et
centralisés pour les prestataires de services et les équipes
administratives. Chaque interaction, de la découverte d\'un soin à la
finalisation du paiement, a été pensée pour refléter un standard de
qualité, de simplicité et de luxe. Ce document constitue le cahier des
charges fonctionnel et technique complet, servant de référence pour la
reconstruction et l\'évolution de la plateforme.

**1.2 Écosystème des Utilisateurs**

La plateforme est conçue pour servir un écosystème interconnecté de
profils d\'utilisateurs, chacun avec des besoins et des interactions
spécifiques.

-   **Clients Particuliers**

    -   Recherchent, réservent et paient pour des services à domicile.

    -   Gèrent leur profil, leurs adresses, leurs moyens de paiement et
        consultent leur historique de réservations.

    -   Interagissent avec les prestataires via un chat intégré
        contextuel à leurs réservations.

-   **Clients Entreprises**

    -   Réservent des services de bien-être pour leurs employés ou lors
        d\'événements.

    -   Bénéficient d\'un catalogue de services dédiés, de tarifs
        négociés et d\'une facturation groupée.

    -   Utilisent des cartes cadeaux corporate avec des conditions
        spécifiques.

-   **Prestataires (Contractors)**

    -   Gèrent leur profil public, incluant leurs spécialités, leurs
        zones d\'intervention et une URL personnalisée (slug).

    -   Définissent leurs disponibilités via un calendrier interactif,
        avec synchronisation externe.

    -   Consultent leurs réservations, communiquent avec les clients et
        suivent leurs revenus et commissions.

-   **Administrateurs, Managers et Staff**

    -   **Administrateurs** : Disposent d\'un accès complet au
        back-office pour superviser toutes les opérations, configurer le
        système et piloter la stratégie via les analytiques.

    -   **Managers** : Gèrent les opérations quotidiennes, incluant la
        supervision des réservations, la validation des prestataires et
        le support client.

    -   **Staff** : Rôle interne avec des permissions limitées pour des
        tâches de support spécifiques.

**1.3 Architecture Technique**

La reconstruction de la plateforme Simone s\'appuie sur une stack
technique moderne, performante et scalable, conçue pour offrir une
expérience utilisateur optimale et une maintenance simplifiée.

  ------------------------------------------------------------------------------
  Composant              Technologies
  ---------------------- -------------------------------------------------------
  **Frontend**           React 18, TypeScript, Vite, TanStack Query, Tailwind
                         CSS, shadcn/ui

  **Backend (Supabase)** PostgreSQL, Supabase Auth (JWT), Supabase Storage,
                         Supabase Realtime, Edge Functions (Deno)

  **Paiements**          Stripe, Stripe Connect

  **Cartographie**       Google Maps API (Places, Geocoding, Distance Matrix)

  **Notifications**      Resend (E-mails), Twilio / Vonage (SMS)

  **Authentification**   Supabase Auth (Email/Mot de passe, Codes de
                         vérification)
  ------------------------------------------------------------------------------

Cette architecture est soutenue par un modèle de données robuste, dont
le socle est la base de données PostgreSQL gérée par Supabase.

**2.0 Modèle de Données et Base de Données**

**2.1 Schéma Général et Technologies**

Le cœur du système repose sur une base de données PostgreSQL, orchestrée
via la plateforme Supabase. Un pilier non négociable de notre
architecture de sécurité est l\'application systématique de la **Row
Level Security (RLS)** de PostgreSQL. Ce mécanisme, activé au niveau de
la base de données, garantit un cloisonnement de données par défaut,
principe fondamental de notre approche \"zero trust\". Il assure que
chaque utilisateur ne peut accéder qu\'aux informations qui lui sont
explicitement autorisées par des politiques de sécurité, protégeant
ainsi la confidentialité et l\'intégrité des données à tous les niveaux.

**2.2 Description des Tables Principales**

Voici une description des tables les plus critiques qui structurent les
données de la plateforme.

**profiles**

Table centrale et pivot de toutes les données utilisateur. Elle ancre
les informations de base pour tous les types de profils (clients,
administrateurs, prestataires) et est automatiquement peuplée via un
trigger depuis la table auth.users de Supabase à chaque nouvelle
inscription.

  ---------------------------------------------------------------------------
  Nom de la Colonne    Type      Description
  -------------------- --------- --------------------------------------------
  id                   UUID      Identifiant unique, synchronisé avec
                                 auth.users.id. Clé primaire.

  profile_type         BIGINT    Type de profil (1: Admin, 2: Client, 7:
                                 Prestataire, etc.).

  email                VARCHAR   Adresse e-mail de l\'utilisateur.

  display_name         TEXT      Nom complet de l\'utilisateur affiché sur la
                                 plateforme.

  phone_number         VARCHAR   Numéro de téléphone, essentiel pour les
                                 réservations.

  stripe_customer_id   VARCHAR   Identifiant client Stripe, pour la gestion
                                 des paiements.

  my_adresses          JSONB     Tableau des adresses sauvegardées par
                                 l\'utilisateur.
  ---------------------------------------------------------------------------

**contractors**

Cette table stocke toutes les informations professionnelles spécifiques
aux prestataires, de leurs compétences à leurs informations légales,
financières et opérationnelles.

  ------------------------------------------------------------------------------
  Nom de la Colonne           Type         Description
  --------------------------- ------------ -------------------------------------
  id                          BIGINT       Identifiant unique auto-incrémenté du
                                           prestataire. Clé primaire.

  profile_uuid                UUID         Lien vers la table profiles pour les
                                           informations de base.

  slug                        TEXT         URL personnalisée et unique pour le
                                           profil public du prestataire.

  active                      BOOLEAN      Indique si le prestataire peut
                                           recevoir de nouvelles réservations.

  ready_to_go                 BOOLEAN      Flag technique activant l\'offre B2B
                                           \"Ready to Go\" (voir 5.4). Nécessite
                                           un compte Stripe actif et des
                                           services configurés.

  list_of_product             BIGINT\[\]   Tableau des identifiants des services
                                           que le prestataire est autorisé à
                                           proposer.

  postcodes                   JSONB        Liste des codes postaux couverts pour
                                           les services à domicile.

  stripe_account_id           VARCHAR      Identifiant du compte Stripe Connect
                                           pour la réception des paiements.

  commission_rate             NUMERIC      Taux de commission prélevé par la
                                           plateforme sur chaque transaction.

  minimum_order_cents         NUMERIC      Montant minimum de commande en
                                           centimes requis pour ce prestataire.

  auto_accepts_reservations   BOOLEAN      Si true, les réservations sont
                                           confirmées automatiquement.

  notice_delay_in_hours       BIGINT       Délai de prévenance minimum (en
                                           heures) requis pour une réservation.
  ------------------------------------------------------------------------------

**reservation**

Table historique (legacy) qui gère le cycle de vie complet d\'une
réservation. Elle est progressivement remplacée par le nouveau système
appointment\_\*.

  ---------------------------------------------------------------------------
  Nom de la Colonne        Type      Description
  ------------------------ --------- ----------------------------------------
  id                       BIGINT    Identifiant unique auto-incrémenté de la
                                     réservation. Clé primaire.

  client_id                UUID      Identifiant du client ayant effectué la
                                     réservation.

  contractor_id            BIGINT    Identifiant du prestataire assigné.

  primary_product          BIGINT    Service principal de la réservation.

  reservation_state        TEXT      Statut actuel de la réservation (ex:
                                     \"En attente\", \"Confirmée\").

  stripe_payment_intent    VARCHAR   Identifiant du PaymentIntent Stripe
                                     associé à la transaction.

  appointment_date_local   DATE      Date du rendez-vous dans le fuseau
                                     horaire local.

  adresse                  TEXT      Adresse complète où la prestation a
                                     lieu.

  additional_services      JSONB     Services additionnels ajoutés à la
                                     réservation.
  ---------------------------------------------------------------------------

**appointment_bookings**

Fait partie du nouveau système de réservation intelligent. Cette table
est conçue pour une gestion optimisée des rendez-vous et des tournées.

  ---------------------------------------------------------------------------
  Nom de la Colonne     Type          Description
  --------------------- ------------- ---------------------------------------
  id                    UUID          Identifiant unique du rendez-vous. Clé
                                      primaire.

  contractor_id         BIGINT        Prestataire assigné au rendez-vous.

  client_id             UUID          Client ayant réservé.

  service_id            BIGINT        Lien vers le service réservé (table
                                      product).

  start_time            TIMESTAMPTZ   Heure de début précise du rendez-vous
                                      (UTC).

  end_time              TIMESTAMPTZ   Heure de fin précise du rendez-vous
                                      (UTC).

  status                TEXT          Statut du rendez-vous (pending,
                                      confirmed, cancelled, completed).

  travel_time_to_next   INTEGER       Temps de trajet estimé en minutes
                                      jusqu\'au prochain rendez-vous.
  ---------------------------------------------------------------------------

**product**

Catalogue central de tous les services et produits physiques proposés
sur la plateforme.

  ---------------------------------------------------------------------------
  Nom de la Colonne  Type      Description
  ------------------ --------- ----------------------------------------------
  id                 BIGINT    Identifiant unique du produit/service. Clé
                               primaire.

  name               VARCHAR   Nom du service (ex: \"Massage suédois 60
                               minutes\").

  description        TEXT      Description détaillée du service.

  price_cents        BIGINT    Prix du service en centimes d\'euros.

  duration_seconds   INTEGER   Durée de la prestation en secondes.

  service_id         BIGINT    Lien vers la catégorie principale du service
                               (table services).

  is_addon           BOOLEAN   Indique s\'il s\'agit d\'un service
                               additionnel.

  is_active          BOOLEAN   Indique si le produit est visible et
                               réservable.
  ---------------------------------------------------------------------------

**gift_cards**

Gère le cycle de vie des cartes cadeaux, de leur création à leur
utilisation complète.

  ----------------------------------------------------------------------------
  Nom de la Colonne         Type        Description
  ------------------------- ----------- --------------------------------------
  id                        UUID        Identifiant unique de la carte cadeau.
                                        Clé primaire.

  code                      VARCHAR     Code unique de la carte cadeau à
                                        saisir par l\'utilisateur.

  amount_cents              BIGINT      Montant initial de la carte en
                                        centimes.

  remaining_balance_cents   BIGINT      Solde restant sur la carte, mis à jour
                                        après chaque utilisation.

  status                    VARCHAR     Statut de la carte (active, used,
                                        expired, etc.).

  expires_at                TIMESTAMP   Date d\'expiration de la carte.
  ----------------------------------------------------------------------------

**2.3 Migration du Système de Réservation**

La plateforme est en cours de migration d\'un système de réservation
hérité (basé sur les tables easy\_\* et reservations) vers un nouveau
système de rendez-vous intelligent et autonome (basé sur les tables
appointment\_\*). Ce nouveau système est conçu pour optimiser la
planification en intégrant des contraintes complexes comme les temps de
trajet. Le plan de migration se déroule en quatre phases :

1.  **Phase 1 :** Création des nouvelles tables appointment\_\* pour
    structurer le nouveau modèle.

2.  **Phase 2 :** Migration des données existantes des anciennes tables
    (easy_appointments, etc.) vers les nouvelles.

3.  **Phase 3 :** Basculement progressif des Edge Functions pour
    utiliser le nouveau schéma de données.

4.  **Phase 4 :** Suppression des anciennes tables easy\_\* une fois la
    migration validée et stabilisée.

**3.0 Gestion des Utilisateurs, Rôles et Permissions**

**3.1 Système d\'Authentification Sécurisé**

La gestion stratégique des rôles et des accès est fondamentale pour
personnaliser l\'expérience utilisateur, optimiser les workflows et
garantir la sécurité des données. La plateforme Simone intègre un
système d\'authentification robuste basé sur Supabase Auth, enrichi de
mécanismes de vérification modernes.

-   **Inscription avec Vérification par E-mail** : Pour finaliser son
    inscription, un nouvel utilisateur doit valider son adresse e-mail
    en saisissant un code unique à 6 chiffres. Ce code est envoyé par
    e-mail et dispose d\'une durée de validité de 15 minutes pour
    renforcer la sécurité.

-   **Connexion** : L\'accès à la plateforme se fait de manière standard
    et sécurisée via la saisie d\'un e-mail et d\'un mot de passe.

-   **Réinitialisation de Mot de Passe** : Un processus sécurisé permet
    aux utilisateurs de réinitialiser leur mot de passe. Un code de
    vérification est envoyé par e-mail pour autoriser la création d\'un
    nouveau mot de passe, garantissant que seul le propriétaire du
    compte peut effectuer cette action.

-   **Gestion de Session** : La session utilisateur est maintenue de
    manière persistante après la connexion, permettant une navigation
    fluide sans nécessiter de ré-authentification à chaque visite, tout
    en respectant les meilleures pratiques de sécurité.

**3.2 Rôles et Permissions**

La plateforme segmente les utilisateurs en plusieurs profils distincts,
chacun disposant de droits et d\'interfaces spécifiques adaptés à ses
fonctions.

  --------------------------------------------------------------------------
  ID de    Type             Description du Rôle
  Profil   d\'Utilisateur   
  -------- ---------------- ------------------------------------------------
  1, 5     Administrateur / Accès complet à la gestion de la plateforme, à
           Super Admin      la configuration système, à la supervision des
                            opérations et aux analytiques.

  4        Manager /        Gestion des opérations quotidiennes, y compris
           Gestionnaire     les réservations, les prestataires et le support
                            client, avec des droits inférieurs à
                            l\'administrateur.

  7        Prestataire      Professionnel indépendant offrant ses services.
           (Contractor)     Gère son profil public, ses disponibilités, ses
                            services, ses réservations et ses revenus.

  2        Client           Utilisateur final qui recherche, réserve et paie
           Particulier      pour des services à domicile. Gère son compte,
                            son historique et ses moyens de paiement.

  3        Client           Compte d\'entreprise qui réserve des services
           Entreprise (B2B) pour ses employés ou événements, bénéficiant de
                            tarifs et de fonctionnalités spécifiques.

  6        Staff            Rôle interne avec des permissions limitées pour
                            des tâches de support spécifiques.
  --------------------------------------------------------------------------

*Note : Une incohérence a été identifiée entre les documents sources. Le
document DATABASE.md associe l\'ID 2 au rôle \"Manager/Gestionnaire\".
Pour ce document, la cartographie du Rapport Fonctionnel (ci-dessus)
sera utilisée car elle est plus alignée avec la segmentation
fonctionnelle de l\'application.*

**3.3 Interfaces Spécifiques par Rôle**

Chaque rôle bénéficie d\'un espace dédié et optimisé pour ses besoins.

**3.3.1 Espace Client**

L\'espace client est un tableau de bord personnel et complet où
l\'utilisateur final peut gérer l\'ensemble de son activité sur la
plateforme.

-   Gestion du profil personnel (nom, coordonnées, mot de passe).

-   Gestion des adresses de service pour accélérer les futures
    réservations.

-   Consultation de l\'historique détaillé des réservations (à venir,
    passées, annulées).

-   Gestion sécurisée des moyens de paiement et activation/gestion des
    cartes cadeaux.

**3.3.2 Interface Prestataire**

Les prestataires disposent d\'une interface centralisée conçue pour leur
permettre de gérer leur activité en toute autonomie.

-   Tableau de bord synthétique des revenus générés et des réservations
    à venir.

-   Gestion du profil public, incluant les spécialités, les zones
    géographiques desservies et une URL personnalisée (slug).

-   Calendrier interactif pour configurer les horaires de travail et
    gérer les indisponibilités.

-   Suivi transparent des revenus, du détail des commissions et des
    virements à venir.

**4.0 Système de Réservation (Cœur Fonctionnel)**

**4.1 Introduction et Vision**

Le système de réservation est la fonctionnalité la plus critique de la
plateforme Simone. Il a été conçu pour être à la fois intelligent,
flexible et intuitif, avec pour objectif d\'éliminer toute friction dans
le parcours utilisateur. Chaque étape, de la découverte d\'un service à
sa confirmation, est pensée pour guider l\'utilisateur de manière
transparente et transformer son intention en une réservation confirmée
en quelques clics.

**4.2 Découverte et Sélection des Services**

Pour aider les utilisateurs à trouver le service idéal, la plateforme
offre des outils de recherche et de navigation performants.

-   **Catalogue Structuré** : Les services sont organisés de manière
    logique en catégories et sous-catégories (ex: Beauté \> Soins du
    visage), ce qui facilite une exploration intuitive de l\'offre.

-   **Recherche Intelligente** : Une barre de recherche textuelle permet
    de trouver rapidement des services. Le moteur de recherche
    sous-jacent est insensible aux accents, garantissant des résultats
    pertinents même en cas de saisie approximative.

-   **Filtrage Avancé** : Les utilisateurs peuvent affiner leur
    recherche en appliquant des filtres multiples tels que la zone
    géographique, la catégorie de service, une fourchette de prix ou la
    durée de la prestation.

**4.3 Algorithme de Calcul des Disponibilités**

Le nouveau système de calcul des disponibilités (appointment\_\*) est un
pilier de l\'intelligence de la plateforme. Il garantit que seuls les
créneaux réellement réalisables sont proposés au client en intégrant un
ensemble complexe de contraintes en temps réel. Chaque contrainte n\'est
pas seulement technique, elle répond à un objectif métier précis pour
maximiser la fiabilité et l\'efficacité.

-   **Horaires de travail du prestataire** : Respecte l\'autonomie du
    professionnel et définit le cadre de base des disponibilités.

-   **Indisponibilités enregistrées** : Qu\'elles soient manuelles ou
    synchronisées, elles assurent que le planning personnel du
    prestataire est toujours prioritaire.

-   **Réservations déjà confirmées** : Évite les doubles réservations,
    garantissant la fiabilité du service.

-   **Temps de trajet estimé** : Levier majeur d\'optimisation
    opérationnelle, il augmente la capacité de revenus des prestataires
    en optimisant les tournées et renforce la fiabilité de la marque en
    garantissant la ponctualité.

-   **Temps tampon (buffer) de préparation** : Règle métier essentielle
    qui alloue le temps nécessaire entre deux prestations pour la
    préparation du matériel et la gestion des imprévus, garantissant un
    standard de service premium.

**4.4 Processus de Réservation**

Le parcours de réservation est découpé en étapes claires pour guider
l\'utilisateur jusqu\'à la confirmation.

1.  **Sélection du Service et Adresse** : L\'utilisateur choisit un
    service et renseigne l\'adresse d\'intervention, assisté par une
    fonction d\'autocomplétion.

2.  **Choix du Créneau** : Une interface de calendrier conviviale
    présente les créneaux disponibles, calculés dynamiquement par
    l\'algorithme.

3.  **Assignation du Prestataire** : Le système propose automatiquement
    le prestataire le plus pertinent en se basant sur la localisation,
    les spécialités et la charge de travail. Une sélection manuelle peut
    être proposée.

4.  **Ajout de Services Additionnels** : L\'utilisateur peut enrichir sa
    réservation avec des options ou des extensions de durée.

5.  **Paiement et Confirmation** : La réservation est finalisée par la
    création d\'un PaymentIntent Stripe avec capture_method défini sur
    manual, ce qui effectue une pré-autorisation sur le moyen de
    paiement du client sans le débiter immédiatement. Un code
    promotionnel ou le solde d\'une carte cadeau peut être appliqué.

**4.5 Gestion Post-Réservation**

Une fois la réservation effectuée, la plateforme offre des outils de
gestion flexibles, encadrés par des règles claires. Chaque réservation
évolue à travers un cycle de vie défini par des statuts clairs.

  ----------------------------------------------------------------------------
  Statut          Signification Fonctionnelle
  --------------- ------------------------------------------------------------
  **En attente**  La réservation est créée mais attend la confirmation du
                  prestataire.

  **Confirmée**   Le prestataire a accepté la réservation ; le rendez-vous est
                  bloqué.

  **Terminée**    La prestation a eu lieu.

  **Annulée**     La réservation a été annulée par le client ou le
                  prestataire.
  ----------------------------------------------------------------------------

Des règles strictes s\'appliquent pour les modifications et annulations
:

-   **Modification** : Le client peut modifier sa réservation
    gratuitement jusqu\'à deux fois, à condition que la demande soit
    faite plus de 24 heures avant le début de la prestation.

-   **Annulation** : La politique d\'annulation est gérée
    automatiquement.

    -   **Remboursement de 100%** pour toute annulation effectuée plus
        de 48 heures avant le rendez-vous.

    -   **Remboursement de 70%** pour une annulation entre 24 et 48
        heures avant.

    -   **Remboursement de 50%** pour une annulation à moins de 24
        heures.

**5.0 Écosystème Commercial et Monétisation**

**5.1 Gestion des Paiements**

L\'écosystème commercial est le moteur de la croissance de la
plateforme. Il repose sur un système de paiement entièrement sécurisé et
automatisé, conçu pour offrir une tranquillité d\'esprit à toutes les
parties prenantes.

-   **Intégration Stripe et Stripe Connect** : L\'ensemble des flux
    financiers est géré via Stripe. Les prestataires connectent leur
    propre compte via Stripe Connect, ce qui permet des virements
    directs et automatisés.

-   **Flux de Pré-autorisation et Capture** : Lors de la réservation, le
    montant est seulement pré-autorisé sur la carte du client. Le débit
    effectif (capture) n\'est déclenché qu\'après la confirmation du
    service par le prestataire ou une fois la prestation terminée.

-   **Gestion Automatisée des Commissions** : La plateforme calcule et
    prélève automatiquement sa commission sur chaque transaction avant
    de verser le revenu net au prestataire.

-   **Remboursements Automatisés** : Les remboursements, en cas
    d\'annulation éligible, sont gérés automatiquement par le système en
    application directe des règles commerciales.

**5.2 Catalogue et Offres**

Le catalogue est structuré pour permettre une gestion flexible des
offres et maximiser les opportunités de vente.

-   **Gestion des Services** : Les administrateurs peuvent définir des
    services avec des attributs précis (prix, durée, description,
    photos) et les organiser en catégories.

-   **Création de Packages** : La plateforme permet de regrouper
    plusieurs services en une offre unique (package), souvent à un tarif
    préférentiel, pour créer des parcours de soins complets.

-   **Boutique E-commerce** : En complément des services, une boutique
    intégrée permet la vente de produits physiques, avec une gestion des
    stocks en temps réel.

**5.3 Outils Marketing**

Des outils marketing puissants sont intégrés pour dynamiser les ventes
et fidéliser la clientèle.

-   **Promotions** : Les administrateurs peuvent créer des codes de
    réduction personnalisés (montant fixe ou pourcentage) avec des
    conditions d\'application fines (période de validité, services
    éligibles, etc.).

-   **Cartes Cadeaux** : Un système complet de cartes cadeaux virtuelles
    et physiques est disponible. Il inclut un processus d\'activation
    sécurisé qui lie la carte au compte de l\'utilisateur, et permet son
    utilisation comme moyen de paiement pour régler tout ou partie
    d\'une réservation.

**5.4 Offre Entreprise (B2B)**

Simone a développé une verticale stratégique dédiée aux entreprises,
avec des services et des fonctionnalités sur mesure.

-   **Catalogue de Services Dédiés** : Une offre de services spécialisés
    pour le monde de l\'entreprise est disponible, organisée autour de
    piliers comme le Bien-être, la Beauté et l\'Événementiel.

-   **Service \"Ready to Go\"** : Un service premium d\'intervention
    urgente est proposé, avec un surcoût de 30%, pour répondre aux
    besoins de dernière minute. Ce service est techniquement conditionné
    par le flag ready_to_go sur le profil du prestataire, qui certifie
    que son compte est entièrement configuré et validé.

-   **Comptes et Tarifs Négociés** : Les entreprises peuvent créer un
    compte B2B pour accéder à des tarifs négociés et à des options de
    facturation groupée après validation manuelle.

-   **Cartes Cadeaux Corporate** : Les cartes cadeaux destinées aux
    entreprises bénéficient d\'une validité étendue à 24 mois (contre 12
    mois pour les particuliers) et peuvent être personnalisées.

**6.0 Outils d\'Administration (Back-Office)**

**6.1 Tableau de Bord Analytique**

Le back-office est le centre de contrôle de la plateforme, offrant aux
équipes une vision à 360 degrés de l\'activité. Dès la connexion, un
tableau de bord analytique présente les indicateurs de performance
(KPIs) les plus critiques pour un pilotage éclairé.

-   **Indicateurs Financiers** : Suivi des revenus, répartition par type
    de service.

-   **Métriques de Réservation** : Volume total de réservations, taux de
    confirmation et d\'annulation.

-   **Performance des Prestataires** : Classement des meilleurs
    prestataires, suivi des nouvelles inscriptions.

-   **Activité des Clients** : Acquisition de nouveaux clients, taux de
    rétention, panier moyen.

**6.2 Gestion Opérationnelle**

Le back-office centralise les outils nécessaires à la gestion des
opérations quotidiennes.

-   **Gestion Centralisée des Réservations** : Visualisation,
    modification et annulation de n\'importe quelle réservation.

-   **Gestion des Utilisateurs** : Outils complets pour créer, modifier,
    activer ou désactiver les comptes clients et prestataires.

-   **Validation des Nouveaux Prestataires** : Workflow dédié pour
    examiner les candidatures et vérifier les documents avant d\'activer
    un profil.

-   **Configuration Générale du Système** : Interface pour ajuster les
    paramètres de la plateforme, comme les intégrations externes ou les
    règles de paiement.

**6.3 Système de Tâches Internes**

Pour optimiser les processus internes, la plateforme intègre un système
de gestion de tâches fonctionnant comme un outil de workflow
collaboratif. Il permet de créer, assigner et suivre des tâches
spécifiques (ex: \"Vérifier un paiement échoué\"), de les lier à des
entités comme une réservation ou un client, et de les organiser par
statut et priorité pour assurer un traitement efficace.

**6.4 Système de Gestion de Contenu (CMS)**

Un système de gestion de contenu (CMS) intégré offre une autonomie
complète aux équipes non techniques pour gérer le contenu éditorial et
marketing du site.

-   **Gestion des Pages et Sections** : Création et modification du
    contenu des pages institutionnelles (FAQ, \"À propos\", etc.) sans
    intervention technique.

-   **Blog Intégré** : Outil de blogging complet pour rédiger et publier
    des articles afin d\'animer la communication et d\'améliorer le
    référencement.

-   **Bibliothèque Média Centralisée** : Espace unique pour téléverser
    et gérer l\'ensemble des images et fichiers médias utilisés sur la
    plateforme.

**7.0 Communication et Notifications**

**7.1 Chat en Temps Réel**

Un système de messagerie instantanée est intégré pour faciliter les
échanges directs. Il remplit deux fonctions principales :

1.  **Communication contextuelle liée à une réservation**, permettant au
    client et au prestataire d\'échanger des informations pratiques.

2.  **Canal de support direct**, offrant aux utilisateurs un moyen de
    contacter rapidement l\'équipe Simone pour toute question ou
    problème.

**7.2 Système de Notifications Automatisé**

La plateforme s\'appuie sur une stratégie de notification multicanal
pour garantir que les utilisateurs reçoivent des informations
pertinentes et opportunes via le canal le plus approprié.

  -------------------------------------------------------------------------
  Canal              Événements           Exemples d\'Usage
                     Déclencheurs         
  ------------------ -------------------- ---------------------------------
  **Notifications    Changement de        Notification de confirmation,
  in-app**           statut, nouveau      alerte nouveau message de chat.
                     message              

  **E-mails (via     Actions de compte,   Confirmation d\'inscription,
  Resend)**          confirmations        récapitulatif de commande, reçu
                                          de paiement.

  **SMS (via         Notifications        Rappel de rendez-vous la veille
  Twilio/Vonage)**   urgentes, rappels    (J-1), envoi de codes de
                                          vérification.
  -------------------------------------------------------------------------

**8.0 Interface Utilisateur et Design System (UI/UX)**

**8.1 Philosophie de Design et Approche Mobile-First**

La philosophie de design de la plateforme Simone vise une esthétique
**premium, luxueuse et élégante**, en accord avec son positionnement
haut de gamme. L\'approche technique est résolument **mobile-first**,
garantissant une expérience utilisateur fluide et optimisée sur tous les
appareils. La plateforme est développée comme une **Progressive Web App
(PWA)**, offrant des fonctionnalités similaires à celles d\'une
application native, telles que l\'installation sur l\'écran d\'accueil,
les notifications push et un accès hors-ligne à certaines informations
essentielles.

**8.2 Design System**

Pour garantir la cohérence visuelle et l\'efficacité du développement,
la plateforme s\'appuie sur un Design System robuste.

-   **Frameworks** : L\'interface est construite avec **Tailwind CSS**
    pour le style utilitaire et la bibliothèque de composants
    **shadcn/ui** pour les éléments d\'interface réutilisables.

-   **Système de Couleurs** : Basé sur des tokens CSS en HSL, il permet
    de gérer facilement les thèmes light et dark de manière cohérente
    sur l\'ensemble de l\'application.

-   **Typographie** : Une hiérarchie typographique claire est définie
    avec les polices Playfair Display pour les titres et Inter pour le
    corps de texte, assurant une lisibilité et une élégance optimales.

-   **Espacements et Grilles** : L\'échelle d\'espacement standard de
    Tailwind est utilisée pour maintenir un rythme visuel cohérent entre
    tous les éléments.

-   **Icônes** : La bibliothèque **Lucide React** est utilisée pour un
    ensemble d\'icônes nettes, cohérentes et légères.

**8.3 Composants UI Principaux**

L\'interface est construite à partir d\'un ensemble de composants UI
standardisés et accessibles, basés sur shadcn/ui. Parmi les plus
importants, on retrouve :

-   Button

-   Card

-   Dialog (fenêtres modales)

-   Input (champs de formulaire)

-   Select (listes déroulantes)

-   Badge

-   Avatar

L\'utilisation systématique de ces composants garantit une expérience
utilisateur prédictible et une cohérence visuelle impeccable sur toute
la plateforme.

**9.0 Architecture de Sécurité**

**9.1 Isolation des Données avec Row Level Security (RLS)**

La sécurité des données est un pilier fondamental de l\'architecture de
la plateforme. Elle est principalement mise en œuvre via la
fonctionnalité **Row Level Security (RLS)** de PostgreSQL, activée par
défaut sur Supabase. Ce mécanisme puissant garantit qu\'un utilisateur
authentifié ne peut accéder, lire ou modifier que les données qui lui
sont explicitement autorisées par des politiques de sécurité définies au
niveau de la base de données. Par exemple, un client ne peut visualiser
que ses propres réservations, et un prestataire ne peut accéder qu\'aux
rendez-vous qui lui sont assignés, assurant ainsi un cloisonnement total
des informations.

**9.2 Bonnes Pratiques de Sécurité**

En complément de la RLS, plusieurs autres mesures sont mises en place
pour garantir un niveau de sécurité élevé.

-   **Authentification par Tokens JWT** : La gestion des sessions est
    assurée par des JSON Web Tokens (JWT) sécurisés, gérés nativement
    par Supabase Auth.

-   **Protection des Données Sensibles** : Les secrets et clés API sont
    chiffrés et stockés de manière sécurisée. La plateforme respecte les
    principes du RGPD, notamment en ce qui concerne la collecte et le
    traitement des données personnelles.

-   **Validation Stricte des Entrées** : Toutes les données soumises par
    les utilisateurs sont validées à la fois côté client (avec des
    schémas Zod) et côté serveur pour prévenir les injections et
    garantir l\'intégrité des données.

-   **Protection contre les attaques communes** : L\'utilisation de
    frameworks modernes et le respect des bonnes pratiques offrent une
    protection native contre les failles courantes telles que le
    Cross-Site Scripting (XSS) et le Cross-Site Request Forgery (CSRF).

-   **Gestion sécurisée des clés API** : Toutes les clés d\'API des
    services tiers sont stockées en tant que secrets chiffrés dans
    l\'environnement Supabase et ne sont jamais exposées côté client.

**10.0 Exigences Non-Fonctionnelles**

**10.1 Performance**

La plateforme doit répondre à des objectifs de performance stricts pour
garantir une expérience utilisateur fluide et premium.

-   **Temps de chargement initial** : Doit être inférieur à 3 secondes.

-   **Temps de réponse des API** : Les requêtes serveur doivent répondre
    en moins de 1 seconde.

-   **Disponibilité du service** : L\'objectif de disponibilité de la
    plateforme est supérieur à 99.9%.

-   **Optimisation des requêtes** : Utilisation systématique d\'index de
    base de données et de vues matérialisées pour les requêtes complexes
    afin de garantir des temps de réponse rapides.

**10.2 Accessibilité**

L\'application doit être accessible au plus grand nombre. Elle vise une
conformité avec les standards d\'accessibilité web au niveau **WCAG
AA**. Cela inclut des contrastes de couleurs suffisants, une navigation
au clavier complète sur tous les éléments interactifs, et l\'utilisation
correcte des balises sémantiques et des attributs ARIA pour les lecteurs
d\'écran.

**10.3 Stratégie de Test**

La qualité et la fiabilité de la plateforme sont assurées par une
stratégie de test multi-niveaux. Le document CAHIER_RECETTE.md, qui
contient plus de 150 cas de tests fonctionnels, de sécurité et de
performance détaillés, doit servir de **base pour les critères
d\'acceptation** de chaque fonctionnalité développée. La validation de
ces tests est un prérequis pour toute mise en production.

**11.0 Annexe : Liste des Edge Functions (API)**

**11.1 Introduction**

La logique métier côté serveur et les intégrations avec des services
tiers sont principalement implémentées via des **Edge Functions**
hébergées sur Supabase et exécutées dans un environnement Deno. Ces
fonctions constituent les points d\'entrée de l\'API privée de la
plateforme. Cette annexe liste les fonctions principales, organisées par
domaine fonctionnel.

**11.2 Liste des Fonctions par Domaine**

-   **Authentification**

    -   check-email-exists

    -   send-email-verification

    -   send-reset-code

    -   update-user-password

-   **Réservations**

    -   get-availabilities

    -   get-availabilities-v2

    -   intelligent-assignment

    -   cancel-reservation

    -   update-reservation-status

    -   send-reservation-notifications

-   **Paiements**

    -   create-payment-authorization

    -   update-payment-authorization

    -   update-reservation-with-payment

    -   capture-payment

    -   pay-with-saved-card

    -   update-payment-amount

    -   update-payment-intent-metadata

    -   manage-payment-methods

    -   get-stripe-config

-   **Stripe Connect**

    -   sync-stripe-customer

    -   check-stripe-capabilities

    -   regularize-promo-commission

-   **Communication**

    -   send-contact-email

    -   send-enterprise-quote-request

    -   send-event-quote-request

    -   newsletter-subscribe

    -   newsletter-confirm

-   **Intégrations Externes**

    -   geocode-institutes

    -   get-google-maps-key

    -   verify-recaptcha

-   **Gestion Interne**

    -   submit-job-application

    -   migrate-users-hybrid
