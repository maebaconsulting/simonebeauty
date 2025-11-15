-- Verify service_categories table
SELECT 
  COUNT(*) as total_categories,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM service_categories;

-- Show main categories
SELECT id, name, slug, icon, display_order
FROM service_categories
WHERE parent_id IS NULL
ORDER BY display_order;

-- Count subcategories per main category
SELECT 
  cat.name as category,
  COUNT(subcat.id) as subcategory_count
FROM service_categories cat
LEFT JOIN service_categories subcat ON subcat.parent_id = cat.id
WHERE cat.parent_id IS NULL
GROUP BY cat.id, cat.name, cat.display_order
ORDER BY cat.display_order;
