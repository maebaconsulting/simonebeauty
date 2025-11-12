-- Seed data for services table
-- This script adds demo services for testing the booking flow

INSERT INTO services (
  name,
  slug,
  description,
  short_description,
  category,
  service_type,
  base_price,
  duration_minutes,
  buffer_time_minutes,
  main_image_url,
  is_active,
  is_featured,
  display_order,
  is_enterprise_ready,
  requires_ready_to_go
) VALUES
  -- Massage Services
  (
    'Massage Suédois',
    'massage-suedois',
    'Massage relaxant aux huiles essentielles pour détendre l''ensemble du corps. Techniques de pétrissage et d''effleurage pour soulager les tensions musculaires.',
    'Massage relaxant complet du corps',
    'massage',
    'at_home',
    75.00,
    60,
    15,
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    true,
    true,
    1,
    true,
    false
  ),
  (
    'Massage Sportif',
    'massage-sportif',
    'Massage ciblé pour les sportifs. Aide à la récupération musculaire et prévention des blessures. Techniques de massage profond.',
    'Massage de récupération pour sportifs',
    'massage',
    'at_home',
    85.00,
    60,
    15,
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
    true,
    true,
    2,
    true,
    false
  ),
  (
    'Massage Californien',
    'massage-californien',
    'Massage doux et enveloppant pour une relaxation profonde. Mouvements lents et fluides sur tout le corps.',
    'Massage doux et relaxant',
    'massage',
    'at_home',
    80.00,
    75,
    15,
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800',
    true,
    false,
    3,
    true,
    false
  ),

  -- Beauty Services
  (
    'Soin du Visage Complet',
    'soin-visage-complet',
    'Soin complet du visage adapté à votre type de peau : nettoyage, gommage, masque, massage et hydratation. Produits professionnels de qualité.',
    'Soin visage personnalisé',
    'beauty',
    'at_home',
    65.00,
    60,
    10,
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
    true,
    true,
    4,
    true,
    false
  ),
  (
    'Manucure',
    'manucure',
    'Soin complet des mains et des ongles : limage, cuticules, polissage et pose de vernis. Options gel disponibles.',
    'Manucure professionnelle',
    'beauty',
    'at_home',
    35.00,
    45,
    10,
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
    true,
    false,
    5,
    true,
    false
  ),
  (
    'Pédicure',
    'pedicure',
    'Soin complet des pieds : bain, gommage, limage des ongles, soin des cuticules et pose de vernis.',
    'Pédicure professionnelle',
    'beauty',
    'at_home',
    40.00,
    60,
    10,
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800',
    true,
    false,
    6,
    true,
    false
  ),

  -- Hair Services
  (
    'Coupe Femme',
    'coupe-femme',
    'Coupe de cheveux personnalisée selon vos envies. Conseils personnalisés inclus. Brushing compris.',
    'Coupe et brushing',
    'hair',
    'at_home',
    45.00,
    60,
    15,
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
    true,
    true,
    7,
    true,
    false
  ),
  (
    'Coloration',
    'coloration',
    'Coloration professionnelle avec produits de qualité. Diagnostic capillaire et conseils personnalisés inclus.',
    'Coloration professionnelle',
    'hair',
    'at_home',
    85.00,
    120,
    20,
    'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=800',
    true,
    false,
    8,
    true,
    false
  ),

  -- Health Services
  (
    'Réflexologie Plantaire',
    'reflexologie-plantaire',
    'Massage des zones réflexes des pieds pour rééquilibrer l''énergie du corps. Aide à la détente et au bien-être.',
    'Massage thérapeutique des pieds',
    'health',
    'at_home',
    60.00,
    60,
    10,
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800',
    true,
    false,
    9,
    true,
    false
  ),

  -- Wellness Services
  (
    'Yoga Privé',
    'yoga-prive',
    'Séance de yoga personnalisée à domicile. Tous niveaux acceptés. Équipement fourni.',
    'Cours de yoga à domicile',
    'wellness',
    'at_home',
    55.00,
    60,
    10,
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    true,
    true,
    10,
    true,
    false
  );

-- Display summary
SELECT
  category,
  COUNT(*) as count,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price
FROM services
WHERE is_active = true
GROUP BY category
ORDER BY category;
