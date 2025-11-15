-- Update service categories based on service names
-- This maps the existing services to the correct categories

-- COIFFURE → 'hair'
UPDATE services SET category = 'hair'
WHERE name ILIKE '%balayage%'
   OR name ILIKE '%brushing%'
   OR name ILIKE '%coupe%'
   OR name ILIKE '%coiffage%'
   OR name ILIKE '%couleur%'
   OR name ILIKE '%chignon%'
   OR name ILIKE '%tresse%'
   OR name ILIKE '%coloration%'
   OR name ILIKE '%lissage%'
   OR name ILIKE '%soin botox%'
   OR name ILIKE '%patine%';

-- MASSAGE BIEN-ETRE → 'massage'
UPDATE services SET category = 'massage'
WHERE name ILIKE '%massage%'
   OR name ILIKE '%amma%'
   OR name ILIKE '%ayurvédique%'
   OR name ILIKE '%balinais%'
   OR name ILIKE '%thaï%'
   OR name ILIKE '%japonais%'
   OR name ILIKE '%californien%'
   OR name ILIKE '%suédois%'
   OR name ILIKE '%relaxant%'
   OR name ILIKE '%sportif%'
   OR name ILIKE '%dos%'
   OR name ILIKE '%femme enceinte%'
   OR name ILIKE '%crânien%';

-- MINCEUR & DRAINAGE → 'wellness'
UPDATE services SET category = 'wellness'
WHERE name ILIKE '%drainage%'
   OR name ILIKE '%fermeté%'
   OR name ILIKE '%renata%'
   OR name ILIKE '%lymphatique%'
   OR name ILIKE '%palper%'
   OR name ILIKE '%madero%'
   OR name ILIKE '%cellu%'
   OR name ILIKE '%cure%'
   OR name ILIKE '%sur mesure%'
   OR name ILIKE '%minceur%';

-- BEAUTE (ongles, visage, regard, épilation, maquillage) → 'beauty'
UPDATE services SET category = 'beauty'
WHERE name ILIKE '%mani%'
   OR name ILIKE '%pedi%'
   OR name ILIKE '%vernis%'
   OR name ILIKE '%semi-permanent%'
   OR name ILIKE '%gel%'
   OR name ILIKE '%biab%'
   OR name ILIKE '%visage%'
   OR name ILIKE '%ovale%'
   OR name ILIKE '%galbe%'
   OR name ILIKE '%peau%'
   OR name ILIKE '%révélateur%'
   OR name ILIKE '%décolleté%'
   OR name ILIKE '%cils%'
   OR name ILIKE '%sourcils%'
   OR name ILIKE '%épilation%'
   OR name ILIKE '%jambes%'
   OR name ILIKE '%aisselles%'
   OR name ILIKE '%maillot%'
   OR name ILIKE '%lèvre%'
   OR name ILIKE '%menton%'
   OR name ILIKE '%maquillage%'
   OR name ILIKE '%detox%'
   OR name ILIKE '%flash%'
   OR name ILIKE '%teinture%'
   OR name ILIKE '%rehaussement%'
   OR name ILIKE '%combo%';

-- Set any remaining NULL categories to 'other'
UPDATE services SET category = 'other'
WHERE category IS NULL;

-- Display the results
SELECT
  category,
  COUNT(*) as count
FROM services
WHERE is_active = true
GROUP BY category
ORDER BY category;
