# Report Template - Product Comparison

## Structure Markdown Complète

```markdown
# Comparaison: {Product1} vs {Product2}

**Date**: {timestamp}
**Catégorie**: {category}
**Recherche ID**: {research_id}

---

## Executive Summary

{3 paragraphes synthétiques}

**Paragraphe 1** - Context & Products:
"Nous comparons le {product1} ({manufacturer1}) face au {product2} ({manufacturer2}),
 deux {category} dans la gamme {price_range}."

**Paragraphe 2** - Key Findings:
"Après analyse de {total_sources} sources ({amazon_reviews} avis Amazon, {expert_reviews} tests experts),
 le {winner} se démarque par {key_advantage}. Le {loser} compense avec {compensating_factor}."

**Paragraphe 3** - Verdict:
"Pour {use_case_1}, le {product_X} l'emporte. Pour {use_case_2}, préférez le {product_Y}."

---

## 1. Spécifications Comparées

| Caractéristique | {Product1} | {Product2} | Avantage |
|----------------|-----------|-----------|----------|
| {spec1_name}   | {p1_value} | {p2_value} | {winner} ✅ |
| {spec2_name}   | {p1_value} | {p2_value} | {winner} ✅ |
| ...            | ...       | ...       | ...      |

**Différences majeures**:
- **{spec_name}**: {product1} offre {value1} vs {product2} {value2} → Impact: {explication}
- ...

---

## 2. Avis Utilisateurs

### {Product1}

**Amazon**: {avg_rating}/5 ⭐ ({total_reviews} avis)
**Reddit**: {sentiment_pct}% positif ({mentions} mentions)
**Score global**: {overall_score}/5

**Top 3 Points Positifs** (selon utilisateurs):
1. {pro1} - {mentions} mentions
2. {pro2} - {mentions} mentions
3. {pro3} - {mentions} mentions

**Top 3 Points Négatifs**:
1. {con1} - {mentions} mentions
2. {con2} - {mentions} mentions
3. {con3} - {mentions} mentions

### {Product2}

{Same structure}

---

## 3. Tests Experts

### Consensus Experts ({nb_reviews} tests analysés)

**Sites consultés**: {list_review_sites}

#### {Product1}
**Moyenne**: {avg_expert_rating}/10
**Recommandé par**: {recommended_pct}% des experts

**Pros experts**:
- {expert_pro1}
- {expert_pro2}
- ...

**Cons experts**:
- {expert_con1}
- {expert_con2}
- ...

**Verdict type**: "{typical_expert_verdict}"

#### {Product2}
{Same structure}

---

## 4. Comparaison Prix & Disponibilité

| Retailer | {Product1} | {Product2} | Économie |
|----------|-----------|-----------|----------|
| Amazon.fr | {price1}€ | {price2}€ | {diff}€ ({pct}%) |
| {Retailer2} | {price1}€ | {price2}€ | {diff}€ |
| {Retailer3} | {price1}€ | {price2}€ | {diff}€ |
| **Meilleur prix** | **{min_price1}€** | **{min_price2}€** | **{diff}€** |

**Disponibilité**:
- {Product1}: {availability_status} ({retailer})
- {Product2}: {availability_status} ({retailer})

**Promos actives**:
- {Product1}: {promo_description} (jusqu'au {date})
- {Product2}: {promo_description}

---

## 5. Verdict par Use Case

### 🏆 Meilleur Rapport Qualité/Prix
**Gagnant**: {product_name}

**Justification**:
{Explication basée sur: prix, features essentielles, durabilité prévue, avis users}

Prix: {price}€
Score avis: {rating}/5
Verdict: "{summary_verdict}"

---

### 🔥 Meilleures Performances
**Gagnant**: {product_name}

**Justification**:
{Explication basée sur: specs techniques supérieures, tests experts, features avancées}

Specs clés: {key_specs}
Score experts: {expert_rating}/10
Verdict: "{summary_verdict}"

---

### 💚 Meilleur pour Débutant
**Gagnant**: {product_name}

**Justification**:
{Explication basée sur: facilité utilisation, courbe apprentissage, support/doc, avis débutants}

---

### 🎯 Recommandation Générale

{Synthèse finale 2-3 phrases}

"Si budget limité: {product_budget}
Si priorité performance: {product_performance}
Si polyvalence: {product_polyvalent}"

---

## 6. Tableau Récapitulatif

| Critère | {Product1} | {Product2} | Gagnant |
|---------|-----------|-----------|---------|
| **Prix** | {price1}€ | {price2}€ | {winner} |
| **Avis users** | {score1}/5 | {score2}/5 | {winner} |
| **Tests experts** | {score1}/10 | {score2}/10 | {winner} |
| **{Key_spec1}** | {value1} | {value2} | {winner} |
| **{Key_spec2}** | {value1} | {value2} | {winner} |
| **Disponibilité** | {status1} | {status2} | {winner} |
| **Score GLOBAL** | **{global1}/10** | **{global2}/10** | **{winner}** 🏆 |

---

## 7. Sources

### Spécifications
- {Product1} manufacturer: {url}
- {Product1} Amazon: {url}
- {Product1} review: {url}
- {Product2} manufacturer: {url}
- {Product2} Amazon: {url}
- {Product2} review: {url}

### Reviews Experts
- {Site1}: {url}
- {Site2}: {url}
- {Site3}: {url}

### Avis Utilisateurs
- Amazon {Product1}: {url} ({nb_reviews} avis)
- Amazon {Product2}: {url} ({nb_reviews} avis)
- Reddit discussions: {nb_threads} threads analysés

### Pricing
- Amazon: {url}
- {Retailer2}: {url}
- {Retailer3}: {url}

---

**Rapport généré le**: {timestamp}
**Durée recherche**: {duration_min} minutes
**Sources analysées**: {total_sources}
**Cache valide jusqu'au**: {cache_expiry_date} (7 jours)

---

*Note: Ce rapport est basé sur données publiques disponibles au {date}.
Prix et disponibilités peuvent varier. Vérifier auprès des retailers avant achat.*
```

---

## Generation Logic

### Step 1: Load All Data
```javascript
// Load collected data
product1_data = {
  specs: read(research_folder + "/product1/specs.json"),
  reviews: read(research_folder + "/product1/reviews_summary.json"),
  pricing: read(research_folder + "/product1/pricing.json")
}

product2_data = { /* same */ }

category_specs = read("data/category_specs.yaml")[category]
```

### Step 2: Generate Executive Summary
```javascript
// Identify winner based on global score
global_score_p1 = calculate_global_score(product1_data)
global_score_p2 = calculate_global_score(product2_data)

winner = (global_score_p1 > global_score_p2) ? product1 : product2
loser = (winner == product1) ? product2 : product1

// Extract key advantages
key_advantage_winner = get_top_differentiator(winner_data, loser_data)
compensating_factor_loser = get_top_differentiator(loser_data, winner_data)

// Build paragraphs
para1 = build_context_paragraph(product1, product2, category)
para2 = build_findings_paragraph(winner, loser, key_advantage, total_sources)
para3 = build_verdict_paragraph(use_cases, recommendations)
```

### Step 3: Build Specs Comparison Table
```javascript
// Get all specs from both products
all_specs_keys = union(product1_data.specs.keys, product2_data.specs.keys)

// Build table rows
table_rows = []
for each spec in all_specs_keys:
  p1_value = product1_data.specs[spec] || "N/A"
  p2_value = product2_data.specs[spec] || "N/A"

  // Determine winner for this spec (higher = better, or category-specific logic)
  advantage = determine_spec_winner(spec, p1_value, p2_value, category)

  table_rows.append({
    name: spec,
    p1: p1_value,
    p2: p2_value,
    winner: advantage
  })

// Identify major differences (> 20% delta or qualitative difference)
major_diffs = filter(table_rows, row => is_major_difference(row))
```

### Step 4: Synthesize Reviews
```javascript
// For each product, extract:
amazon_rating = product_data.reviews.sources.amazon.avg_rating
reddit_sentiment_pct = product_data.reviews.sources.reddit.sentiment.positive
overall_score = product_data.reviews.overall_score

// Top 3 pros (highest mentions)
top_pros = sort(product_data.reviews.pros, by: total_mentions, desc).slice(0, 3)

// Top 3 cons
top_cons = sort(product_data.reviews.cons, by: total_mentions, desc).slice(0, 3)
```

### Step 5: Build Pricing Table
```javascript
// Extract prices from all retailers
pricing_table = []
for each retailer in product1_data.pricing.retailers:
  p1_price = product1_data.pricing.retailers[retailer].price
  p2_price = product2_data.pricing.retailers[retailer].price
  diff = abs(p1_price - p2_price)
  pct = (diff / min(p1_price, p2_price)) * 100

  pricing_table.append({
    retailer: retailer,
    p1: p1_price,
    p2: p2_price,
    diff: diff,
    pct: pct
  })

// Find best prices
best_price_p1 = min(product1_data.pricing.retailers[*].price)
best_price_p2 = min(product2_data.pricing.retailers[*].price)
```

### Step 6: Determine Verdict per Use Case
```javascript
// Use Case 1: Best Value
value_winner = (best_price_p1 / global_score_p1) < (best_price_p2 / global_score_p2)
  ? product1 : product2

// Use Case 2: Best Performance
performance_winner = compare_specs(p1.specs, p2.specs, priority: "performance")

// Use Case 3: Best for Beginner
beginner_winner = analyze_ease_of_use(p1.reviews, p2.reviews, p1.specs, p2.specs)

// General recommendation
general_recommendation = build_recommendation_matrix({
  budget: value_winner,
  performance: performance_winner,
  versatility: most_versatile(p1, p2)
})
```

### Step 7: Calculate Global Score
```javascript
function calculate_global_score(product_data):
  // Weighted scoring (customizable per category)
  price_score = normalize_price_score(product_data.pricing.best_price, category)  // 0-10
  reviews_score = (product_data.reviews.overall_score / 5) * 10  // Convert 0-5 to 0-10
  specs_score = calculate_specs_score(product_data.specs, category_specs)  // 0-10

  // Weights (adjustable)
  weights = {price: 0.3, reviews: 0.4, specs: 0.3}

  global = (price_score * weights.price) +
           (reviews_score * weights.reviews) +
           (specs_score * weights.specs)

  return round(global, 1)  // e.g., 8.3/10
```

### Step 8: Render Markdown
```javascript
// Replace all placeholders in template
markdown = template
  .replace(/{Product1}/g, product1_name)
  .replace(/{Product2}/g, product2_name)
  .replace(/{timestamp}/g, now)
  .replace(/{category}/g, category)
  .replace(/{para1}/g, para1)
  .replace(/{para2}/g, para2)
  // ... all other placeholders

// Save to file
output_path = `reports/comparison_${product1_slug}_vs_${product2_slug}_${timestamp}.md`
write(output_path, markdown)

return {
  success: true,
  report_path: output_path,
  global_scores: {
    product1: global_score_p1,
    product2: global_score_p2,
    winner: winner
  }
}
```

---

## Scoring Algorithms

### Specs Score (Category-Specific)
```javascript
// Vélo example
function calculate_specs_score_velo(specs, required):
  score = 0
  max_score = 10

  // Weight important specs more
  weights = {
    poids_kg: 0.2,  // Lighter = better
    nb_vitesses: 0.15,
    materiau_cadre: 0.15,  // Carbone > Aluminium > Acier
    freins: 0.15,  // Hydraulique > Mécanique
    prix: 0.2,  // Relative to category average
    suspension: 0.1,
    type_velo: 0.05
  }

  // Poids: Lower = better
  if (specs.poids_kg):
    ideal_weight = 12  // For VTT category
    weight_delta = abs(specs.poids_kg - ideal_weight)
    weight_score = max(0, 10 - weight_delta)  // Closer to ideal = higher score
    score += weight_score * weights.poids_kg

  // Vitesses: More = better (up to diminishing returns)
  if (specs.nb_vitesses):
    vitesses_score = min(10, specs.nb_vitesses / 2.4)  // 24 vitesses = 10/10
    score += vitesses_score * weights.nb_vitesses

  // Matériau: Qualitative scoring
  materiau_scores = {Carbone: 10, Aluminium: 7, Acier: 4}
  if (specs.materiau_cadre):
    score += materiau_scores[specs.materiau_cadre] * weights.materiau_cadre

  // ... similar logic for other specs

  return score  // 0-10
```

---

## Example Output (Vélo)

**Input**:
- Product1: Décathlon Riverside 500
- Product2: B'Twin Triban 520

**Generated Report Excerpt**:

```markdown
# Comparaison: Décathlon Riverside 500 vs B'Twin Triban 520

**Date**: 2025-01-15
**Catégorie**: Vélo
**Recherche ID**: research_20250115_143052

---

## Executive Summary

Nous comparons le Décathlon Riverside 500 (VTT polyvalent) face au B'Twin Triban 520 (vélo route),
deux vélos dans la gamme 500-700€ destinés aux cyclistes débutants à intermédiaires.

Après analyse de 18 sources (1,250 avis Amazon, 3 tests experts), le Riverside 500 se démarque
par son excellent rapport qualité/prix et sa polyvalence (route + chemins). Le Triban 520
compense avec des performances route supérieures et un poids plus léger.

Pour usage mixte ville/loisir, le Riverside 500 l'emporte. Pour cyclisme route pur et longues
distances, préférez le Triban 520.

---

## 1. Spécifications Comparées

| Caractéristique | Riverside 500 | Triban 520 | Avantage |
|----------------|--------------|-----------|----------|
| Type | VTT | Route | - |
| Poids | 13.2 kg | 11.5 kg | Triban 520 ✅ |
| Vitesses | 21 | 16 | Riverside 500 ✅ |
| Freins | Hydraulique | Mécanique | Riverside 500 ✅ |
| Matériau | Aluminium | Aluminium | - |
| Prix | 549€ | 699€ | Riverside 500 ✅ |

**Différences majeures**:
- **Poids**: Triban 520 1.7kg plus léger → Avantage significatif en montée
- **Freins**: Riverside 500 freins hydrauliques vs mécaniques → Meilleur freinage en conditions humides
- **Prix**: Riverside 500 150€ moins cher → 21% économie

---

## 5. Verdict par Use Case

### 🏆 Meilleur Rapport Qualité/Prix
**Gagnant**: Décathlon Riverside 500

**Justification**:
À 549€, le Riverside 500 offre freins hydrauliques et grande polyvalence. Avis unanimes sur
robustesse et durabilité. Le Triban 520 à 699€ est excellent mais 21% plus cher pour usage moins polyvalent.

Prix: 549€
Score avis: 4.3/5
Verdict: "Best value for money selon 87% des utilisateurs"

---

## 6. Tableau Récapitulatif

| Critère | Riverside 500 | Triban 520 | Gagnant |
|---------|--------------|-----------|---------|
| **Prix** | 549€ | 699€ | Riverside 500 |
| **Avis users** | 4.3/5 | 4.1/5 | Riverside 500 |
| **Tests experts** | 8.5/10 | 8.0/10 | Riverside 500 |
| **Poids** | 13.2kg | 11.5kg | Triban 520 |
| **Polyvalence** | ⭐⭐⭐ | ⭐⭐ | Riverside 500 |
| **Score GLOBAL** | **8.3/10** | **7.8/10** | **Riverside 500** 🏆 |
```
