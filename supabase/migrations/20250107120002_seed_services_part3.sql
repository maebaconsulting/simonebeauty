-- Migration: 20250107120002_seed_services_part3.sql
-- Feature: Service Data Population (Part 3)
-- Description: Final services (Massage continuation, Minceur, Epilation, Maquillage)
-- Date: 2025-11-07

-- =============================================================================
-- 5. 💆 MASSAGE BIEN-ETRE (continued)
-- =============================================================================

-- AU NIRVANA (4 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'L''Ayurvédique',
  'massage-ayurvedique',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-au-nirvana'),
  125.00, 75,
  'Massage indien ancestral aux huiles tièdes pour l''équilibre corps-esprit',
  'Technique millénaire de l''Ayurveda qui harmonise les énergies. Mouvements rythmés et application d''huiles chaudes spécifiques selon votre dosha. Détente profonde et rééquilibrage énergétique.',
  true, true, true, 54,
  ARRAY['massage', 'ayurvédique', 'indien', 'énergétique', 'huiles']
),
(
  'Le Balinais',
  'massage-balinais',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-au-nirvana'),
  125.00, 75,
  'Massage traditionnel de Bali alliant douceur et profondeur',
  'Massage complet du corps inspiré des techniques balinaises. Combine acupressions, étirements doux, massage des tissus profonds et application d''huiles parfumées. Voyage sensoriel garanti.',
  true, true, true, 55,
  ARRAY['massage', 'balinais', 'exotique', 'relaxation', 'voyage']
),
(
  'Le Thaï',
  'massage-thai',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-au-nirvana'),
  125.00, 75,
  'Massage traditionnel thaïlandais avec étirements passifs',
  'Massage habillé sur futon avec étirements inspirés du yoga. Travail sur les lignes d''énergie Sen. Améliore la flexibilité, libère les tensions et revitalise. Souvent appelé "yoga massage".',
  true, true, true, 56,
  ARRAY['massage', 'thaï', 'étirements', 'yoga', 'énergétique']
),
(
  'Le Japonais',
  'massage-japonais',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-au-nirvana'),
  125.00, 75,
  'Massage japonais traditionnel Shiatsu pour rééquilibrer les énergies',
  'Technique de pressions digitales sur les méridiens énergétiques. Pratiqué habillé sur futon. Libère les blocages, améliore la circulation énergétique et apporte une profonde détente.',
  true, true, true, 57,
  ARRAY['massage', 'japonais', 'shiatsu', 'acupression', 'énergétique']
);

-- LES CLASSIQUES (3 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Le Relaxant',
  'massage-relaxant',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-les-classiques'),
  88.00, 60,
  'Massage doux du corps entier pour évacuer le stress',
  'Massage enveloppant avec manœuvres lentes et fluides. Idéal pour se détendre après une journée stressante.',
  'Ce massage relaxant est conçu pour apaiser le système nerveux et favoriser le lâcher-prise. Les manœuvres douces et rythmées, combinées à des huiles essentielles apaisantes (lavande, camomille), induisent un état de relaxation profonde. Le massage couvre l''ensemble du corps dans une ambiance tamisée avec musique douce. Parfait pour améliorer la qualité du sommeil et réduire l''anxiété.',
  'Grossesse (1er trimestre), problèmes cardiaques non stabilisés, phlébite',
  'Détente garantie. Éviter de conduire immédiatement après. Boire de l''eau. Repos conseillé.',
  true, true, true, 58,
  ARRAY['massage', 'relaxant', 'anti-stress', 'douceur']
),
(
  'Le Sportif',
  'massage-sportif',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-les-classiques'),
  88.00, 60,
  'Massage dynamique pour les muscles sollicités par le sport',
  'Massage tonique qui prépare ou récupère après l''effort. Techniques de pétrissage, friction et étirements.',
  'Le massage sportif s''adapte à vos besoins : avant l''effort (échauffement, prévention), ou après l''effort (récupération, élimination de l''acide lactique). Manœuvres dynamiques et profondes sur les groupes musculaires sollicités. Améliore la performance, prévient les blessures et accélère la récupération. Recommandé pour les sportifs réguliers ou avant/après un événement sportif.',
  'Blessures récentes non soignées, inflammations aiguës, déchirures musculaires',
  'Courbatures possibles dans les 48h (signe d''efficacité). Hydratation ++. Étirements légers.',
  true, true, true, 59,
  ARRAY['massage', 'sportif', 'récupération', 'performance', 'tonique']
),
(
  'Le Dos',
  'massage-dos',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-les-classiques'),
  58.00, 45,
  'Massage ciblé dos, nuque et épaules pour soulager les tensions',
  'Concentration sur la zone la plus sujette au stress. Libère les tensions accumulées au bureau ou dans les mauvaises postures.',
  'Massage ciblé sur le dos, la nuque, les épaules et le haut des bras - zones qui accumulent 80% des tensions quotidiennes. Travail en profondeur pour dénouer les contractures et améliorer la mobilité. Idéal pour les personnes travaillant sur ordinateur, souffrant de maux de tête de tension ou de douleurs cervicales.',
  'Hernies discales non stabilisées, scoliose sévère, fractures récentes',
  'Appliquer de la chaleur le soir (bouillotte). Étirements doux quotidiens. Ergonomie au poste de travail.',
  true, true, true, 60,
  ARRAY['massage', 'dos', 'nuque', 'épaules', 'tensions', 'bureau']
);

-- LES THEMATIQUES (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  hygienic_precautions, contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Massage Femme Enceinte',
  'massage-femme-enceinte',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-thematiques'),
  98.00, 60,
  'Massage adapté à la grossesse pour soulager les maux de future maman',
  'Massage doux et sécurisé pour femmes enceintes à partir du 4ème mois. Soulage douleurs dorsales, jambes lourdes et tensions.',
  'Ce massage spécifique est adapté aux besoins de la femme enceinte. Position confortable sur le côté avec coussins de soutien. Manœuvres douces sur le dos, les jambes, les pieds et les bras. Soulage les douleurs lombaires, améliore la circulation (jambes lourdes), réduit les œdèmes et favorise la détente. Huiles végétales neutres sans huiles essentielles. Moment privilégié pour se reconnecter à son corps et son bébé.',
  'Coussins et support désinfectés. Huiles végétales pures sans parfum. Position latérale de sécurité.',
  'Grossesse à risque, menace d''accouchement prématuré, placenta praevia, hypertension gravidique sévère. Certificat médical requis si doute.',
  'Boire beaucoup d''eau. Repos après le massage. Signaler immédiatement toute gêne.',
  false, true, true, 61,
  ARRAY['massage', 'grossesse', 'prénatal', 'femme-enceinte', 'maternité']
),
(
  'Massage Crânien',
  'massage-cranien',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-thematiques'),
  58.00, 45,
  'Massage du cuir chevelu, nuque et visage pour libérer les tensions',
  'Massage ciblé sur la tête pour apaiser migraines, insomnies et stress mental. Effet immédiat de légèreté.',
  'Le massage crânien indien (Champissage) cible le cuir chevelu, la nuque, les tempes et le visage. Pressions circulaires, tapotements et effleurages stimulent la microcirculation, détendent les muscles de la tête et favorisent la détente mentale. Particulièrement efficace contre les maux de tête de tension, les insomnies, le stress mental et la fatigue oculaire. Stimule également la pousse des cheveux. Réalisé assis ou allongé, habillé.',
  'Mains lavées et désinfectées. Pas d''huile si vous ne souhaitez pas vous laver les cheveux après.',
  'Migraines aiguës en cours, plaies du cuir chevelu, poux, dermatite séborrhéique sévère',
  'Sensation de légèreté immédiate. Possible somnolence après. Idéal le soir avant le coucher.',
  true, true, true, 62,
  ARRAY['massage', 'crânien', 'tête', 'migraines', 'cuir-chevelu', 'relaxation']
);

-- =============================================================================
-- 6. 🏃 MINCEUR & DRAINAGE - 13 services
-- =============================================================================

-- FOCUS FERMETE (1 service)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Focus Fermeté',
  'focus-fermete',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-focus-fermete'),
  98.00, 60,
  'Soin raffermissant pour retendre la peau et tonifier les tissus',
  'Protocole anti-relâchement qui combine massage tensor, application de cosmétiques raffermissants et technique de palper-rouler doux. Cible les zones sujettes au relâchement cutané (ventre, bras, cuisses). Peau plus ferme et tonique dès la première séance.',
  true, true, true, 63,
  ARRAY['fermeté', 'raffermissant', 'anti-relâchement', 'tonifiant']
);

-- LE DRAINAGE (3 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Méthode Renata',
  'methode-renata',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-le-drainage'),
  118.00, 60,
  'Drainage lymphatique brésilien intensif pour éliminer rétention d''eau et toxines',
  'Technique de massage drainant très efficace venue du Brésil. Mouvements rapides et rythmés qui activent puissamment la circulation lymphatique.',
  'La Méthode Renata França est une technique de drainage lymphatique révolutionnaire venue du Brésil. Contrairement au drainage classique (doux et lent), cette méthode utilise des manœuvres fermes, rapides et rythmées qui activent intensément la circulation lymphatique et veineuse. Résultats visibles dès la première séance : diminution immédiate de la rétention d''eau, dégonflement, jambes légères, silhouette affinée. Idéal avant un événement ou en cure pour des résultats durables.',
  'Phlébite, thrombose, insuffisance cardiaque, cancer en évolution, grossesse, infections, fièvre',
  'Boire 2L d''eau dans les 24h. Uriner fréquemment (élimination des toxines). Éviter sel et alcool.',
  true, true, true, 64,
  ARRAY['drainage', 'rétention-eau', 'lymphatique', 'renata', 'brésilien', 'détox']
),
(
  'Drainage Japonais Visage',
  'drainage-japonais-visage',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-le-drainage'),
  88.00, 60,
  'Drainage facial japonais pour dégonfler, lifter et illuminer le visage',
  'Technique de massage facial drainant qui sculpte les traits et redonne de l''éclat. Effet anti-cernes, dégonflement et effet bonne mine immédiat.',
  'Le drainage facial japonais (Kobido) est un soin ancestral qui combine drainage lymphatique et techniques de rajeunissement. Les manœuvres précises et rythmées activent la microcirculation, éliminent les toxines, dégonflent les poches et cernes, et redessinent l''ovale du visage. Le teint est lumineux, les traits reposés et liftés. Effet "bonne mine" garanti. Parfait le matin ou avant un événement.',
  'Chirurgie esthétique récente (attendre 3 mois), infections cutanées, rosacée sévère',
  'Résultat optimal le matin. Boire beaucoup d''eau. Éviter maquillage 2h après.',
  true, true, true, 65,
  ARRAY['drainage', 'visage', 'japonais', 'kobido', 'anti-cernes', 'éclat']
),
(
  'Drainage Lymphatique',
  'drainage-lymphatique',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-le-drainage'),
  118.00, 60,
  'Drainage lymphatique manuel classique pour stimuler le système lymphatique',
  'Technique douce de massage qui active la circulation de la lymphe. Détoxifie l''organisme, réduit rétention d''eau et renforce l''immunité.',
  'Le drainage lymphatique manuel selon Vodder est une technique thérapeutique douce qui stimule la circulation lymphatique. Mouvements lents, doux et rythmés qui suivent les voies lymphatiques. Favorise l''élimination des toxines et des déchets métaboliques, réduit les œdèmes et la rétention d''eau, améliore l''immunité. Sensation de légèreté et de détente. Recommandé en cure pour des résultats optimaux.',
  'Hyperthyroïdie non traitée, cancer en évolution, infections aiguës, insuffisance cardiaque, thrombose',
  'Boire beaucoup d''eau. Urines foncées normales (élimination toxines). Alimentation légère.',
  true, true, true, 66,
  ARRAY['drainage', 'lymphatique', 'détox', 'rétention-eau', 'œdème']
);

-- LE REMODELAGE (3 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Palper-Rouler',
  'palper-rouler',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-le-remodelage'),
  98.00, 60,
  'Technique manuelle anti-cellulite pour lisser la peau d''orange',
  'Massage profond qui casse les capitons graisseux et améliore l''aspect de la cellulite. Technique manuelle ciblée sur les zones concernées (cuisses, fesses, ventre). Résultats visibles en cure de 5 à 10 séances.',
  true, true, true, 67,
  ARRAY['palper-rouler', 'cellulite', 'peau-orange', 'minceur', 'remodelage']
),
(
  'Madero-Thérapie',
  'madero-therapie',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-le-remodelage'),
  98.00, 60,
  'Massage colombien aux bâtons de bois pour sculpter la silhouette',
  'Technique venue de Colombie utilisant des outils en bois de différentes formes. Casse les amas graisseux, draine, raffermit et redessine la silhouette. Alternative naturelle à la liposuccion.',
  true, true, true, 68,
  ARRAY['madero', 'colombien', 'minceur', 'drainage', 'sculpture', 'bois']
),
(
  'Cellu M6',
  'cellu-m6',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-le-remodelage'),
  98.00, 60,
  'Technique mécanique LPG Endermologie pour traiter cellulite et relâchement',
  'Appareil de référence en minceur. Rouleaux motorisés + aspiration douce pour déloger la cellulite incrustée, lisser la peau et raffermir les tissus. Résultats prouvés cliniquement.',
  true, true, true, 69,
  ARRAY['cellu-m6', 'LPG', 'endermologie', 'cellulite', 'mécanique']
);

-- LES CURES 5 SEANCES (3 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags,
  has_many_session, number_of_session
) VALUES
(
  'Cure 5 séances : Palper-Rouler',
  'cure-5-seances-palper-rouler',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-cures-5-seances'),
  460.00, 300,
  'Forfait cure anti-cellulite avec 5 séances de palper-rouler',
  'Formule économique pour un traitement complet de la cellulite. 5 séances à raison d''une par semaine pour des résultats optimaux. Économie de 30€ vs séances unitaires.',
  true, true, true, 70,
  ARRAY['cure', 'palper-rouler', 'cellulite', 'forfait', 'économique'],
  true, 5
),
(
  'Cure 5 séances : Madero-Thérapie',
  'cure-5-seances-madero',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-cures-5-seances'),
  460.00, 300,
  'Forfait cure minceur avec 5 séances de madero-thérapie',
  'Programme minceur intensif sur 5 semaines. La régularité garantit les résultats. Économie de 30€ vs séances unitaires.',
  true, true, true, 71,
  ARRAY['cure', 'madero', 'minceur', 'forfait', 'économique'],
  true, 5
),
(
  'Cure 5 séances : Cellu M6',
  'cure-5-seances-cellu-m6',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-cures-5-seances'),
  460.00, 300,
  'Forfait cure anti-cellulite avec 5 séances de Cellu M6',
  'Programme complet LPG Endermologie. 5 séances pour des résultats visibles et mesurables. Économie de 30€ vs séances unitaires.',
  true, true, true, 72,
  ARRAY['cure', 'cellu-m6', 'LPG', 'forfait', 'économique'],
  true, 5
);

-- UNE SEANCE SUR MESURE (3 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Sur mesure 45 min',
  'sur-mesure-45min',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-sur-mesure'),
  78.00, 45,
  'Séance personnalisée combinant différentes techniques selon vos besoins',
  'Protocole sur-mesure créé par la praticienne selon vos objectifs : drainage + palper-rouler, ou madero + drainage, etc. Ciblé sur 1 à 2 zones.',
  true, true, true, 73,
  ARRAY['sur-mesure', 'personnalisé', 'combiné', 'minceur']
),
(
  'Sur mesure 60 min',
  'sur-mesure-60min',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-sur-mesure'),
  98.00, 60,
  'Séance personnalisée d''1h combinant plusieurs techniques',
  'Protocole complet adapté à vos besoins spécifiques. Combinaison de 2 à 3 techniques pour cibler efficacement vos zones problématiques.',
  true, true, true, 74,
  ARRAY['sur-mesure', 'personnalisé', 'combiné', 'complet']
),
(
  'Sur mesure 90 min',
  'sur-mesure-90min',
  (SELECT id FROM service_categories WHERE slug = 'minceur-drainage'),
  (SELECT id FROM service_categories WHERE slug = 'minceur-sur-mesure'),
  138.00, 90,
  'Séance premium 1h30 pour un traitement corps complet',
  'Protocole luxe combinant toutes les techniques disponibles. Traitement global du corps pour un résultat optimal. Séance ultra-complète et personnalisée.',
  true, true, true, 75,
  ARRAY['sur-mesure', 'personnalisé', 'premium', 'complet', 'luxe']
);

-- =============================================================================
-- 7. 🪒 EPILATION - 10 services
-- =============================================================================

-- FORFAIT DEMI-JAMBES (4 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Demi-jambes + Aisselles',
  'demi-jambes-aisselles',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-demi-jambes'),
  48.00, 45,
  'Forfait épilation demi-jambes et aisselles à la cire',
  'Formule pratique et économique. Cire chaude ou tiède selon les zones. Peau douce pour 3 à 4 semaines.',
  false, true, true, 76,
  ARRAY['épilation', 'cire', 'demi-jambes', 'aisselles', 'forfait']
),
(
  'Demi-jambes + Maillot Simple',
  'demi-jambes-maillot-simple',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-demi-jambes'),
  52.00, 45,
  'Forfait épilation demi-jambes et maillot classique',
  'Épilation des demi-jambes + maillot simple (sur les côtés uniquement). Cire adaptée aux zones sensibles.',
  false, true, true, 77,
  ARRAY['épilation', 'cire', 'demi-jambes', 'maillot', 'forfait']
),
(
  'Demi-jambes + Maillot Brésilien',
  'demi-jambes-maillot-bresilien',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-demi-jambes'),
  58.00, 60,
  'Forfait épilation demi-jambes et maillot brésilien',
  'Demi-jambes + maillot brésilien (ne laisse qu''une bande devant). Cire spéciale peaux sensibles.',
  false, true, true, 78,
  ARRAY['épilation', 'cire', 'demi-jambes', 'maillot-brésilien', 'forfait']
),
(
  'Demi-jambes + Maillot Intégral',
  'demi-jambes-maillot-integral',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-demi-jambes'),
  62.00, 60,
  'Forfait épilation demi-jambes et maillot intégral',
  'Demi-jambes + maillot intégral complet. Cire hypoallergénique pour zone sensible.',
  false, true, true, 79,
  ARRAY['épilation', 'cire', 'demi-jambes', 'maillot-intégral', 'forfait']
);

-- FORFAIT JAMBES ENTIERES (4 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Jambes entières + Aisselles',
  'jambes-entieres-aisselles',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-jambes-entieres'),
  66.00, 60,
  'Forfait épilation jambes complètes et aisselles',
  'Épilation complète des jambes (cuisses incluses) + aisselles. Formule complète pour être impeccable.',
  false, true, true, 80,
  ARRAY['épilation', 'cire', 'jambes-entières', 'aisselles', 'forfait']
),
(
  'Jambes entières + Maillot Simple',
  'jambes-entieres-maillot-simple',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-jambes-entieres'),
  68.00, 60,
  'Forfait épilation jambes complètes et maillot classique',
  'Jambes entières + maillot simple. Formule idéale pour l''été.',
  false, true, true, 81,
  ARRAY['épilation', 'cire', 'jambes-entières', 'maillot', 'forfait']
),
(
  'Jambes entières + Maillot Brésilien',
  'jambes-entieres-maillot-bresilien',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-jambes-entieres'),
  72.00, 75,
  'Forfait épilation jambes complètes et maillot brésilien',
  'Jambes entières + maillot brésilien. Formule complète pour une épilation parfaite.',
  false, true, true, 82,
  ARRAY['épilation', 'cire', 'jambes-entières', 'maillot-brésilien', 'forfait']
),
(
  'Jambes entières + Maillot Intégral',
  'jambes-entieres-maillot-integral',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-forfait-jambes-entieres'),
  78.00, 75,
  'Forfait épilation jambes complètes et maillot intégral',
  'Formule premium : jambes entières + maillot intégral complet. Épilation totale du bas du corps.',
  false, true, true, 83,
  ARRAY['épilation', 'cire', 'jambes-entières', 'maillot-intégral', 'forfait', 'premium']
);

-- UNE ZONE (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Lèvre ou Menton',
  'levre-ou-menton',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-une-zone'),
  18.00, 15,
  'Épilation à la cire du duvet de la lèvre supérieure ou du menton',
  'Épilation rapide et précise du visage. Cire spéciale visage hypoallergénique. Résultat net pour 3 à 4 semaines.',
  false, true, true, 84,
  ARRAY['épilation', 'cire', 'visage', 'lèvre', 'menton', 'duvet']
),
(
  'Sourcils',
  'epilation-sourcils',
  (SELECT id FROM service_categories WHERE slug = 'epilation'),
  (SELECT id FROM service_categories WHERE slug = 'epilation-une-zone'),
  20.00, 15,
  'Épilation des sourcils à la cire pour un regard net',
  'Épilation à la cire des poils disgracieux autour des sourcils. Ne remplace pas la restructuration complète. Simple entretien de la ligne de sourcils.',
  true, true, true, 85,
  ARRAY['épilation', 'cire', 'sourcils', 'regard']
);

-- =============================================================================
-- 8. 💄 MAQUILLAGE - 3 services
-- =============================================================================

INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Cours de Maquillage',
  'cours-maquillage',
  (SELECT id FROM service_categories WHERE slug = 'maquillage'),
  (SELECT id FROM service_categories WHERE slug = 'maquillage-maquillage'),
  98.00, 60,
  'Cours particulier pour apprendre les techniques de maquillage adaptées à vous',
  'Apprenez à vous maquiller selon votre morphologie. Cours personnalisé avec conseils produits et techniques.',
  'Cours de maquillage entièrement personnalisé en tête-à-tête avec une maquilleuse professionnelle. Analyse de votre morphologie, de votre carnation et de votre style. Apprentissage des techniques de base (teint, yeux, lèvres) et astuces pour corriger vos petits défauts. Vous repartez avec une fiche personnalisée récapitulative et une liste de produits adaptés à votre budget. Apportez vos propres produits ou utilisez notre matériel professionnel.',
  'Nettoyer votre peau avant. Apporter vos produits si souhaité. Prendre des photos pour mémoriser.',
  false, true, true, 86,
  ARRAY['maquillage', 'cours', 'apprentissage', 'beauté', 'formation']
),
(
  'Maquillage jour',
  'maquillage-jour',
  (SELECT id FROM service_categories WHERE slug = 'maquillage'),
  (SELECT id FROM service_categories WHERE slug = 'maquillage-maquillage'),
  78.00, 45,
  'Maquillage naturel pour sublimer votre beauté au quotidien',
  'Maquillage léger et frais pour un look naturel. Parfait pour un rendez-vous, un entretien ou simplement pour vous sentir belle.',
  'Maquillage jour naturel et lumineux qui met en valeur vos atouts sans surcharge. Teint unifié et mat, regard sublimé, bouche naturelle. Le maquillage tient toute la journée et reste confortable. Idéal pour les débutantes en maquillage ou pour un événement diurne (déjeuner, rendez-vous professionnel, shooting photo). Produits longue tenue et hypoallergéniques.',
  'Venir démaquillée et peau hydratée. Apporter une photo de référence si souhaité.',
  false, true, true, 87,
  ARRAY['maquillage', 'jour', 'naturel', 'léger', 'beauté']
),
(
  'Maquillage soirée',
  'maquillage-soiree',
  (SELECT id FROM service_categories WHERE slug = 'maquillage'),
  (SELECT id FROM service_categories WHERE slug = 'maquillage-maquillage'),
  98.00, 60,
  'Maquillage glamour pour vos événements et soirées',
  'Maquillage sophistiqué et lumineux pour briller en soirée. Tenue longue durée garantie toute la nuit.',
  'Maquillage soirée élaboré et glamour pour tous vos événements : mariage, gala, soirée, vernissage. Teint parfait haute couvrance, yeux intensément maquillés (smoky, paillettes ou classique selon vos souhaits), lèvres sophistiquées. Le maquillage est étudié pour résister toute la soirée (jusqu''à 12h) et être photogénique. Mise en beauté complète qui vous fera vous sentir comme une star.',
  'Venir démaquillée. Apporter des photos d''inspiration. Essai possible sur rdv quelques jours avant.',
  false, true, true, 88,
  ARRAY['maquillage', 'soirée', 'glamour', 'événement', 'sophistiqué', 'longue-tenue']
);

-- =============================================================================
-- FINALIZATION
-- =============================================================================

-- Drop helper function
DROP FUNCTION IF EXISTS get_category_id(TEXT);

-- Verify all services were inserted
DO $$
DECLARE
  service_count INT;
BEGIN
  SELECT COUNT(*) INTO service_count FROM services;
  RAISE NOTICE 'Total services in database: %', service_count;

  IF service_count < 88 THEN
    RAISE WARNING 'Expected 88 services, but found only %', service_count;
  ELSE
    RAISE NOTICE '✅ All 88 services successfully inserted!';
  END IF;
END $$;
