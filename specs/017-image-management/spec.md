# Feature Specification: Image Management System

**Feature Branch**: `017-image-management`
**Created**: 2025-01-11
**Status**: Draft
**Input**: User description: "Système de gestion d'images pour services, produits e-commerce (~500 produits avec variations), et photos utilisateurs dans conversations. Permissions admin/manager. Max 10 images par entité. Formats JPEG/PNG/WebP. Taille configurable (recommandé 5MB). Alt-text obligatoire avec génération automatique. Modération UGC."

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Admin gère les images des services (Priority: P1)

Un administrateur ou manager doit pouvoir uploader, organiser et modifier les images associées aux services de la plateforme (coiffure, ongles, massage, etc.) pour maintenir une présentation visuelle professionnelle et cohérente.

**Why this priority**: Les images de services apparaissent sur la page d'accueil et impactent directement l'expérience utilisateur et les conversions. C'est la fondation du système d'images.

**Independent Test**: Peut être testé indépendamment en créant/modifiant un service, en uploadant 1-10 images, en vérifiant leur affichage sur la page d'accueil, et en validant que seuls admin/manager peuvent effectuer ces actions.

**Acceptance Scenarios**:

1. **Given** je suis connecté en tant qu'admin, **When** j'accède à la page d'édition d'un service, **Then** je vois une galerie des images existantes et un bouton "Ajouter des images"
2. **Given** je clique sur "Ajouter des images", **When** je sélectionne 3 fichiers JPEG valides (< 5MB chacun), **Then** les images sont uploadées avec succès et apparaissent dans la galerie
3. **Given** j'essaie d'uploader un fichier de 8MB, **When** je confirme l'upload, **Then** je reçois un message d'erreur "Fichier trop volumineux (max 5MB)"
4. **Given** j'essaie d'uploader un fichier .pdf, **When** je confirme l'upload, **Then** je reçois un message d'erreur "Format non supporté (JPEG, PNG, WebP uniquement)"
5. **Given** j'ai uploadé 3 images, **When** je glisse-dépose l'image #3 en position #1, **Then** l'ordre est sauvegardé et respecté à l'affichage
6. **Given** je modifie l'alt-text d'une image, **When** je sauvegarde, **Then** l'alt-text est mis à jour et utilisé pour l'accessibilité
7. **Given** une image n'a pas d'alt-text, **When** je clique sur "Générer alt-text", **Then** un texte descriptif est généré automatiquement (ex: "Service de coiffure professionnel à domicile")
8. **Given** j'ai 10 images pour un service, **When** j'essaie d'en ajouter une 11ème, **Then** je reçois un message "Limite de 10 images atteinte"

---

### User Story 1 - Client voit les images optimisées (Priority: P1)

Un client naviguant sur la plateforme doit voir des images de haute qualité, optimisées pour la performance, avec des temps de chargement rapides et une expérience responsive (mobile/desktop).

**Why this priority**: L'expérience visuelle est critique pour la conversion et la satisfaction client. Sans optimisation, les performances seraient dégradées.

**Independent Test**: Peut être testé en naviguant sur différents écrans (mobile/desktop), en mesurant les temps de chargement (< 3s LCP), en vérifiant le lazy loading, et en testant les fallbacks pour images manquantes.

**Acceptance Scenarios**:

1. **Given** je navigue sur la page d'accueil, **When** les services s'affichent, **Then** je vois l'image principale de chaque service en moins de 2 secondes
2. **Given** je suis sur mobile, **When** je scroll une longue liste de produits, **Then** les images se chargent progressivement (lazy loading) sans ralentir l'interface
3. **Given** une image est temporairement indisponible, **When** la page se charge, **Then** je vois un placeholder élégant avec dégradé de couleur au lieu d'une image cassée
4. **Given** je clique sur un service, **When** la galerie d'images s'affiche, **Then** je peux naviguer entre les images avec des flèches ou swipe (mobile)
5. **Given** je suis sur un écran HD, **When** une image s'affiche, **Then** elle est nette et de qualité appropriée (pas de pixelisation)
6. **Given** je suis malvoyant et utilise un lecteur d'écran, **When** le lecteur lit une image, **Then** j'entends l'alt-text descriptif

---

### User Story 2 - Admin gère les images des produits e-commerce (Priority: P1)

Un administrateur doit pouvoir gérer les images des produits e-commerce (~500 produits) incluant leurs variations (couleur, taille, etc.), avec plusieurs images par produit et par variation.

**Why this priority**: Les produits e-commerce nécessitent des images détaillées et organisées par variation pour permettre aux clients de faire des choix informés. Critique pour la monétisation.

**Independent Test**: Peut être testé en créant un produit avec 3 variations, en uploadant des images spécifiques à chaque variation, en vérifiant que les bonnes images s'affichent selon la variation sélectionnée, et en testant la limite de 10 images.

**Acceptance Scenarios**:

1. **Given** je crée un nouveau produit "Vernis à ongles", **When** j'accède à la section Images, **Then** je peux uploader jusqu'à 10 images pour la fiche produit principale
2. **Given** j'ajoute une variation "Couleur: Rouge", **When** j'accède aux images de cette variation, **Then** je peux uploader des images spécifiques à la variante rouge
3. **Given** un produit a 3 variations (Rouge, Bleu, Vert), **When** un client sélectionne "Bleu" sur la fiche produit, **Then** seules les images associées à la variation Bleu s'affichent
4. **Given** je gère 500 produits, **When** je recherche un produit spécifique, **Then** je peux filtrer/chercher rapidement et accéder à sa galerie d'images
5. **Given** j'upload une image produit, **When** le système détecte le contenu, **Then** un alt-text est généré automatiquement (ex: "Vernis à ongles rouge brillant - Simone Paris")
6. **Given** je veux réutiliser une image existante, **When** je clique sur "Choisir depuis la bibliothèque", **Then** je vois toutes les images déjà uploadées et peux en sélectionner une

---

### User Story 3 - Client envoie des photos dans les conversations (Priority: P2)

Un client doit pouvoir envoyer des photos dans le système de messagerie lié à ses réservations (ex: photo de coiffure désirée, photo d'un problème à traiter).

**Why this priority**: Améliore la communication client-prestataire et la qualité du service, mais n'est pas bloquant pour le MVP initial.

**Independent Test**: Peut être testé en créant une réservation, en ouvrant la conversation associée, en uploadant 1-3 photos, en vérifiant qu'elles s'affichent dans la conversation, et en testant les validations de format/taille.

**Acceptance Scenarios**:

1. **Given** j'ai une réservation active, **When** j'ouvre la conversation avec mon prestataire, **Then** je vois un bouton "Ajouter une photo" ou icône clip
2. **Given** je clique sur "Ajouter une photo", **When** je sélectionne 2 photos de ma galerie (JPEG, 3MB chacune), **Then** les photos sont uploadées et s'affichent dans le thread de conversation
3. **Given** j'essaie d'envoyer une photo de 12MB, **When** je confirme, **Then** je reçois un message "Photo trop volumineuse (max 5MB configuré par l'admin)"
4. **Given** j'envoie une photo, **When** le prestataire reçoit la notification, **Then** il voit la photo en preview dans la conversation
5. **Given** j'envoie une photo inappropriée, **When** l'admin la modère, **Then** la photo est supprimée et je reçois une notification de modération
6. **Given** je veux envoyer 4 photos, **When** je les sélectionne toutes, **Then** elles sont uploadées en batch et s'affichent dans l'ordre

---

### User Story 4 - Admin modère les photos UGC (Priority: P2)

Un administrateur doit pouvoir modérer les photos envoyées par les utilisateurs dans les conversations pour détecter et supprimer le contenu inapproprié.

**Why this priority**: Important pour la qualité et la sécurité de la plateforme, mais peut être géré manuellement initialement avec modération réactive.

**Independent Test**: Peut être testé en accédant au dashboard de modération, en listant les photos UGC récentes, en marquant certaines comme inappropriées, en les supprimant, et en vérifiant que les utilisateurs sont notifiés.

**Acceptance Scenarios**:

1. **Given** je suis admin, **When** j'accède au dashboard de modération, **Then** je vois une liste de toutes les photos uploadées par les clients avec date, utilisateur, et conversation associée
2. **Given** je clique sur une photo suspecte, **When** je la visualise en plein écran, **Then** je peux la marquer comme "Appropriée", "Inappropriée", ou "En révision"
3. **Given** je marque une photo comme "Inappropriée", **When** je confirme avec une raison, **Then** la photo est supprimée et l'utilisateur reçoit une notification explicative
4. **Given** je filtre les photos "En attente de modération", **When** la liste s'affiche, **Then** je vois uniquement les photos non modérées par ordre chronologique
5. **Given** je configure un filtre automatique, **When** une photo est uploadée, **Then** le système détecte automatiquement certains contenus problématiques (ex: nudité) et la marque pour révision
6. **Given** un utilisateur conteste une modération, **When** je reçois la contestation, **Then** je peux ré-examiner la photo et inverser la décision si justifié

---

## Extension: Category & Subcategory Image Management

This extension adds image and icon management capabilities to service categories and subcategories, providing a consistent visual identity across the platform.

### User Story (US5)

**As** an admin or manager
**I want** to manage images and emoji icons for service categories and subcategories
**So that** the service catalog has a cohesive visual identity and clients can easily identify service types

**Business Value**: Improved brand consistency, better user navigation, and enhanced visual appeal of the service catalog.

**Acceptance Scenarios**:

1. **Given** je suis admin, **When** j'accède à la page de gestion des catégories, **Then** je vois toutes les catégories avec leur image actuelle et leur icône emoji
2. **Given** je clique sur "Modifier l'image" d'une catégorie, **When** j'uploade une nouvelle image (JPEG/PNG/WebP, max 2MB), **Then** l'image est uploadée dans le bucket `service-images` et associée à la catégorie
3. **Given** je clique sur l'icône emoji d'une catégorie, **When** je sélectionne un nouveau emoji dans le sélecteur visuel (8 catégories thématiques, 160 emojis), **Then** l'icône est mise à jour immédiatement
4. **Given** je veux supprimer l'image d'une catégorie, **When** je clique sur "Supprimer", **Then** l'image est retirée et un placeholder est affiché
5. **Given** j'édite une sous-catégorie, **When** j'uploade une image ou change l'emoji, **Then** les modifications sont appliquées de la même manière que pour les catégories principales
6. **Given** j'accède au dashboard centralisé `/admin/images`, **When** je consulte les statistiques, **Then** je vois le nombre d'images de catégories uploadées et l'espace de stockage utilisé

### Additional Functional Requirements

- **FR-061**: System MUST allow admins/managers to upload/replace/delete images for service_categories
- **FR-062**: System MUST limit category images to 2MB maximum file size (smaller than services' 5MB)
- **FR-063**: System MUST support only one image per category/subcategory (not multiple like services)
- **FR-064**: System MUST provide a visual emoji picker with 8 themed categories (Beauté, Santé, Maison, etc.)
- **FR-065**: System MUST store emoji icons in the `icon` column (max 4 characters for multi-byte emojis)
- **FR-066**: System MUST provide an API endpoint PATCH `/api/admin/categories/[id]/icon` for updating emojis
- **FR-067**: System MUST display categories and subcategories with visual hierarchy (purple bar for subcategories)
- **FR-068**: System MUST show service count per category in the admin UI
- **FR-069**: System MUST support both main categories and subcategories with identical image/icon features
- **FR-070**: System MUST include category image statistics in the centralized `/admin/images` dashboard

### Success Criteria (Extension)

- **SC-025**: Admins can change a category image or icon in under 30 seconds
- **SC-026**: 100% of main categories have either an image or an emoji icon (no empty categories)
- **SC-027**: Emoji picker displays 160 curated emojis organized in 8 themed categories
- **SC-028**: Category image updates reflect immediately in both admin UI and public-facing pages
- **SC-029**: Centralized dashboard shows accurate count of category images uploaded

---

### Edge Cases

- **Quota de stockage**: Que se passe-t-il quand le bucket Supabase atteint sa limite de stockage? (Prévoir monitoring et alertes)
- **Images corrompues**: Comment le système gère-t-il une image corrompue après upload? (Validation post-upload, régénération de thumbnails)
- **Suppression en cascade**: Que se passe-t-il si on supprime un service avec 10 images? (Soft delete ou hard delete avec nettoyage du storage)
- **Concurrence**: Que se passe-t-il si deux admins modifient l'ordre des images simultanément? (Optimistic locking ou last-write-wins avec feedback)
- **Migration d'anciennes images**: Comment gérer les ~35 produits avec URLs externes (Unsplash, Pinterest)? (Script de migration séparé, hors scope de cette feature)
- **Performance avec 500 produits**: Comment optimiser le chargement des galeries pour éviter la latence? (Pagination, lazy loading, CDN)
- **Alt-text génération échoue**: Que se passe-t-il si le service d'IA ne peut générer l'alt-text? (Fallback vers nom du produit + type d'image)
- **Formats exotiques**: Un admin upload une image JPEG avec profil colorimétrique CMYK au lieu de RGB? (Conversion automatique ou rejet avec message explicatif)
- **Images orphelines**: Comment détecter et nettoyer les images uploadées mais non associées à une entité? (Job de nettoyage hebdomadaire)
- **Variations supprimées**: Si une variation produit est supprimée, que deviennent ses images? (Option: réassigner à produit parent ou supprimer)

## Requirements *(mandatory)*

### Functional Requirements

#### Stockage et Upload

- **FR-001**: System MUST allow admin and manager roles to upload images for services, products, and product variants
- **FR-002**: System MUST accept only JPEG, PNG, and WebP image formats
- **FR-003**: System MUST enforce a configurable maximum file size per image (default: 5MB)
- **FR-004**: System MUST store the maximum file size configuration in platform_config table
- **FR-005**: System MUST limit the number of images per entity to 10 (configurable)
- **FR-006**: System MUST organize images in separate storage buckets per entity type (service-images, product-images, conversation-attachments)
- **FR-007**: System MUST validate image format and size before accepting upload
- **FR-008**: System MUST reject uploads that exceed size or count limits with clear error messages
- **FR-009**: System MUST generate unique filenames to prevent collisions (e.g., {entity_type}_{entity_id}_{timestamp}_{hash}.{ext})
- **FR-010**: System MUST allow clients to upload images in conversations related to their bookings

#### Gestion des Images

- **FR-011**: System MUST allow reordering images via drag-and-drop interface
- **FR-012**: System MUST persist image display order (display_order field)
- **FR-013**: System MUST mark one image as "primary" for each entity (is_primary flag)
- **FR-014**: System MUST allow deleting individual images
- **FR-015**: System MUST implement soft delete for images (deleted_at timestamp) to allow recovery
- **FR-016**: System MUST allow reusing existing images from the media library for products
- **FR-017**: System MUST maintain image metadata (uploaded_by, uploaded_at, file_size_bytes, width, height)

#### Alt-text et Accessibilité

- **FR-018**: System MUST require alt-text for all images (mandatory field)
- **FR-019**: System MUST provide automatic alt-text generation functionality
- **FR-020**: System MUST generate alt-text in French describing the image content (e.g., "Service de massage relaxant à domicile - Simone Paris")
- **FR-021**: System MUST allow manual editing of auto-generated alt-text
- **FR-022**: System MUST use alt-text for accessibility (screen readers, SEO)
- **FR-023**: System MUST limit alt-text length to 125 characters (accessibility best practice)

#### Produits E-commerce et Variations

- **FR-024**: System MUST support approximately 500 products with images
- **FR-025**: System MUST allow product variants (e.g., color, size) to have their own specific images
- **FR-026**: System MUST display variant-specific images when a variant is selected on product page
- **FR-027**: System MUST fall back to parent product images if variant has no specific images
- **FR-028**: System MUST allow searching and filtering products to manage their images efficiently
- **FR-029**: System MUST support only Simone as the seller (no marketplace, no multi-vendor)

#### User-Generated Content (UGC)

- **FR-030**: System MUST allow clients to upload photos in conversation threads linked to bookings
- **FR-031**: System MUST validate UGC images for format and size (same limits as admin uploads)
- **FR-032**: System MUST associate UGC images with the conversation, booking, and user
- **FR-033**: System MUST provide a moderation dashboard for admins to review UGC images
- **FR-034**: System MUST allow admins to mark UGC as "appropriate", "inappropriate", or "under review"
- **FR-035**: System MUST soft delete inappropriate images and notify the user with a reason
- **FR-036**: System MUST allow users to contest moderation decisions
- **FR-037**: System MUST list unmoderated images chronologically for efficient review
- **FR-038**: System MUST allow filtering moderation queue by status (pending, approved, rejected)

#### Optimisation et Performance

- **FR-039**: System MUST implement lazy loading for images below the fold
- **FR-040**: System MUST generate responsive image sizes (thumbnail, medium, large)
- **FR-041**: System MUST serve WebP format to compatible browsers with JPEG/PNG fallback
- **FR-042**: System MUST implement CDN caching with appropriate cache headers
- **FR-043**: System MUST display elegant placeholder with gradient for missing images
- **FR-044**: System MUST implement progressive fallback hierarchy (primary → secondary → service icon → placeholder)
- **FR-045**: System MUST target LCP (Largest Contentful Paint) < 2.5 seconds
- **FR-046**: System MUST implement pagination or infinite scroll for large product galleries (>50 products)

#### Permissions et Sécurité

- **FR-047**: System MUST restrict image upload/edit/delete to admin and manager roles only (for services and products)
- **FR-048**: System MUST allow authenticated clients to upload images only in their own conversations
- **FR-049**: System MUST implement Row Level Security (RLS) policies on image tables
- **FR-050**: System MUST prevent public write access to storage buckets
- **FR-051**: System MUST log all image operations (upload, delete, moderation) for audit trail
- **FR-052**: System MUST validate image content to prevent malicious uploads (e.g., executable disguised as image)

#### Monitoring et Maintenance

- **FR-053**: System MUST track storage usage per bucket
- **FR-054**: System MUST alert admins when storage reaches 80% of quota
- **FR-055**: System MUST provide a cleanup job to remove soft-deleted images after 30 days
- **FR-056**: System MUST detect and report orphaned images (uploaded but not linked to any entity)
- **FR-057**: System MUST provide statistics on image usage (total count, average size, format distribution)

#### Configuration

- **FR-058**: System MUST store max_file_size_mb in platform_config table
- **FR-059**: System MUST store max_images_per_entity in platform_config table
- **FR-060**: System MUST allow admins to update configuration values via settings page

### Key Entities *(include if feature involves data)*

- **service_images**: Represents images associated with services (coiffure, ongles, etc.). Attributes: service_id, storage_path, display_order, is_primary, alt_text, uploaded_by, uploaded_at, file_size_bytes, width, height, deleted_at. Relationship: Many images belong to one service.

- **product_images**: Represents images associated with e-commerce products. Attributes: product_id, variant_id (nullable), storage_path, display_order, is_primary, alt_text, uploaded_by, uploaded_at, file_size_bytes, width, height, deleted_at. Relationship: Many images belong to one product, optionally to one variant.

- **product_variants**: Represents product variations (color, size, etc.) with their own images. Attributes: product_id, variant_name, variant_type, sku. Relationship: Many variants belong to one product, each variant can have multiple images.

- **conversation_attachments**: Represents user-generated images uploaded in conversation threads. Attributes: conversation_id, booking_id, uploaded_by_user_id, storage_path, alt_text, moderation_status (pending, approved, rejected), moderated_by, moderated_at, moderation_reason, file_size_bytes, uploaded_at, deleted_at. Relationship: Many attachments belong to one conversation.

- **platform_config**: Stores dynamic configuration values. Attributes: config_key, config_value, description, updated_at, updated_by. Examples: max_file_size_mb=5, max_images_per_entity=10.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can upload and organize service images in under 3 minutes per service
- **SC-002**: Image loading time (LCP) is under 2.5 seconds on 4G connection
- **SC-003**: 100% of visible services have at least one image (no placeholders on homepage)
- **SC-004**: System handles 500 products with 10 images each without performance degradation
- **SC-005**: All images have valid alt-text (manual or auto-generated) for accessibility compliance
- **SC-006**: Clients can upload photos in conversations with success rate > 95%
- **SC-007**: Admins can moderate 20 UGC images in under 5 minutes
- **SC-008**: Zero production incidents related to storage quota exhaustion (monitoring alerts work)
- **SC-009**: Image upload validation rejects 100% of invalid formats (PDF, SVG, etc.)
- **SC-010**: Image upload validation rejects 100% of oversized files (>5MB)
- **SC-011**: Lazy loading reduces initial page load by at least 40% for product galleries
- **SC-012**: Automated alt-text generation succeeds for >90% of uploaded images
- **SC-013**: Product variant images switch correctly 100% of the time when variant is selected
- **SC-014**: Mobile users can swipe through image galleries with <100ms response time
- **SC-015**: Storage usage stays under 80% quota with active monitoring and cleanup jobs
- **SC-016**: Image reordering via drag-and-drop saves correctly 100% of the time
- **SC-017**: Soft-deleted images can be recovered within 30-day window with success rate 100%
- **SC-018**: Inappropriate UGC content is removed within 24 hours of being flagged
- **SC-019**: Zero XSS or malicious file upload incidents in production
- **SC-020**: Lighthouse accessibility score for pages with images is >90
- **SC-021**: Image CDN cache hit rate is >85%
- **SC-022**: Platform supports 500 products with average 7 images each (3500 total product images)
- **SC-023**: System identifies and reports orphaned images weekly with >95% accuracy
- **SC-024**: Configuration changes (max file size, max images) take effect immediately without deployment

## Assumptions

- Supabase Storage is available and configured with appropriate buckets (service-images, product-images, conversation-attachments)
- Admin and manager roles already exist in the profiles table with proper role column
- Services table exists with necessary relationships
- Products table exists or will be created as part of e-commerce implementation
- Conversations table exists with relationship to bookings
- Alt-text generation will use an external AI service (e.g., OpenAI Vision API, Google Cloud Vision, or similar)
- CDN configuration is available (Vercel CDN or Cloudflare)
- Image optimization (WebP conversion, resizing) can be handled by Supabase or external service
- Maximum 500 products for the foreseeable future (scaling beyond requires re-architecture)

## Dependencies

- **Supabase Storage**: Storage buckets must be created and configured with proper RLS policies
- **Auth System**: Must provide admin/manager role checks via Supabase Auth
- **AI Service**: External API for automatic alt-text generation (e.g., OpenAI GPT-4 Vision)
- **Next.js Image Component**: For optimized image rendering with lazy loading
- **react-dropzone**: For drag-and-drop upload UI
- **platform_config table**: Must exist for dynamic configuration storage
- **E-commerce tables**: Products and product_variants tables must be in place
- **Conversations system**: Must exist for UGC attachment functionality
- **Monitoring service**: For storage quota alerts (e.g., Sentry, Vercel monitoring)

## Out of Scope

- Migration of existing external images from Unsplash/Pinterest (separate migration project documented in PLAN_ACTION_IMAGES.md)
- Automated image tagging or categorization beyond alt-text
- Advanced image editing features (crop, rotate, filters) within the platform
- Video uploads or management
- Multi-vendor marketplace image management (only Simone sells)
- Automated content moderation using AI (initial implementation is manual moderation only)
- Public image galleries or client-facing image libraries
- Watermarking or copyright protection features
- Integration with external DAM (Digital Asset Management) systems
- Bulk import from external sources (Dropbox, Google Drive)
- Image versioning or revision history
- Advanced search within images (OCR, visual search)
- Real-time collaborative editing of images
- Integration with photo editing tools (Photoshop, Canva)
