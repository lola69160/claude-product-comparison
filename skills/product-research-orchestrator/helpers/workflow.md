# Product Research Orchestrator - Workflow Détaillé

## Phase 1: Validation Produits (1-2 min)

### Étape 1.1: Parse User Request
```
Input: "Compare Dyson V15 vs Shark Stratos"
↓
Extract:
- product1 = "Dyson V15"
- product2 = "Shark Stratos"
- category = null (auto-detect)
```

### Étape 1.2: Validate Products Exist
```javascript
For each product:
  1. WebFetch Google: "site:amazon.fr {product_name}"
  2. WebFetch Google: "{product_name} official site"
  3. Check results:
     - ≥ 3 relevant results → Product EXISTS
     - < 3 results → Ask user clarification
  4. Extract:
     - Product title (official)
     - Manufacturer
     - Category (from results context)
     - Amazon URL (if found)
```

**Output**:
```json
{
  "product1": {
    "name": "Dyson V15 Detect",
    "manufacturer": "Dyson",
    "category": "electromenager",
    "amazon_url": "https://amazon.fr/...",
    "official_url": "https://dyson.fr/..."
  },
  "product2": { /* same structure */ }
}
```

### Étape 1.3: Confirm with User
```
Display:
"Je vais comparer:
- Product 1: {name} ({manufacturer})
- Product 2: {name} ({manufacturer})
- Catégorie détectée: {category}

Confirmer ? (y/n)"

If user modifies → Update product names
```

---

## Phase 2: Cache Check (30 sec)

### Étape 2.1: Generate Cache Keys
```javascript
For each product:
  cache_key_specs = MD5(product_name + "specs")
  cache_key_reviews = MD5(product_name + "reviews")
  cache_key_pricing = MD5(product_name + "pricing")
```

### Étape 2.2: Check Cache Validity
```javascript
For each cache_key:
  1. Read data/cache/{type}/{cache_key}.json
  2. If exists:
     - Check: (now - cached_at) < 604800 (7 days)
     - If valid → cache_hit = true
     - If expired → cache_hit = false, delete file
  3. If not exists → cache_hit = false
```

### Étape 2.3: Determine Strategy
```javascript
If ALL 6 cache entries valid (2 products × 3 types):
  → FULL CACHE HIT
  → Skip to Phase 4 (Report Generation)
  → Duration: ~3 min total

If SOME cache entries valid:
  → PARTIAL CACHE HIT
  → Pass cache_hits to subagents
  → Subagents skip cached data collection
  → Duration: ~10 min

If NO cache entries valid:
  → FULL RESEARCH
  → Subagents fetch all data
  → Duration: ~20 min
```

---

## Phase 3: Parallel Subagent Research (15-18 min)

### Étape 3.1: Initialize Research Session
```javascript
1. Create research folder: data/research_{timestamp}/
2. Create subfolders:
   - data/research_{timestamp}/{product1_name}/
   - data/research_{timestamp}/{product2_name}/
3. Create orchestration log:
   - data/research_{timestamp}/orchestration_log.json
```

**orchestration_log.json structure**:
```json
{
  "session_id": "research_20250115_143052",
  "timestamp_start": "2025-01-15T14:30:52Z",
  "products": ["Dyson V15 Detect", "Shark Stratos"],
  "category": "electromenager",
  "cache_status": {
    "product1": {"specs": "hit", "reviews": "miss", "pricing": "miss"},
    "product2": {"specs": "miss", "reviews": "miss", "pricing": "miss"}
  },
  "subagents": [
    {
      "id": "subagent_A",
      "product": "Dyson V15 Detect",
      "status": "pending",
      "started_at": null,
      "completed_at": null
    },
    {
      "id": "subagent_B",
      "product": "Shark Stratos",
      "status": "pending",
      "started_at": null,
      "completed_at": null
    }
  ],
  "errors": []
}
```

### Étape 3.2: Spawn Parallel Subagents
```javascript
Use Task tool to launch 2 subagents IN PARALLEL:

Task(
  subagent_type: "general-purpose",
  description: "Research product A",
  prompt: `
    Use subagent template: subagents/product-researcher.md

    Product to research: {product1_name}
    Category: {category}
    Research folder: data/research_{timestamp}/{product1_name}/
    Cache status: {cache_status_product1}

    Execute skills in order:
    1. specs-collector (skip if cache hit)
    2. reviews-aggregator (skip if cache hit)
    3. pricing-tracker (skip if cache hit)

    Save all outputs to research folder.
    Return product_profile.json summary.
  `
)

Task(
  subagent_type: "general-purpose",
  description: "Research product B",
  prompt: `[same structure for product2]`
)
```

**Parallel execution** → Both run simultaneously (15 min total vs 30 min sequential)

### Étape 3.3: Monitor Subagent Progress
```javascript
While subagents running:
  1. Check .claude/logs/subagent_{timestamp}.log
  2. Update orchestration_log.json with progress
  3. If timeout (30 min):
     - Kill subagents
     - Flag: "partial data collected"
     - Continue to aggregation with available data
```

---

## Phase 4: Aggregation & Cache Update (2 min)

### Étape 4.1: Collect Subagent Results
```javascript
For each product:
  1. Read data/research_{timestamp}/{product}/product_profile.json
  2. Validate completeness:
     - specs.json exists & non-empty
     - reviews_summary.json exists
     - pricing.json exists
  3. If missing data:
     - Flag warning in orchestration_log
     - Continue with available data
```

### Étape 4.2: Update Cache
```javascript
For each product & data type:
  1. If data was freshly fetched (not from cache):
     - Generate cache_key
     - Save to data/cache/{type}/{cache_key}.json
     - Set cached_at = now
     - Set ttl = 604800 (7 days)
  2. If data from cache:
     - Skip (already cached)
```

**Cache file structure**:
```json
{
  "cache_key": "dyson_v15_specs",
  "product": "Dyson V15 Detect",
  "type": "specs",
  "cached_at": "2025-01-15T14:45:00Z",
  "ttl": 604800,
  "source_urls": [
    "https://dyson.fr/...",
    "https://amazon.fr/..."
  ],
  "data": {
    "puissance_W": 230,
    "capacite_L": 0.76,
    /* ... full specs */
  }
}
```

### Étape 4.3: Generate Aggregation Summary
```json
{
  "comparison_ready": true,
  "products": [
    {
      "name": "Dyson V15 Detect",
      "data_completeness": {
        "specs": 95,  // % specs requises collectées
        "reviews": 100,
        "pricing": 80
      },
      "data_sources_count": 9
    },
    {
      "name": "Shark Stratos",
      "data_completeness": { /* same */ }
    }
  ],
  "total_duration_sec": 1080,
  "cache_utilized": true
}
```

Save to: `data/research_{timestamp}/aggregation_summary.json`

---

## Phase 5: Report Generation Trigger (5 min)

### Étape 5.1: Prepare Report Context
```javascript
Report context = {
  "research_folder": "data/research_{timestamp}/",
  "product1": {
    "name": "Dyson V15 Detect",
    "profile": /* product_profile.json */,
    "specs": /* specs.json */,
    "reviews": /* reviews_summary.json */,
    "pricing": /* pricing.json */
  },
  "product2": { /* same */ },
  "category": "electromenager",
  "category_specs": /* from category_specs.yaml */
}
```

### Étape 5.2: Trigger report-generator Skill
```javascript
Call skill: report-generator
Input: report_context
Output: reports/comparison_{product1}_vs_{product2}_{timestamp}.md
```

### Étape 5.3: Finalize Orchestration
```javascript
1. Update orchestration_log.json:
   - timestamp_end = now
   - total_duration = end - start
   - status = "completed"
   - report_path = "reports/comparison_*.md"

2. Output to user:
   "✅ Comparaison terminée en {duration} min

   Rapport: reports/comparison_{product1}_vs_{product2}_{timestamp}.md

   Données collectées:
   - Sources: {total_sources}
   - Complétude specs: {avg_completeness}%
   - Cache utilisé: {cache_hit_count}/6

   Prochaine comparaison similaire: ~3 min (cache valide 7j)"
```

---

## Error Handling & Recovery

### Error 1: Product Not Found
```
Symptom: < 3 Google results for product name
Action:
  1. Display: "Produit '{name}' introuvable. Suggestions:"
  2. WebFetch Google: "{name} alternative products"
  3. Show top 3 suggestions
  4. Ask user: "Lequel vouliez-vous ?"
  5. Retry with corrected name
```

### Error 2: Subagent Timeout
```
Symptom: Subagent running > 30 min
Action:
  1. Kill subagent (KillShell)
  2. Check partial data in research folder
  3. If ≥ 50% data collected:
     - Continue with available data
     - Flag: "Data partielle - {product} incomplet"
  4. If < 50% data:
     - Ask user: "Subagent timeout. Retry ou continuer ?"
```

### Error 3: Cache Corruption
```
Symptom: Cache file exists but invalid JSON
Action:
  1. Delete corrupted cache file
  2. Log error in .claude/logs/cache_errors.log
  3. Fetch fresh data (as if cache miss)
```

### Error 4: Category Detection Failed
```
Symptom: Can't determine category from product context
Action:
  1. Ask user: "Catégorie du produit ?"
     - Options: electromenager, auto, sport, velo
  2. Use user-selected category
  3. Save category in orchestration_log for future reference
```

---

## Performance Optimizations

### Optimization 1: Aggressive Cache Usage
- Cache ALL intermediate results (not just final)
- Cache product validation (Google results, 24h TTL)
- Cache category detection (1 week TTL)

### Optimization 2: Subagent Context Isolation
- Each subagent only reads:
  - subagents/product-researcher.md
  - skills/{specific_skill}/SKILL.md (on-demand)
  - data/category_specs.yaml
  - data/research_{timestamp}/{product}/ (its own folder)
- Prevents context pollution, faster startup

### Optimization 3: Early Exit on Full Cache Hit
- If all 6 cache entries valid → Skip subagents entirely
- Direct to report-generator with cached data
- Duration: 3 min vs 20 min (6.6× faster)

---

## Metrics & Logging

### Metrics Collected
```json
{
  "duration_total_sec": 1080,
  "duration_validation_sec": 60,
  "duration_cache_check_sec": 30,
  "duration_subagents_sec": 900,
  "duration_aggregation_sec": 120,
  "duration_report_sec": 300,
  "cache_hit_rate": 0.5,  // 3/6 cache hits
  "data_completeness_avg": 92,  // %
  "sources_total": 18,  // 9 per product
  "cost_usd": 0  // No paid APIs
}
```

Saved to: `data/research_{timestamp}/metrics.json`

### Logging
- **orchestration_log.json**: Workflow steps, timings, errors
- **.claude/logs/orchestrator_{timestamp}.log**: Detailed execution log
- **metrics.json**: Performance metrics
