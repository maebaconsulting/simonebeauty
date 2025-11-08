-- Migration: 20250107120000_seed_services.sql
-- Feature: Service Data Population
-- Description: Seed all 88 services from liste_services.md with rich content
-- Date: 2025-11-07
-- Total Services: 88 across 8 main categories

-- =============================================================================
-- HELPER FUNCTION: Get category ID by slug
-- =============================================================================

-- This function will be used throughout the migration
CREATE OR REPLACE FUNCTION get_category_id(category_slug TEXT)
RETURNS BIGINT AS $$
  SELECT id FROM service_categories WHERE slug = category_slug LIMIT 1;
$$ LANGUAGE SQL;

-- =============================================================================
-- 1. 💇 COIFFURE - 20 services
-- =============================================================================

-- BALAYAGE (1 service)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES (
  'Balayage',
  'balayage',
  get_category_id('coiffure'),
  get_category_id('coiffure-balayage'),
  135.00, 135,
  'Technique de coloration naturelle pour un effet soleil dans les cheveux',
  'Le balayage est une technique de coloration qui apporte des reflets naturels et lumineux. Application main levée pour un résultat sur-mesure et personnalisé.',
  false, true, true, 1,
  ARRAY['coloration', 'éclaircissement', 'naturel', 'reflets']
);

-- COIFFAGES (4 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Brushing Glamour',
  'brushing-glamour',
  get_category_id('coiffure'),
  get_category_id('coiffure-coiffages'),
  50.00, 45,
  'Brushing professionnel pour un résultat impeccable et durable',
  'Brushing réalisé avec soin pour sublimer votre coupe. Utilisation de produits professionnels pour un résultat longue tenue et une brillance exceptionnelle.',
  false, true, true, 2,
  ARRAY['brushing', 'coiffage', 'volume', 'brillance']
),
(
  'Up Do : Tresse et Attache',
  'up-do-tresse-attache',
  get_category_id('coiffure'),
  get_category_id('coiffure-coiffages'),
  88.00, 45,
  'Coiffure élégante avec tresses et attaches pour toutes occasions',
  'Création de coiffures sophistiquées avec tresses et attaches. Parfait pour événements, mariages ou sorties. Tenue longue durée garantie.',
  false, true, true, 3,
  ARRAY['coiffage', 'tresse', 'événement', 'mariage']
),
(
  'Le Chignon Parfait',
  'chignon-parfait',
  get_category_id('coiffure'),
  get_category_id('coiffure-coiffages'),
  118.00, 60,
  'Chignon élégant et sophistiqué réalisé sur-mesure',
  'Chignon travaillé et structuré pour un look raffiné. Technique professionnelle adaptée à votre morphologie et à l''occasion. Idéal pour mariages et événements.',
  false, true, true, 4,
  ARRAY['chignon', 'élégance', 'mariage', 'événement']
),
(
  'Grand Jour ! Coiffage sur-mesure',
  'grand-jour-coiffage-sur-mesure',
  get_category_id('coiffure'),
  get_category_id('coiffure-coiffages'),
  180.00, 105,
  'Coiffage d''exception entièrement personnalisé pour votre grand jour',
  'Prestation premium avec consultation préalable. Création d''une coiffure unique adaptée à votre style, votre tenue et l''événement. Essai inclus si besoin.',
  false, true, true, 5,
  ARRAY['mariage', 'sur-mesure', 'événement', 'premium']
);

-- LA COUPE (6 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, for_kids, is_active, display_order, tags
) VALUES
(
  'Coupe homme',
  'coupe-homme',
  get_category_id('coiffure'),
  get_category_id('coiffure-la-coupe'),
  58.00, 45,
  'Coupe masculine moderne et soignée',
  'Coupe adaptée à votre style et morphologie. Conseil personnalisé sur la coupe idéale. Shampoing et finition inclus.',
  true, false, false, true, 6,
  ARRAY['coupe', 'homme', 'moderne']
),
(
  'Duo : papa + enfant*',
  'duo-papa-enfant',
  get_category_id('coiffure'),
  get_category_id('coiffure-la-coupe'),
  70.00, 60,
  'Forfait duo père-enfant pour un moment de complicité',
  'Deux coupes réalisées l''une après l''autre. Moment convivial à partager. *Enfant jusqu''à 12 ans.',
  true, false, true, true, 7,
  ARRAY['coupe', 'duo', 'enfant', 'famille']
),
(
  '2 enfants -12 ans',
  'deux-enfants-12-ans',
  get_category_id('coiffure'),
  get_category_id('coiffure-la-coupe'),
  78.00, 60,
  'Forfait pour deux enfants de moins de 12 ans',
  'Deux coupes enfants réalisées avec patience et attention. Ambiance détendue et bienveillante.',
  false, false, true, true, 8,
  ARRAY['coupe', 'enfant', 'duo', 'famille']
),
(
  'Coupe femme + Brush',
  'coupe-femme-brush',
  get_category_id('coiffure'),
  get_category_id('coiffure-la-coupe'),
  86.00, 60,
  'Coupe personnalisée femme avec brushing professionnel',
  'Coupe adaptée à votre visage et votre style de vie. Conseil sur l''entretien au quotidien. Shampoing, coupe et brushing inclus.',
  false, true, false, true, 9,
  ARRAY['coupe', 'femme', 'brushing']
),
(
  'Duo : maman + enfant*',
  'duo-maman-enfant',
  get_category_id('coiffure'),
  get_category_id('coiffure-la-coupe'),
  98.00, 60,
  'Forfait duo mère-enfant pour un moment privilégié',
  'Coupe femme + coupe enfant. Moment de complicité à partager en salon. *Enfant jusqu''à 12 ans.',
  false, true, true, true, 10,
  ARRAY['coupe', 'duo', 'enfant', 'famille']
),
(
  'Madame + Monsieur',
  'madame-monsieur',
  get_category_id('coiffure'),
  get_category_id('coiffure-la-coupe'),
  134.00, 90,
  'Forfait couple pour prendre soin de vous à deux',
  'Coupe femme avec brushing + coupe homme. Prestations réalisées en simultané ou successivement selon vos préférences.',
  true, true, false, true, 11,
  ARRAY['coupe', 'couple', 'duo']
);

-- LISSAGE ET SOINS (2 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Soin Botox',
  'soin-botox-cheveux',
  get_category_id('coiffure'),
  get_category_id('coiffure-lissage-soins'),
  98.00, 90,
  'Soin reconstructeur intense pour cheveux abîmés',
  'Traitement profond qui répare la fibre capillaire en profondeur. Effet lissant et brillance immédiate. Résultat durable sur cheveux fragilisés. Prix à partir de 98€ selon longueur.',
  false, true, true, 12,
  ARRAY['soin', 'réparation', 'brillance', 'lissage']
),
(
  'Lissage brésilien',
  'lissage-bresilien',
  get_category_id('coiffure'),
  get_category_id('coiffure-lissage-soins'),
  220.00, 120,
  'Lissage longue durée pour des cheveux disciplinés pendant 3 à 5 mois',
  'Traitement à la kératine qui lisse durablement les cheveux. Réduit le volume et élimine les frisottis. Résultat naturel et brillant. Durée 3 à 5 mois. Prix à partir de 220€ selon longueur.',
  false, true, true, 13,
  ARRAY['lissage', 'kératine', 'anti-frisottis', 'longue-durée']
);

-- TECHNIQUES (7 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Entretien : juste une Patine',
  'patine-entretien',
  get_category_id('coiffure'),
  get_category_id('coiffure-techniques'),
  98.00, 60,
  'Patine pour raviver et ajuster votre couleur',
  'Traitement de surface qui ravive l''éclat de votre couleur. Neutralise les reflets indésirables. Idéal entre deux colorations complètes.',
  false, true, true, 14,
  ARRAY['patine', 'coloration', 'entretien', 'reflets']
),
(
  'Couleur',
  'couleur',
  get_category_id('coiffure'),
  get_category_id('coiffure-techniques'),
  105.00, 90,
  'Coloration complète pour un changement de look ou pour couvrir les cheveux blancs',
  'Coloration professionnelle avec produits de qualité. Diagnostic personnalisé de votre couleur idéale. Application soignée et uniforme.',
  false, true, true, 15,
  ARRAY['coloration', 'couleur', 'cheveux-blancs']
),
(
  'Balayage + Coupe',
  'balayage-coupe',
  get_category_id('coiffure'),
  get_category_id('coiffure-techniques'),
  190.00, 165,
  'Formule complète : balayage naturel + coupe personnalisée',
  'Prestation combinée pour un résultat harmonieux. Balayage main levée suivi d''une coupe adaptée pour mettre en valeur vos reflets.',
  false, true, true, 16,
  ARRAY['balayage', 'coupe', 'complet']
),
(
  'Patine + coupe',
  'patine-coupe',
  get_category_id('coiffure'),
  get_category_id('coiffure-techniques'),
  148.00, 75,
  'Patine pour raviver la couleur + coupe pour restructurer',
  'Formule complète pour un résultat optimal. Patine pour les reflets, coupe pour la forme.',
  false, true, true, 17,
  ARRAY['patine', 'coupe', 'entretien']
),
(
  'Couleur + Coupe',
  'couleur-coupe',
  get_category_id('coiffure'),
  get_category_id('coiffure-techniques'),
  160.00, 120,
  'Coloration complète + coupe pour un relooking total',
  'Prestation complète alliant couleur et coupe. Conseil sur la couleur et la coupe idéales pour votre style.',
  false, true, true, 18,
  ARRAY['couleur', 'coupe', 'complet']
),
(
  'Couleur + Balayage',
  'couleur-balayage',
  get_category_id('coiffure'),
  get_category_id('coiffure-techniques'),
  175.00, 150,
  'Technique mixte pour une couleur de base + des reflets naturels',
  'Association couleur et balayage pour un résultat multidimensionnel. Profondeur et luminosité réunies.',
  false, true, true, 19,
  ARRAY['couleur', 'balayage', 'technique-mixte']
),
(
  'Couleur + Balayage + coupe',
  'couleur-balayage-coupe',
  get_category_id('coiffure'),
  get_category_id('coiffure-techniques'),
  230.00, 180,
  'Prestation premium : couleur, balayage et coupe pour une transformation complète',
  'Formule complète pour un changement radical. Coloration de base, balayage pour les reflets, coupe pour la structure. Résultat professionnel garanti.',
  false, true, true, 20,
  ARRAY['couleur', 'balayage', 'coupe', 'premium', 'complet']
);

-- =============================================================================
-- 2. 💅 BEAUTE DES ONGLES - 16 services
-- =============================================================================

-- DELUXE RITUEL KURE BAZAAR (3 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Mani + masque soin + vernis',
  'mani-masque-vernis',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-deluxe-rituel'),
  48.00, 45,
  'Rituel manucure avec masque nourrissant et vernis Kure Bazaar',
  'Soin complet des mains avec gommage, masque hydratant et vernis végétal Kure Bazaar. Résultat naturel et respectueux de vos ongles.',
  false, true, true, 21,
  ARRAY['manucure', 'soin', 'vernis', 'naturel']
),
(
  'Pedi + masque soin + vernis',
  'pedi-masque-vernis',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-deluxe-rituel'),
  58.00, 60,
  'Rituel pédicure avec masque nourrissant et vernis Kure Bazaar',
  'Soin complet des pieds avec gommage, masque hydratant et vernis végétal. Pieds doux et ongles parfaits.',
  false, true, true, 22,
  ARRAY['pédicure', 'soin', 'vernis', 'pieds']
),
(
  'Mani/Pedi + masque soin + vernis',
  'mani-pedi-masque-vernis',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-deluxe-rituel'),
  96.00, 90,
  'Rituel complet mains et pieds avec masques et vernis Kure Bazaar',
  'Formule complète pour des mains et pieds parfaits. Double soin avec masques nourrissants et vernis végétal longue tenue.',
  false, true, true, 23,
  ARRAY['manucure', 'pédicure', 'complet', 'soin']
);

-- FORFAIT MAINS / PIEDS (5 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Soin express + vernis',
  'forfait-soin-express-vernis',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-forfait-mains-pieds'),
  70.00, 60,
  'Forfait mains et pieds avec soin rapide et vernis',
  'Soin complet express mains et pieds. Mise en beauté des ongles avec lime, polissage et vernis classique.',
  false, true, true, 24,
  ARRAY['manucure', 'pédicure', 'express', 'vernis']
),
(
  'Soin + mix vernis / semi-permanent',
  'forfait-soin-mix-vernis-semi',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-forfait-mains-pieds'),
  90.00, 90,
  'Forfait mains et pieds avec choix entre vernis classique et semi-permanent',
  'Soin signature complet. Choisissez vernis classique ou semi-permanent selon vos préférences pour mains et/ou pieds.',
  false, true, true, 25,
  ARRAY['manucure', 'pédicure', 'semi-permanent', 'vernis']
),
(
  '''Detox'' soin Japonais sans vernis',
  'forfait-detox-japonais-sans-vernis',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-forfait-mains-pieds'),
  95.00, 90,
  'Soin détox inspiré des rituels japonais pour des ongles naturellement beaux',
  'Soin profond pour régénérer les ongles abîmés. Technique japonaise de polissage pour une brillance naturelle sans vernis. Idéal pour renforcer les ongles.',
  false, true, true, 26,
  ARRAY['soin', 'japonais', 'détox', 'naturel', 'renforcement']
),
(
  'Soin + semi-permanent',
  'forfait-soin-semi-permanent',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-forfait-mains-pieds'),
  96.00, 90,
  'Forfait complet mains et pieds avec semi-permanent longue tenue',
  'Soin signature complet avec pose de vernis semi-permanent sur mains et pieds. Tenue 2-3 semaines garantie.',
  false, true, true, 27,
  ARRAY['manucure', 'pédicure', 'semi-permanent', 'longue-tenue']
),
(
  'Soin + Gel Builder BIAB',
  'forfait-soin-gel-biab',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-forfait-mains-pieds'),
  108.00, 90,
  'Forfait premium avec gel builder BIAB pour renforcer et embellir',
  'Soin complet avec application de gel Builder in a Bottle (BIAB). Renforce les ongles fragiles tout en les embellissant. Tenue 3-4 semaines.',
  false, true, true, 28,
  ARRAY['manucure', 'pédicure', 'gel', 'BIAB', 'renforcement']
);

-- LES MAINS (5 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Pose de vernis ou semi-permanent',
  'mains-pose-vernis-semi',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-mains'),
  25.00, 20,
  'Pose simple de vernis classique ou semi-permanent sur mains',
  'Service rapide pour des ongles impeccables. Choix entre vernis classique (séchage rapide) ou semi-permanent (tenue 2-3 semaines).',
  false, true, true, 29,
  ARRAY['manucure', 'vernis', 'semi-permanent', 'express']
),
(
  'Beauty Flash',
  'mains-beauty-flash',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-mains'),
  35.00, 30,
  'Mise en beauté express des mains avec soin éclair',
  'Service express pour des mains soignées rapidement. Lime, soin cuticules, polissage et vernis au choix.',
  false, true, true, 30,
  ARRAY['manucure', 'express', 'flash']
),
(
  'Soin express + vernis',
  'mains-soin-express-vernis',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-mains'),
  38.00, 30,
  'Soin rapide des mains avec vernis classique',
  'Manucure express complète : soin cuticules, lime, massage hydratant et vernis. Résultat soigné en 30 minutes.',
  false, true, true, 31,
  ARRAY['manucure', 'soin', 'vernis', 'express']
),
(
  'Soin signature + vernis/semi-permanent',
  'mains-soin-signature',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-mains'),
  48.00, 45,
  'Soin signature des mains avec finition vernis ou semi-permanent',
  'Manucure complète avec gommage, massage prolongé, soin cuticules et vernis au choix (classique ou semi-permanent).',
  false, true, true, 32,
  ARRAY['manucure', 'soin', 'signature', 'semi-permanent']
),
(
  'Soin + Gel Builder BIAB',
  'mains-soin-gel-biab',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-mains'),
  58.00, 60,
  'Soin des mains avec gel builder BIAB pour renforcer les ongles',
  'Manucure complète avec application de gel Builder in a Bottle. Renforce les ongles cassants et fragiles. Finition naturelle ou couleur. Tenue 3-4 semaines.',
  false, true, true, 33,
  ARRAY['manucure', 'gel', 'BIAB', 'renforcement']
);

-- LES PIEDS (3 services)
INSERT INTO services (
  name, slug, category_id, subcategory_id,
  base_price, base_duration_minutes,
  intro, description,
  for_men, for_women, is_active, display_order, tags
) VALUES
(
  'Pose de vernis ou semi-permanent',
  'pieds-pose-vernis-semi',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-pieds'),
  32.00, 30,
  'Pose simple de vernis classique ou semi-permanent sur pieds',
  'Service rapide pour des ongles de pieds impeccables. Choix entre vernis classique ou semi-permanent longue tenue.',
  false, true, true, 34,
  ARRAY['pédicure', 'vernis', 'semi-permanent']
),
(
  'Beauty Flash',
  'pieds-beauty-flash',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-pieds'),
  42.00, 45,
  'Mise en beauté express des pieds avec soin éclair',
  'Pédicure express : lime, soin cuticules, polissage et vernis. Pieds nets et soignés rapidement.',
  false, true, true, 35,
  ARRAY['pédicure', 'express', 'flash']
),
(
  'Soin signature + vernis/semi-permanent',
  'pieds-soin-signature',
  get_category_id('beaute-des-ongles'),
  get_category_id('ongles-les-pieds'),
  58.00, 60,
  'Soin signature des pieds avec finition vernis ou semi-permanent',
  'Pédicure complète avec gommage, râpe si nécessaire, massage prolongé et vernis au choix. Pieds doux et ongles parfaits.',
  false, true, true, 36,
  ARRAY['pédicure', 'soin', 'signature', 'semi-permanent']
);

-- TO BE CONTINUED in next part...
-- Remaining: LE VISAGE (5), LE REGARD (6), MASSAGE BIEN-ETRE (15),
-- MINCEUR & DRAINAGE (13), EPILATION (10), MAQUILLAGE (3)
