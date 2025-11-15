# 🔄 Workflow de Développement - Simone Paris

**Approche**: Spec-Driven Development (SpecKit)
**Principe Fondamental**: ⚠️ **La spec est la source de vérité - TOUJOURS la mettre à jour en premier**

---

## ⚠️ RÈGLE CRITIQUE

### Lors de TOUTE Modification de Fonctionnalité

**OBLIGATOIRE - Dans cet ordre**:

1. ✅ **Mettre à jour la SPEC en premier** (`specs/[###-feature]/spec.md`)
   - User stories impactées
   - Requirements modifiés/ajoutés (FR-XXX)
   - Success criteria ajustés (SC-XXX)
   - Edge cases si nouveaux

2. ✅ **Mettre à jour les TESTS**
   - Acceptance scenarios (Given/When/Then)
   - Test cases unitaires
   - Test cases d'intégration
   - Test cases E2E

3. ✅ **Ensuite seulement**: Modifier le code

4. ✅ **Mettre à jour la documentation technique** si nécessaire
   - Plan.md (si changement architectural)
   - Tasks.md (si nouvelles tâches)
   - Docs/ (guides techniques)

### Pourquoi cet Ordre?

- ✅ **Spec = Contrat**: Change ce qu'on doit faire avant de changer comment on le fait
- ✅ **Tests = Garantie**: Assure que la modification est testable avant implémentation
- ✅ **Code = Implémentation**: Suit la spec et passe les tests
- ✅ **Cohérence**: Évite code/spec divergence

---

## 📋 Workflow Complet par Scénario

### Scénario 1: Nouvelle Fonctionnalité

```bash
# 1. Créer la spec
/speckit.specify "Description de la fonctionnalité"

# 2. Remplir spec.md avec:
#    - User stories (P1, P2, P3)
#    - Functional requirements (FR-001, FR-002, ...)
#    - Success criteria (SC-001, SC-002, ...)
#    - Acceptance scenarios (Given/When/Then)

# 3. Valider avec Product Owner

# 4. Générer plan
/speckit.plan [###-feature-name]

# 5. Générer tâches
/speckit.tasks [###-feature-name]

# 6. Implémenter
/speckit.implement [###-feature-name]

# 7. Analyser cohérence
/speckit.analyze [###-feature-name]
```

---

### Scénario 2: Modification de Fonctionnalité Existante

**⚠️ CRITIQUE**: Ne JAMAIS modifier le code sans mettre à jour la spec d'abord!

```bash
# 1. OUVRIR spec.md
code specs/[###-feature]/spec.md

# 2. IDENTIFIER les changements nécessaires:
#    - Quelles user stories sont impactées?
#    - Quels requirements changent?
#    - Quels success criteria sont affectés?

# 3. METTRE À JOUR spec.md:
#    a) Modifier/ajouter user stories
#    b) Modifier/ajouter functional requirements (FR-XXX)
#    c) Ajuster success criteria (SC-XXX)
#    d) Ajouter/modifier acceptance scenarios
#    e) Ajouter edge cases si nécessaire

# 4. METTRE À JOUR les tests:
#    a) Tests unitaires (selon nouveaux FR)
#    b) Tests d'intégration
#    c) Tests E2E (selon nouveaux acceptance scenarios)

# 5. COMMIT spec + tests AVANT code:
git add specs/[###-feature]/spec.md
git add tests/
git commit -m "spec: Update [feature] - [description]"

# 6. MAINTENANT: Modifier le code

# 7. COMMIT code:
git commit -m "feat: Implement [feature] per updated spec"

# 8. METTRE À JOUR plan.md/tasks.md si nécessaire
```

---

### Scénario 3: Bug Fix

**Même pour un bug**: Mettre à jour spec si comportement change!

```bash
# 1. ANALYSER le bug:
#    - Est-ce un bug d'implémentation? (code ne respecte pas spec)
#    - OU est-ce un bug de spec? (spec incomplète/incorrecte)

# 2a. Si bug d'implémentation (spec correcte):
#     - Ajouter test qui reproduit le bug
#     - Fixer le code
#     - Vérifier que spec est toujours cohérente

# 2b. Si bug de spec (spec incorrecte/incomplète):
#     ⚠️ METTRE À JOUR SPEC.MD D'ABORD
#     - Ajouter edge case manquant
#     - Clarifier requirement
#     - Ajouter acceptance scenario
#     - PUIS fixer le code

# 3. COMMIT:
git commit -m "fix: [description] - spec updated if needed"
```

---

### Scénario 4: Ajout de Edge Case

```bash
# 1. OUVRIR spec.md
code specs/[###-feature]/spec.md

# 2. AJOUTER dans section "Edge Cases":
   - Description du cas limite
   - Comportement attendu

# 3. AJOUTER acceptance scenario:
   **Given** [état limite], **When** [action], **Then** [comportement]

# 4. AJOUTER test reproduisant l'edge case

# 5. IMPLÉMENTER le handling de l'edge case

# 6. COMMIT:
git commit -m "spec: Add edge case for [scenario]"
git commit -m "test: Add test for [edge case]"
git commit -m "feat: Handle edge case [scenario]"
```

---

## 🎯 Exemples Concrets

### Exemple 1: Ajout Code Promo - Cumul avec Carte Cadeau

**❌ MAUVAIS**:
```bash
# Directement coder le cumul
code app/checkout/page.tsx
# Ajouter logique cumul promo + carte cadeau
git commit -m "feat: Allow promo code + gift card"
```

**✅ BON**:
```bash
# 1. Mettre à jour spec
code specs/015-promo-codes-system/spec.md

# Ajouter dans spec.md:
# - Nouvelle user story: "Client cumule code promo ET carte cadeau"
# - Nouveau FR-035: "Le système DOIT permettre cumul code promo + carte cadeau"
# - Nouveau SC-011: "95% des utilisateurs utilisent avec succès les deux"
# - Nouveau acceptance scenario:
#   Given client avec carte cadeau 50€ et code promo 20%,
#   When il applique les deux,
#   Then réduction = (prix × 20%) + 50€

# 2. Mettre à jour tests
code tests/promo-codes/cumul.test.ts
# Ajouter test vérifiant cumul

# 3. Commit spec + tests
git add specs/015-promo-codes-system/spec.md tests/
git commit -m "spec: Add cumul promo+gift card - FR-035, SC-011"

# 4. Implémenter
code app/checkout/page.tsx
git commit -m "feat: Implement promo+gift cumul per spec FR-035"
```

---

### Exemple 2: Modification Calcul Commission

**❌ MAUVAIS**:
```bash
# Changer directement la formule SQL
code supabase/migrations/xxxxx_fix_commission.sql
git commit -m "fix: Update commission calculation"
```

**✅ BON**:
```bash
# 1. Analyser l'impact sur spec
code specs/015-promo-codes-system/spec.md

# Modifier dans spec.md:
# - FR-019: Mettre à jour formule de calcul
# - SC-006: Ajuster critère de validation (0 erreur)
# - Ajouter edge case: "Commission avec tip + promo"

# 2. Mettre à jour tests
code tests/financial/commission.test.ts
# Modifier assertions selon nouvelle formule

# 3. Commit spec + tests
git commit -m "spec: Update commission calc formula - FR-019"

# 4. Créer migration
code supabase/migrations/xxxxx_update_commission.sql

# 5. Commit migration
git commit -m "feat: Update commission calc per spec FR-019"

# 6. Mettre à jour docs techniques
code docs/PROMO_CODES_SYSTEM.md
# Section "Calculs Financiers"
git commit -m "docs: Update commission formula documentation"
```

---

## 🔍 Checklist Avant Chaque Commit

### Pour Feature/Enhancement

- [ ] Spec.md mise à jour avec nouveaux/modifiés:
  - [ ] User stories (si applicable)
  - [ ] Functional requirements (FR-XXX)
  - [ ] Success criteria (SC-XXX)
  - [ ] Acceptance scenarios
  - [ ] Edge cases (si nouveaux)
- [ ] Tests mis à jour/ajoutés:
  - [ ] Tests unitaires
  - [ ] Tests d'intégration
  - [ ] Tests E2E (si applicable)
- [ ] Tests passent ✅
- [ ] Code respecte spec
- [ ] Documentation technique mise à jour (si changement architectural)

### Pour Bug Fix

- [ ] Si bug de spec:
  - [ ] Spec.md corrigée (edge case ajouté, FR clarifié, etc.)
  - [ ] Tests ajoutés reproduisant le bug
- [ ] Si bug d'implémentation:
  - [ ] Test reproduisant le bug ajouté
  - [ ] Code fixé
  - [ ] Spec toujours cohérente
- [ ] Tests passent ✅

---

## 📊 Métriques de Qualité

### À Suivre

1. **Spec Coverage**: % de requirements (FR-XXX) avec tests
   - Objectif: >95%

2. **Test Pass Rate**: % de tests passant
   - Objectif: 100%

3. **Spec-Code Divergence**: Nombre de comportements non documentés dans spec
   - Objectif: 0

4. **Edge Case Coverage**: % de edge cases avec tests
   - Objectif: 100%

### À Chaque Sprint

```bash
# Analyser cohérence spec/code/tests
/speckit.analyze [###-feature-name]

# Vérifier:
# - Tous les FR ont des tests? ✅
# - Tous les acceptance scenarios sont testés? ✅
# - Code implémente tous les FR? ✅
# - Aucun comportement non spécifié dans code? ✅
```

---

## 🚨 Anti-Patterns à Éviter

### ❌ 1. Coder Sans Spec

```bash
# NON!
git checkout -b feature/new-thing
code app/feature.tsx
git commit -m "feat: New thing"
```

**Problème**: Pas de contrat, pas de tests, pas de success criteria

---

### ❌ 2. Mettre à Jour Spec Après Coup

```bash
# NON!
# 1. Coder feature
code app/feature.tsx
git commit -m "feat: New thing"

# 2. Ensuite mettre à jour spec
code specs/xxx/spec.md
git commit -m "spec: Document new thing"
```

**Problème**: Spec devient documentation (après coup) au lieu de contrat (avant)

---

### ❌ 3. Spec et Code Divergent

```bash
# Spec dit:
FR-019: Commission = (Original × Rate) - Fees

# Code fait:
commission = (final_amount × rate) - fees  // ❌ Utilise final au lieu de original
```

**Problème**: Source de vérité perdue, bugs silencieux

---

### ❌ 4. Tests Sans Lien avec Spec

```bash
# Test:
it('should calculate something', () => {
  expect(calc(100, 0.2)).toBe(80);  // Quoi? Pourquoi 80?
});
```

**Problème**: Test non traçable à un requirement, pas de contexte métier

---

## ✅ Bonnes Pratiques

### 1. Tests Référencent FR/SC

```typescript
// ✅ BON
describe('FR-019: Commission on original amount', () => {
  it('SC-006: Should have 0 commission errors with promo', () => {
    // Given: Service 100€ with 20% promo
    const original = 100;
    const promoDiscount = 20;
    const final = 80;

    // When: Calculate commission (rate 20%)
    const commission = calculateCommission({
      serviceAmountOriginal: original,  // Uses original per FR-019
      serviceAmount: final,
      commissionRate: 20
    });

    // Then: Commission is on 100€, not 80€
    expect(commission).toBe(80);  // 100 × 0.8 = 80
  });
});
```

---

### 2. Commit Messages Référencent Spec

```bash
# ✅ BON
git commit -m "spec(015): Add FR-035 for promo+gift cumul"
git commit -m "test(015): Add tests for FR-035 cumul scenario"
git commit -m "feat(015): Implement FR-035 promo+gift cumul"

# Pattern: <type>(<spec-number>): <description>
# Types: spec, test, feat, fix, docs, refactor
```

---

### 3. PR Description Référence Spec

```markdown
## PR: Implement Promo Code + Gift Card Cumul

**Spec**: `specs/015-promo-codes-system/spec.md`

**Changes**:
- ✅ Spec updated: Added FR-035, SC-011
- ✅ Tests added: `tests/promo-codes/cumul.test.ts`
- ✅ Implementation: `app/checkout/page.tsx`

**Requirements Addressed**:
- FR-035: System MUST allow cumul promo code + gift card
- SC-011: 95% users successfully use both

**Tests**:
- [x] All tests pass
- [x] New acceptance scenario covered
- [x] Edge cases tested

**Spec Consistency**:
```bash
/speckit.analyze 015-promo-codes-system
# ✅ All FR covered
# ✅ All SC measurable
# ✅ No divergence detected
```
```

---

## 📚 Ressources

### Templates

- **[Spec Template](../.specify/templates/spec-template.md)** - Format standard
- **[Plan Template](../.specify/templates/plan-template.md)** - Design decisions
- **[Tasks Template](../.specify/templates/tasks-template.md)** - Action items

### Exemples

- **[Spec 015 - Promo Codes](../specs/015-promo-codes-system/spec.md)** - Exemple complet
- **[Spec 007 - Contractor Interface](../specs/007-contractor-interface/spec.md)** - User stories détaillées

### Guides

- **[Constitution](../.specify/constitution.md)** - Principes du projet
- **[SpecKit Alignment](./SPECKIT_ALIGNMENT.md)** - État alignement SpecKit

---

## 🎯 Rappel Final

### TOUJOURS se Poser ces Questions:

1. **Avant de coder**: "La spec décrit-elle ce comportement?"
   - Si NON → Mettre à jour spec d'abord

2. **Avant de commit code**: "Les tests sont-ils à jour?"
   - Si NON → Mettre à jour tests d'abord

3. **Après implémentation**: "Spec et code sont-ils cohérents?"
   - Vérifier avec `/speckit.analyze`

---

**Principe de Base**:

> **Spec-Driven Development** signifie que **la spec drive le développement**, pas l'inverse.
>
> Code suit spec. Spec ne suit PAS code.

---

**Date**: 2025-11-07
**Version**: 1.0
**Statut**: ⭐ **WORKFLOW OBLIGATOIRE**
