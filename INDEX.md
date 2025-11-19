# Product Comparison - Index & Navigation

## Quick Links
- [CLAUDE.md](CLAUDE.md) - Instructions projet, persona, guidelines
- [Démarrage Rapide](#démarrage-rapide)
- [Skills Disponibles](#skills-disponibles)
- [MCP Apify](#mcp-apify-scraping)
- [Catégories Produits](#catégories-produits-supportées)
- [Exemples](#exemples-dutilisation)

---

## Démarrage Rapide

### Première Comparaison (20-25 min)
```bash
cd product-comparison
claude ""
```

**Workflow automatique**:
1. Validation produits (30 sec)
2. Recherche parallèle 2 subagents (18 min)
3. Génération rapport (5 min)
4. Output: `reports/comparison_DysonV15_vs_SharkStratos_20250115.md`

### Comparaison Cachée (3-5 min)
```bash
# Si produits déjà recherchés < 7 jours
claude "Compare Dyson V15 vs Shark Stratos"
# → Utilise cache, génère rapport directement
```

---

## Navigation Structure

### 1. Configuration (`.claude/`)
| Fichier | Description |
|---------|-------------|
| `settings.json` | Config projet (subagents, hooks, cache) |
| `config.json` | Custom parameters (skills, subagents, logging) |
| `hooks/pre_research.js` | Validate produits avant recherche |
| `hooks/post_collection.js` | Validate qualité données collectées |
| `dev_docs/` | Context, plan, tasks (project memory) |
| `logs/` | Logs execution, erreurs, métriques |

### 2. Skills (`skills/`)
| Skill | Type | Durée | Description |
|-------|------|-------|-------------|
| **product-research-orchestrator** | orchestration | 20-25 min | Coordonne workflow complet, spawn subagents |
| **specs-collector** | data_collection | 2-5 min | Collecte specs depuis manufacturer + Amazon + review sites |
| **reviews-aggregator** | data_collection | 8-10 min | Agrège Amazon + Reddit + experts, analyse sentiment |
| **pricing-tracker** | data_collection | 2-3 min | Track prix multi-retailers, availability |
| **report-generator** | synthesis | 5 min | Génère rapport markdown professionnel |

Détails: `skills/{skill-name}/SKILL.md` (metadata) + `helpers/` (workflows)

### 3. Subagents (`subagents/`)
| Template | Usage | Isolation |
|----------|-------|-----------|
| **product-researcher.md** | Recherche 1 produit (specs + reviews + pricing) | Strict (own context, own folder) |

**Parallélisation**: 2 subagents simultanés (1 par produit) → 2× speedup

### 4. Data (`data/`)
| Dossier | Contenu | TTL |
|---------|---------|-----|
| `category_specs.yaml` | Specs requises par catégorie (électroménager, auto, sport, vélo) | - |
| `cache/specs/` | Specs cachées | 7 jours |
| `cache/reviews/` | Reviews cachées | 7 jours |
| `cache/pricing/` | Pricing caché | 7 jours |
| `research_{timestamp}/` | Résultats recherche session | - |
| `archive/` | Recherches > 30 jours | - |

**Cache strategy**: Check cache avant chaque fetch → 6× speedup si cache hit

### 5. MCP Apify (`.mcp.json`)
| Outil | Usage | Output |
|-------|-------|--------|
| `mcp__apify__apify-slash-rag-web-browser` | Recherche Google + scraping | Markdown |
| `mcp__apify__call-actor` | Appeler Actors spécialisés | JSON structuré |
| `mcp__apify__get-actor-output` | Récupérer résultats Actor | JSON dataset |
| `mcp__apify__search-actors` | Chercher Actors Apify Store | Liste Actors |

**Actors recommandés**:
- `apify/amazon-product-scraper` - Specs + prix Amazon
- `apify/amazon-reviews-scraper` - Reviews Amazon (50+)
- `apify/reddit-scraper` - Posts/comments Reddit

**Stratégie**: MCP Apify (primary) → WebFetch (fallback)

### 6. Rapports (`reports/`)
Format: `comparison_{product1}_vs_{product2}_{timestamp}.md`

**Sections**:
1. Executive Summary
2. Specs Comparison (side-by-side table)
3. Avis Utilisateurs (Amazon, Reddit)
4. Tests Experts (consensus sites spécialisés)
5. Pricing & Availability
6. Verdict par Use Case (budget, performance, beginner)
7. Tableau Récapitulatif
8. Sources

---

## Skills Disponibles

### orchestrator (Skill Principal)
**Pattern**: `compare {product1} vs {product2}`

**Commandes**:
- `compare Dyson V15 vs Shark Stratos`
- `research products iPhone 15 Pro, Samsung Galaxy S24`
- `analyse Décathlon Riverside 500 vs B'Twin Triban 520`

**Workflow**:
1. Valide produits existent
2. Check cache (7j)
3. Spawn 2 subagents parallèles
4. Agrège résultats
5. Trigger report-generator

### specs-collector
**Pattern**: `collect specifications for {product}`

**Sources**: Manufacturer site + Amazon + Review site (category-specific)

**Output**: `specs.json` (9-10 specs selon catégorie)

### reviews-aggregator
**Pattern**: `aggregate reviews for {product}`

**Sources**:
- Users: Amazon (ratings, reviews) + ReCompare Dyson V15 vs Shark Stratosddit (mentions)
- Experts: 2-3 sites selon catégorie

**Output**: `reviews_summary.json` (pros, cons, sentiment, overall_score)

### pricing-tracker
**Pattern**: `track pricing for {product}`

**Retailers**: Amazon + 2-3 sites catégorie

**Output**: `pricing.json` (prix, availability, best_price)

### report-generator
**Pattern**: `generate comparison report`

**Input**: All collected data (specs, reviews, pricing for 2 products)

**Output**: Rapport markdown professionnel

---

## Catégories Produits Supportées

### Électroménager
**Exemples**: Aspirateurs, cafetières, robots cuisine, lave-linge
**Specs**: puissance_W, capacité_L, niveau_bruit_dB, conso_energie, poids_kg
**Review sites**: consumerreports.org, wirecutter.com, lesnumeriques.com
**Retailers**: amazon.fr, boulanger.com, darty.com

### Auto
**Exemples**: Voitures neuves/occasion, motos
**Specs**: motorisation, puissance_ch, conso_L_100km, coffre_L, prix_base
**Review sites**: caradisiac.com, largus.fr, automobile-magazine.fr
**Retailers**: leboncoin.fr, lacentrale.fr, autoscout24.fr

### Sport
**Exemples**: Chaussures running, équipement fitness, outdoor
**Specs**: poids_kg, matériaux, taille, certifications, garantie
**Review sites**: outdoor-mag.fr, i-run.fr
**Retailers**: decathlon.fr, amazon.fr, alltricks.fr

### Vélo
**Exemples**: VTT, route, ville, électrique
**Specs**: type_velo, taille_cadre_cm, poids_kg, nb_vitesses, freins, matériau_cadre, suspension, roues_pouces
**Review sites**: velo-vert.com, citycle.com, lecyclo.com
**Retailers**: decathlon.fr, alltricks.fr, probikeshop.fr

**Ajouter catégorie**: Éditer `data/category_specs.yaml`

---

## Exemples d'Utilisation

### Exemple 1: Vélo VTT
```bash
claude "Compare Décathlon Riverside 500 vs Rockrider ST 530"

# Durée: 20 min (first run), 3 min (cached)
# Output: reports/comparison_Riverside500_vs_ST530_20250115.md

# Rapport inclut:
# - Specs: 9/9 collectées (100%)
# - Reviews: 1,250 Amazon + 15 Reddit + 3 experts
# - Pricing: 4 retailers
# - Verdict: Riverside 500 meilleur rapport qualité/prix
```

### Exemple 2: Électroménager Aspirateurs
```bash
claude "Compare Dyson V15 Detect vs Shark Stratos IZ862H"

# Sources:
# - Specs: dyson.fr + amazon.fr + wirecutter.com
# - Reviews: 2,500 Amazon + 8 Reddit + 2 experts
# - Pricing: Amazon, Boulanger, Darty, Fnac

# Verdict:
# - Meilleur performance: Dyson V15 (aspiration supérieure)
# - Meilleur rapport qualité/prix: Shark Stratos (250€ moins cher)
```

### Exemple 3: Auto
```bash
claude "Compare Peugeot 208 vs Renault Clio 5"

# Sources:
# - Specs: peugeot.fr + renault.fr + caradisiac.com
# - Reviews: 50 Reddit + 3 experts (caradisiac, largus, autoplus)
# - Pricing: leboncoin.fr + lacentrale.fr

# Verdict par use case:
# - Meilleur ville: 208 (compacte, consommation)
# - Meilleur autoroute: Clio (confort, insonorisation)
# - Meilleur rapport qualité/prix: Clio (500€ moins cher équipement équivalent)
```

---

## Métriques Performance

### Durées Moyennes
| Scénario | Durée | Speedup |
|----------|-------|---------|
| First run (no cache) | 20-25 min | Baseline |
| Partial cache (1 product) | 12-15 min | 1.6× |
| Full cache (both products) | 3-5 min | 6× |
| Sequential subagents | 36 min | 0.5× (NOT recommended) |

### Data Quality Targets
- Specs completeness: 90%+ (excellent), 70-89% (good)
- Reviews analyzed: 100+ (high confidence), 10-99 (moderate)
- Retailers checked: 3+ (comprehensive), 1-2 (limited)

### Cost
- **First run**: ~$0.01-0.05 (Apify free tier: 5$ crédit/mois)
- **Cached run**: $0
- **Monthly (20 comparaisons)**: ~$0.50 (largement dans free tier)
- **Fallback WebFetch**: $0

---

## Hooks & Automation

### pre_research.js (UserPromptSubmit)
**Trigger**: User demande comparaison
**Actions**:
1. Extract product names from prompt
2. Validate format (2 produits requis)
3. Check not comparing product with itself
4. Initialize research session ID
5. Create session metadata

### post_collection.js (PostToolUse)
**Trigger**: Write tool saves data file
**Actions**:
1. Detect file type (specs, reviews, pricing, profile)
2. Validate JSON format
3. Check required fields present
4. Calculate completeness score
5. Flag warnings if low quality
6. Log validation results

---

## MCP Apify Scraping

### Configuration
Le fichier `.mcp.json` configure le serveur MCP Apify:
```json
{
  "mcpServers": {
    "apify": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@apify/actors-mcp-server"],
      "env": { "APIFY_TOKEN": "..." }
    }
  }
}
```

### Outils Disponibles

#### `mcp__apify__apify-slash-rag-web-browser`
Recherche Google + scraping en une seule requête.
```
Query: "Dyson V15 specifications site:dyson.fr"
Output: Markdown de la page
```

#### `mcp__apify__call-actor`
Appeler des Actors spécialisés (2 étapes: info → call).

**Amazon Product Scraper**:
```json
{
  "actor": "apify/amazon-product-scraper",
  "step": "call",
  "input": {
    "productUrls": ["https://amazon.fr/dp/B09ABC123"]
  }
}
```

**Amazon Reviews Scraper**:
```json
{
  "actor": "apify/amazon-reviews-scraper",
  "step": "call",
  "input": {
    "productUrls": ["https://amazon.fr/dp/B09ABC123"],
    "maxReviews": 50
  }
}
```

**Reddit Scraper**:
```json
{
  "actor": "apify/reddit-scraper",
  "step": "call",
  "input": {
    "searchPosts": { "term": "Dyson V15 review" },
    "maxPostCount": 20
  }
}
```

#### `mcp__apify__get-actor-output`
Récupérer les résultats complets d'un Actor run.
```json
{
  "datasetId": "abc123...",
  "limit": 100
}
```

### Stratégie d'Utilisation

1. **PRIMARY - MCP Apify**:
   - Amazon specs/reviews → `apify/amazon-*-scraper`
   - Reddit mentions → `apify/reddit-scraper`
   - Recherche Google → `rag-web-browser`

2. **FALLBACK - WebFetch**:
   - Si MCP timeout (>2 min)
   - Si Actor échoue
   - Sites non supportés par Actors

### Avantages MCP vs WebFetch

| Critère | MCP Apify | WebFetch |
|---------|-----------|----------|
| Success rate Amazon | 95%+ | ~70% |
| Reviews par produit | 50-100+ | 10-20 |
| Format output | JSON structuré | HTML à parser |
| Anti-bot handling | Automatique | Manuel |
| Retry logic | Intégré | À implémenter |

---

## Troubleshooting

### Produit Introuvable
```
Error: "Produit 'XYZ' introuvable"
Solution: Vérifier orthographe, essayer avec nom complet
Exemple: "Dyson V15" → "Dyson V15 Detect Absolute"
```

### Specs Incomplètes (< 70%)
```
Warning: "Specs partielles (55%)"
Cause: Source inaccessible ou product page changed
Solution: Continue avec données disponibles, flaggé dans rapport
```

### Cache Corrupted
```
Error: "Cache file invalid JSON"
Action automatique: Delete cache, re-fetch fresh data
Durée: Comme first run (20 min)
```

### Subagent Timeout
```
Warning: "Subagent timeout après 15 min"
Action automatique: Kill subagent, save partial data
Result: Rapport avec données partielles + flag "incomplete"
```

### MCP Actor Échoue
```
Error: "Actor apify/amazon-product-scraper failed"
Action automatique: Fallback vers WebFetch
Solution: Vérifier APIFY_TOKEN dans .mcp.json
```

### MCP Timeout
```
Warning: "MCP call timeout après 2 min"
Action automatique: Continue avec WebFetch
Note: Peut indiquer rate limit Apify atteint
```

---

## Extensibilité

### Ajouter Nouvelle Catégorie
1. Éditer `data/category_specs.yaml`:
```yaml
nouvelle_categorie:
  required_specs: [spec1, spec2, ...]
  review_sites: [site1.com, site2.com]
  retailers: [retailer1.com, retailer2.com]
```

2. Tester:
```bash
claude "Compare [product1 de nouvelle catégorie] vs [product2]"
# Orchestre automatically uses new category config
```

### Ajouter Review Site
1. Éditer `category_specs.yaml` → Ajouter site dans `review_sites[]`
2. reviews-aggregator skill automatically scrapes nouveau site

### Ajouter Retailer
1. Éditer `category_specs.yaml` → Ajouter retailer dans `retailers[]`
2. pricing-tracker skill automatically checks nouveau retailer

---

## Ressources

- **CLAUDE.md**: Instructions complètes, persona, guidelines
- **skills/*/helpers/**: Workflows détaillés par skill
- **subagents/product-researcher.md**: Logic subagent recherche
- **.claude/logs/**: Logs execution pour debugging
- **.mcp.json**: Configuration serveur MCP Apify
- **reports/**: Exemples rapports générés
- **CHANGELOG.md**: Historique des versions

---

**Version**: 1.2
**Date**: 2025-11-19
**Status**: Production-ready
**Mainteneur**: Product Analyst Claude
