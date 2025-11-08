-- Migration: 20250107120001_seed_services_part2.sql
-- Feature: Service Data Population (Part 2)
-- Description: Continue seeding services (LE VISAGE, LE REGARD, MASSAGE BIEN-ETRE)
-- Date: 2025-11-07

-- =============================================================================
-- 3. 🌸 LE VISAGE - 5 services
-- =============================================================================

-- 10 ANS DE MOINS (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  hygienic_precautions, contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  '10 ans de moins : Le Révélateur Absolu',
  '10-ans-de-moins-revelateur-absolu',
  (SELECT id FROM service_categories WHERE slug = 'le-visage'),
  (SELECT id FROM service_categories WHERE slug = 'visage-10-ans-de-moins'),
  158.00, 90,
  'Soin anti-âge intensif pour un effet repulpant et liftant immédiat',
  'Protocole anti-âge professionnel qui cible les rides, le relâchement cutané et le manque d''éclat. Résultats visibles dès la première séance.',
  'Ce soin combine plusieurs techniques de modelage facial (gymnastique faciale, drainage lymphatique, acupression) avec des actifs concentrés en acide hyaluronique et collagène. Le protocole stimule la production naturelle de collagène et améliore la microcirculation pour un effet tensor immédiat. La peau est repulpée, lissée et éclatante.',
  'Matériel stérilisé. Pinceaux et spatules à usage unique. Serviettes lavées à haute température.',
  'Grossesse, allaitement, interventions esthétiques récentes (attendre 3 mois), rosacée sévère, plaies ou lésions cutanées',
  'Éviter l''exposition solaire 48h après le soin. Hydrater la peau matin et soir. Boire 1,5L d''eau par jour.',
  false, true, true, 37,
  ARRAY['anti-âge', 'lifting', 'rides', 'fermeté', 'éclat']
),
(
  '10 ans de moins : visage + cou + décolleté',
  '10-ans-de-moins-visage-cou-decollete',
  (SELECT id FROM service_categories WHERE slug = 'le-visage'),
  (SELECT id FROM service_categories WHERE slug = 'visage-10-ans-de-moins'),
  188.00, 90,
  'Soin anti-âge complet sur visage, cou et décolleté pour un rajeunissement global',
  'Extension du protocole anti-âge sur les zones souvent négligées. Harmonie parfaite entre visage, cou et décolleté.',
  'Protocole anti-âge étendu qui traite le visage, le cou et le décolleté en continuité. Ces zones vieillissent souvent de façon inégale et révèlent l''âge. Ce soin global assure un résultat harmonieux avec un effet liftant visible sur toute la zone. Techniques de massage spécifiques pour le cou (zone fragile) et le décolleté.',
  'Matériel stérilisé. Produits testés dermatologiquement. Linge propre pour chaque cliente.',
  'Grossesse, allaitement, chirurgie esthétique récente, problèmes thyroïdiens non stabilisés, rosacée sévère',
  'Port de crème solaire SPF50 obligatoire pendant 7 jours. Éviter les gommages 48h. Hydrater matin et soir.',
  false, true, true, 38,
  ARRAY['anti-âge', 'lifting', 'cou', 'décolleté', 'complet']
);

-- BELLE PEAU (1 service)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  hygienic_precautions, contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Belle Peau : L''éclat Incarné',
  'belle-peau-eclat-incarne',
  (SELECT id FROM service_categories WHERE slug = 'le-visage'),
  (SELECT id FROM service_categories WHERE slug = 'visage-belle-peau'),
  125.00, 75,
  'Soin éclat pour retrouver une peau lumineuse et unifiée',
  'Soin purifiant et illuminateur qui redonne de l''éclat aux teints ternes. Peau nette, fraîche et rayonnante.',
  'Ce soin en 5 étapes révèle l''éclat naturel de votre peau : 1) Double nettoyage pour éliminer impuretés et maquillage, 2) Gommage enzymatique doux, 3) Extraction des comédons si nécessaire, 4) Masque illuminateur à la vitamine C, 5) Modelage du visage pour activer la microcirculation. Le résultat : un teint unifié, des pores resserrés et une peau qui respire.',
  'Extraction réalisée avec gants stériles. Outils désinfectés. Masques et pinceaux à usage unique.',
  'Acné sévère ou inflammatoire, eczéma, psoriasis, coups de soleil, épilation visage dans les 48h',
  'Ne pas toucher son visage pendant 6h. Éviter le maquillage 12h. Pas de sauna/hammam 48h.',
  true, true, true, 39,
  ARRAY['éclat', 'purifiant', 'teint-terne', 'illuminateur', 'nettoyage']
);

-- DU GALBE ! (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  hygienic_precautions, contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Du Galbe : focus tempes et pommettes',
  'du-galbe-focus-tempes-pommettes',
  (SELECT id FROM service_categories WHERE slug = 'le-visage'),
  (SELECT id FROM service_categories WHERE slug = 'visage-du-galbe'),
  98.00, 60,
  'Soin ciblé pour redonner du volume aux tempes et pommettes creusées',
  'Technique de massage spécifique pour stimuler les zones qui perdent du volume avec l''âge. Effet repulpant naturel.',
  'Le creusement des tempes et la perte de volume des pommettes sont des signes visibles du vieillissement. Ce soin utilise des techniques de massage profond, d''acupression et de gymnastique faciale pour stimuler la production de collagène et d''élastine. Des cosmétiques repulpants à l''acide hyaluronique complètent le protocole. Résultat : visage plus plein, traits adoucis.',
  'Matériel stérilisé. Protocole d''hygiène strict. Mains lavées et désinfectées.',
  'Injections récentes (attendre 4 semaines), migraines chroniques sévères, sinusite aiguë',
  'Masser les zones travaillées quotidiennement. Hydrater matin et soir avec une crème riche.',
  false, true, true, 40,
  ARRAY['galbe', 'volume', 'tempes', 'pommettes', 'repulpant']
),
(
  'Du Galbe : l''ovale redéfini',
  'du-galbe-ovale-redefini',
  (SELECT id FROM service_categories WHERE slug = 'le-visage'),
  (SELECT id FROM service_categories WHERE slug = 'visage-du-galbe'),
  148.00, 75,
  'Soin complet pour redessiner l''ovale du visage et combattre le relâchement',
  'Protocole anti-relâchement qui redéfinit les contours du visage. Effet liftant visible sur l''ovale et le bas du visage.',
  'Ce soin cible le relâchement cutané qui affecte l''ovale du visage (bajoues, double menton). Combinaison de massage tenseur, drainage lymphatique facial, gymnastique faciale et application de cosmétiques raffermissants. La technique travaille en profondeur sur les muscles du visage et le tissu conjonctif. L''ovale est redessiné, les contours sont nets, le visage paraît plus jeune.',
  'Protocole strict d''hygiène. Matériel désinfecté. Serviettes à usage unique.',
  'Interventions esthétiques récentes (fils tenseurs, injections), problèmes dentaires aigus, TMJ sévère',
  'Dormir sur le dos la première nuit. Éviter le sport intensif 24h. Massage quotidien recommandé.',
  false, true, true, 41,
  ARRAY['galbe', 'ovale', 'lifting', 'fermeté', 'relâchement']
);

-- =============================================================================
-- 4. 👁️ LE REGARD - 6 services
-- =============================================================================

-- CILS DE BICHE (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  hygienic_precautions, contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Réhaussement de cils',
  'rehaussement-cils',
  (SELECT id FROM service_categories WHERE slug = 'le-regard'),
  (SELECT id FROM service_categories WHERE slug = 'regard-cils-de-biche'),
  68.00, 60,
  'Technique de recourbement permanent des cils pour un regard ouvert',
  'Rehaussement des cils à la racine pour un effet mascara naturel. Tenue 6 à 8 semaines.',
  'Le réhaussement de cils (lash lift) est une alternative naturelle aux extensions. Vos cils naturels sont recourbés à la racine grâce à une technique de permanente douce. Le résultat est un regard ouvert, des cils qui paraissent plus longs et plus fournis, sans besoin de mascara. Parfait pour les cils droits ou tombants. Durée : 6 à 8 semaines selon la repousse.',
  'Produits hypoallergéniques. Patches et brosses à usage unique. Yeux fermés pendant toute la durée.',
  'Conjonctivite ou infection oculaire, chirurgie oculaire récente (attendre 3 mois), extensions de cils (les retirer avant)',
  'Ne pas mouiller les cils pendant 24h. Pas de maquillage waterproof. Brosser quotidiennement avec une brosse propre.',
  false, true, true, 42,
  ARRAY['cils', 'réhaussement', 'lash-lift', 'regard']
),
(
  'Teinture cils',
  'teinture-cils',
  (SELECT id FROM service_categories WHERE slug = 'le-regard'),
  (SELECT id FROM service_categories WHERE slug = 'regard-cils-de-biche'),
  30.00, 30,
  'Coloration des cils pour un regard intensifié sans mascara',
  'Teinture végétale des cils pour un résultat naturel. Tenue 4 à 6 semaines.',
  'La teinture de cils apporte de l''intensité au regard sans maquillage. Idéale pour les cils clairs ou pour un look naturel au quotidien. Coloration végétale douce et sécurisée. Le résultat est naturel et tient 4 à 6 semaines. Parfait avant les vacances pour se réveiller avec un regard intense.',
  'Colorants végétaux testés dermatologiquement. Patches de protection. Test d''allergie 48h avant si première fois.',
  'Allergie connue aux colorants, conjonctivite, lentilles de contact (à retirer avant)',
  'Ne pas se frotter les yeux pendant 12h. Pas de démaquillant huileux. Éviter l''eau de mer/chlore 48h.',
  false, true, true, 43,
  ARRAY['cils', 'teinture', 'coloration', 'regard']
);

-- LES COMBOS (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Le Combo : Rehaussement + Teinture cils',
  'combo-rehaussement-teinture-cils',
  (SELECT id FROM service_categories WHERE slug = 'le-regard'),
  (SELECT id FROM service_categories WHERE slug = 'regard-les-combos'),
  88.00, 75,
  'Formule complète : réhaussement + teinture pour des cils parfaits',
  'Combinaison idéale pour un résultat optimal. Cils recourbés ET intensifiés. Regard de biche garanti pendant 6 à 8 semaines.',
  false, true, true, 44,
  ARRAY['cils', 'réhaussement', 'teinture', 'combo']
),
(
  'Le Combo Ultime',
  'combo-ultime',
  (SELECT id FROM service_categories WHERE slug = 'le-regard'),
  (SELECT id FROM service_categories WHERE slug = 'regard-les-combos'),
  98.00, 90,
  'Formule premium : réhaussement cils + teinture cils + teinture sourcils',
  'Le soin regard complet pour un résultat professionnel. Cils sublimés et sourcils structurés. Regard transformé pour 6 à 8 semaines.',
  false, true, true, 45,
  ARRAY['cils', 'sourcils', 'réhaussement', 'teinture', 'combo', 'premium']
);

-- SOURCILS PARFAITS (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  hygienic_precautions, contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Restructuration + teinture sourcils',
  'restructuration-teinture-sourcils',
  (SELECT id FROM service_categories WHERE slug = 'le-regard'),
  (SELECT id FROM service_categories WHERE slug = 'regard-sourcils-parfaits'),
  48.00, 45,
  'Restructuration complète des sourcils + teinture pour un résultat parfait',
  'Étude de la morphologie du visage, épilation sur-mesure et teinture. Sourcils redessinés et intensifiés.',
  'Service complet pour des sourcils impeccables : 1) Analyse de votre morphologie pour déterminer la forme idéale, 2) Restructuration par épilation (pince + fil selon les zones), 3) Teinture végétale pour intensifier et combler les zones clairsemées. Le résultat est harmonieux et met en valeur votre regard. Durée de la teinture : 4 à 6 semaines.',
  'Pinces désinfectées. Fil à usage unique. Colorants végétaux hypoallergéniques.',
  'Eczéma ou psoriasis sur les sourcils, allergie connue aux colorants, épilation au laser récente (attendre 2 semaines)',
  'Ne pas mouiller les sourcils 12h. Éviter les gommages sur la zone 48h. Brosser quotidiennement.',
  true, true, true, 46,
  ARRAY['sourcils', 'restructuration', 'teinture', 'épilation', 'regard']
),
(
  'Teinture sourcils',
  'teinture-sourcils',
  (SELECT id FROM service_categories WHERE slug = 'le-regard'),
  (SELECT id FROM service_categories WHERE slug = 'regard-sourcils-parfaits'),
  28.00, 30,
  'Teinture végétale des sourcils pour un regard structuré',
  'Coloration douce pour intensifier les sourcils clairs ou clairsemés. Résultat naturel qui dure 4 à 6 semaines.',
  'La teinture de sourcils redonne de la densité et de l''intensité à votre regard. Idéale pour les sourcils clairs, décolorés par le soleil ou clairsemés. Colorant végétal appliqué avec précision. Le résultat est naturel et suit votre ligne de sourcils. Tenue 4 à 6 semaines.',
  'Colorants végétaux testés. Test d''allergie recommandé 48h avant si première fois.',
  'Allergie connue aux colorants, plaies ou irritations sur la zone',
  'Ne pas se frotter les sourcils 12h. Éviter démaquillants huileux. Protéger du soleil.',
  true, true, true, 47,
  ARRAY['sourcils', 'teinture', 'coloration', 'regard']
);

-- =============================================================================
-- 5. 💆 MASSAGE BIEN-ETRE - 15 services
-- =============================================================================

-- ADDICT (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description, long_description,
  hygienic_precautions, contraindications, advises,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Massage Californien',
  'massage-californien',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-addict'),
  142.00, 90,
  'Massage enveloppant aux huiles chaudes pour une relaxation profonde',
  'Le massage californien est le massage relaxant par excellence. Mouvements longs, fluides et enveloppants.',
  'Le massage californien (ou suédois californien) est une technique de massage très enveloppante qui favorise la détente musculaire et mentale. Réalisé avec des huiles chaudes aux parfums apaisants (lavande, ylang-ylang), ce massage utilise des mouvements longs, lents et fluides sur l''ensemble du corps. L''enchainement harmonieux procure une sensation de bien-être total. Idéal pour évacuer le stress, améliorer la qualité du sommeil et retrouver de l''énergie.',
  'Table de massage désinfectée. Huiles végétales bio. Serviettes lavées à 60°C. Lavage des mains avant/après.',
  'Grossesse (1er trimestre), phlébite, varices importantes, fractures récentes, fièvre, infections cutanées',
  'Buvez beaucoup d''eau dans les 24h suivantes. Évitez alcool et sport intensif le jour même. Repos recommandé.',
  true, true, true, 48,
  ARRAY['massage', 'relaxant', 'californien', 'huiles-chaudes', 'bien-être']
),
(
  'Massage Suédois',
  'massage-suedois',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-addict'),
  142.00, 90,
  'Massage dynamique pour dénouer les tensions musculaires profondes',
  'Le massage suédois combine douceur et fermeté. Idéal pour les sportifs et les tensions chroniques.',
  'Le massage suédois est une technique plus dynamique que le californien. Il utilise différents types de pressions (effleurage, pétrissage, friction, percussion) pour travailler en profondeur sur les tensions musculaires. Particulièrement efficace pour les sportifs, les personnes souffrant de douleurs dorsales ou de tensions chroniques. La circulation sanguine est stimulée, les toxines éliminées et les muscles détendus.',
  'Table de massage désinfectée. Huiles neutres hypoallergéniques. Linge propre.',
  'Grossesse, phlébite, fractures non consolidées, inflammations aiguës, hypertension non contrôlée',
  'Hydratation importante. Douche tiède recommandée 2h après. Courbatures possibles (signe d''efficacité).',
  true, true, true, 49,
  ARRAY['massage', 'suédois', 'sportif', 'tensions', 'profond']
);

-- A PARTAGER : LE AMMA ASSIS (4 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags,
  is_for_entreprise_ready
) VALUES
(
  'Amma assis DUO 20 min',
  'amma-assis-duo-20min',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-amma-assis'),
  60.00, 20,
  'Massage assis japonais pour deux personnes - Format express',
  'Massage habillé sur chaise ergonomique. Dénoue rapidement les tensions du haut du corps. Idéal en duo au bureau ou à la maison.',
  true, true, true, 50,
  ARRAY['massage', 'amma', 'assis', 'duo', 'entreprise', 'express'],
  true
),
(
  'Amma assis DUO 30 min',
  'amma-assis-duo-30min',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-amma-assis'),
  80.00, 30,
  'Massage assis japonais pour deux personnes - Format confort',
  'Massage habillé ciblant nuque, épaules, dos et bras. Session de 30min pour un moment de détente partagé.',
  true, true, true, 51,
  ARRAY['massage', 'amma', 'assis', 'duo', 'entreprise'],
  true
),
(
  'Amma assis DUO 45 min',
  'amma-assis-duo-45min',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-amma-assis'),
  110.00, 45,
  'Massage assis japonais pour deux personnes - Format bien-être',
  'Session complète pour un relâchement profond des tensions. Travail approfondi sur les zones de stress.',
  true, true, true, 52,
  ARRAY['massage', 'amma', 'assis', 'duo', 'entreprise', 'bien-être'],
  true
),
(
  'Amma assis DUO 60 min',
  'amma-assis-duo-60min',
  (SELECT id FROM service_categories WHERE slug = 'massage-bien-etre'),
  (SELECT id FROM service_categories WHERE slug = 'massage-amma-assis'),
  140.00, 60,
  'Massage assis japonais pour deux personnes - Format premium',
  'Session longue pour un relâchement complet. Travail méticuleux sur toutes les tensions du haut du corps.',
  true, true, true, 53,
  ARRAY['massage', 'amma', 'assis', 'duo', 'entreprise', 'premium'],
  true
);

-- TO BE CONTINUED in part 3...
-- Remaining: AU NIRVANA (4), LES CLASSIQUES (3), LES THEMATIQUES (2),
-- MINCEUR & DRAINAGE (13), EPILATION (10), MAQUILLAGE (3)
