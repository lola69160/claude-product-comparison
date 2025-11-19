# Specs Scraping Patterns

## Outils de Scraping

### Priorité 1: MCP Apify (Recommandé)
| Outil | Usage |
|-------|-------|
| `mcp__apify__apify-slash-rag-web-browser` | Recherche + scraping sites manufacturer/experts (Markdown output) |
| `mcp__apify__call-actor` avec `apify/amazon-product-scraper` | Scraping Amazon structuré (JSON) |

### Priorité 2: Fallback
| Outil | Usage |
|-------|-------|
| `WebFetch` | Si MCP échoue ou timeout (>2 min) |

**Avantages MCP Apify**:
- Amazon: JSON structuré (pas de parsing HTML), contourne anti-bot
- RAG Browser: Recherche Google + scrape top résultats, output Markdown facile à parser
- Meilleure fiabilité sur sites protégés

---

## Workflow Complet

### Phase 1: Cache Check (si enabled)
```javascript
1. Generate cache_key = MD5(product_name + "specs")
2. Read data/cache/specs/{cache_key}.json
3. If exists AND (now - cached_at) < 604800 (7 days):
   → Return cached data (SKIP scraping)
4. Else:
   → Continue to Phase 2
```

---

### Phase 2: Detect Category & Load Required Specs
```javascript
1. If category provided:
   → Use provided category
2. Else auto-detect from product name:
   - "aspirateur", "V15", "Dyson" → electromenager
   - "Peugeot", "208", "voiture" → auto
   - "chaussure", "running" → sport
   - "vélo", "VTT", "route", "Riverside" → velo

3. Load required specs from category_specs.yaml:
   required_specs = category_specs[category].required_specs

Example for velo:
required_specs = [
  "type_velo",
  "taille_cadre_cm",
  "poids_kg",
  "nb_vitesses",
  "freins",
  "materiau_cadre",
  "suspension",
  "prix",
  "roues_pouces"
]
```

---

### Phase 3: Scrape from 3 Sources

> **Note**: Utiliser MCP Apify comme outil principal, WebFetch en fallback.

#### Source 1: Manufacturer Website
```javascript
1. Detect manufacturer from product name:
   - "Dyson V15" → manufacturer = "Dyson"
   - "Décathlon Riverside" → manufacturer = "Décathlon"
   - "Peugeot 208" → manufacturer = "Peugeot"

2. Build search query:
   query = "{product_name} specifications site:{manufacturer_domain}"
   Example: "Dyson V15 Detect specifications site:dyson.fr"

3. **PRIMARY: MCP Apify RAG Web Browser**
   mcp__apify__apify-slash-rag-web-browser({
     query: query,
     maxResults: 2,
     outputFormats: ["markdown"]
   })
   → Returns Markdown content from top results (easier to parse)

4. Parse Markdown for specs:
   "Extract ALL technical specifications from this content.
    Return as JSON with key-value pairs.
    Look for sections like: Specifications, Technical Details, Features, Caractéristiques."

5. **FALLBACK: WebFetch** (if MCP fails/timeout)
   WebFetch Google search → Get official product page URL
   WebFetch product page with same prompt

6. Parse result into structured JSON:
   {
     "puissance_W": 230,
     "capacite_L": 0.76,
     "niveau_bruit_dB": 82,
     ...
   }
```

**Common patterns per category**:

**Électroménager** (Dyson, Shark, etc.):
- Specs table: `<table class="specs">` or `<div class="specifications">`
- Look for: Puissance, Capacité, Bruit, Poids, Dimensions

**Auto** (manufacturer sites):
- Specs sections: "Fiche technique", "Caractéristiques", "Motorisations"
- Look for: Motorisation, Puissance, Consommation, Dimensions

**Sport** (Decathlon, etc.):
- Product details: "Composition", "Poids", "Taille"
- Look for: Matériaux, Poids, Certifications

**Vélo** (Decathlon, manufacturer sites):
- Specs table: "Caractéristiques techniques"
- Look for: Type, Taille cadre, Poids, Vitesses, Freins, Matériau, Suspension, Roues

---

#### Source 2: Amazon
```javascript
1. Build Amazon search:
   If amazon_url provided:
     → Extract ASIN from URL
   Else:
     → Use product name for search

2. **PRIMARY: MCP Apify Amazon Product Scraper**
   // Step 1: Get actor info (required first)
   mcp__apify__call-actor({
     actor: "apify/amazon-product-scraper",
     step: "info"
   })

   // Step 2: Call actor with input
   mcp__apify__call-actor({
     actor: "apify/amazon-product-scraper",
     step: "call",
     input: {
       categoryOrProductUrls: [amazon_url] OR search: product_name,
       maxItems: 1,
       extractorConfig: {
         getSpecifications: true,
         getDescription: true
       }
     }
   })

   // Step 3: Get output
   mcp__apify__get-actor-output({
     datasetId: result.datasetId,
     fields: "title,price,specifications,description"
   })
   → Returns JSON structuré (pas de parsing HTML!)

3. **FALLBACK: WebFetch** (if MCP fails)
   WebFetch Amazon page with prompt:
   "Extract technical specifications from this Amazon product page.
    Look for sections:
    - Technical Details
    - Product Information
    - Additional Information
    Return as JSON key-value pairs."

4. Parse Amazon's structured data:
   - MCP: Already JSON structured (specifications field)
   - WebFetch: Parse <table id="productDetails">
   - Key-value format: "Brand", "Model", "Power", "Weight", etc.

5. Normalize keys to match required_specs:
   Amazon: "Brand" → manufacturer
   Amazon: "Item Weight" → poids_kg
   Amazon: "Power" → puissance_W
```

**Amazon scraping notes**:
- **MCP Actor (preferred)**: Returns clean JSON, handles anti-bot, includes specifications field
- **WebFetch (fallback)**: May be blocked by Amazon, requires HTML parsing
- Technical Details table = most reliable field
- Customer Q&A sometimes has missing specs (optional secondary source)

---

#### Source 3: Review Site
```javascript
1. Select review site based on category:
   electromenager → wirecutter.com, lesnumeriques.com
   auto → caradisiac.com, largus.fr
   sport → outdoor-mag.fr
   velo → velo-vert.com, citycle.com

2. Build search:
   query = "{product_name} test fiche technique site:{review_site}"
   Example: "Décathlon Riverside 500 test fiche technique site:velo-vert.com"

3. **PRIMARY: MCP Apify RAG Web Browser**
   mcp__apify__apify-slash-rag-web-browser({
     query: query,
     maxResults: 2,
     outputFormats: ["markdown"]
   })
   → Returns review article content as Markdown

4. Parse Markdown for specs:
   "Extract technical specifications from this product review.
    Reviews often have a specs table or 'Fiche technique' section.
    Return as JSON key-value pairs."

5. **FALLBACK: WebFetch** (if MCP fails)
   WebFetch Google → Get review article URL
   WebFetch review article with same extraction prompt

6. Parse specs table:
   - Review sites often have standardized specs tables
   - More reliable than manufacturer (neutral, comprehensive)
   - May include tested values (vs claimed by manufacturer)
```

**Review site patterns**:

**velo-vert.com, citycle.com**:
- Section: "Fiche technique"
- Table with: Cadre, Fourche, Transmission, Freins, Roues, Poids, Prix

**lesnumeriques.com, wirecutter.com**:
- Section: "Caractéristiques"
- Comparative table (if multiple products reviewed)

**caradisiac.com, largus.fr**:
- Section: "Fiche technique détaillée"
- Complete specs with tested consumption, real-world performance

---

### Phase 4: Merge & Normalize

```javascript
1. Collect all specs from 3 sources:
   specs_manufacturer = { /* source 1 */ }
   specs_amazon = { /* source 2 */ }
   specs_review = { /* source 3 */ }

2. Merge strategy (priority order):
   For each required_spec:
     a. Check specs_review (most reliable, tested)
     b. If missing, check specs_manufacturer (official)
     c. If missing, check specs_amazon (structured)
     d. If still missing → null

3. Normalize values:
   - Units: "1.2 kg" → 1.2, "230W" → 230
   - Formats: "5 vitesses" → 5, "Shimano 105" → "Shimano 105"
   - Booleans: "Oui"/"Yes" → true, "Non"/"No" → false

4. Deduplicate:
   - If same key from multiple sources with different values:
     → Prefer specs_review (tested)
     → Flag discrepancy in specs_log.json

Result:
{
  "type_velo": "VTT",
  "taille_cadre_cm": 48,
  "poids_kg": 13.2,
  "nb_vitesses": 21,
  "freins": "Hydraulique",
  "materiau_cadre": "Aluminium",
  "suspension": "Avant",
  "prix": 549,
  "roues_pouces": 27.5,

  "_metadata": {
    "sources": {
      "type_velo": "review_site",
      "poids_kg": "review_site",
      "prix": "manufacturer",
      ...
    }
  }
}
```

---

### Phase 5: Validate Completeness

```javascript
1. Check required_specs coverage:
   collected_count = count(specs with non-null values)
   required_count = length(required_specs)
   completeness_pct = (collected_count / required_count) * 100

2. Grade completeness:
   - 100%: Perfect ✅
   - 90-99%: Excellent ✅
   - 70-89%: Good ⚠️ (flag warning)
   - < 70%: Poor ❌ (flag error, manual review needed)

3. Identify missing specs:
   missing_specs = required_specs - collected_specs
   Example: ["suspension", "roues_pouces"]

4. Create specs_log.json:
{
  "product": "Décathlon Riverside 500",
  "category": "velo",
  "timestamp": "2025-01-15T14:35:00Z",
  "sources_attempted": 3,
  "sources_successful": 2,  // manufacturer, review (Amazon failed)
  "completeness_pct": 88.9,  // 8/9 specs
  "missing_specs": ["roues_pouces"],
  "discrepancies": [
    {
      "field": "poids_kg",
      "manufacturer": 13.5,
      "review": 13.2,
      "used": 13.2  // review preferred
    }
  ],
  "errors": [
    {
      "source": "amazon",
      "error": "Product page not found (404)"
    }
  ]
}
```

---

### Phase 6: Save & Cache

```javascript
1. Save specs to research folder:
   Write: data/research_{timestamp}/{product}/specs.json
   Content: {merged and normalized specs}

2. Save log:
   Write: data/research_{timestamp}/{product}/specs_log.json

3. Update cache (7 days TTL):
   cache_entry = {
     "cache_key": MD5(product_name + "specs"),
     "product": product_name,
     "type": "specs",
     "cached_at": now,
     "ttl": 604800,  // 7 days in seconds
     "source_urls": [
       manufacturer_url,
       amazon_url,
       review_url
     ],
     "data": {merged specs}
   }

   Write: data/cache/specs/{cache_key}.json

4. Return to caller:
   {
     "success": true,
     "completeness_pct": 88.9,
     "specs_file": "data/research_{timestamp}/{product}/specs.json",
     "cache_updated": true
   }
```

---

## Error Handling

### Error: Source Unreachable
```
Scenario: WebFetch returns 404, timeout, or captcha block
Action:
  1. Log error in specs_log.json
  2. Continue with other sources (don't fail entire skill)
  3. If ALL 3 sources fail:
     → Return error: "Unable to collect specs - all sources unreachable"
     → Suggest manual input
```

### Error: Parsing Failed
```
Scenario: WebFetch returns HTML but can't extract specs
Action:
  1. Save raw HTML to data/research_{timestamp}/{product}/specs_raw.html
  2. Log error: "Parsing failed for {source}"
  3. Attempt simpler extraction:
     - Look for ANY table on page
     - Extract ALL text, search for keywords (poids, power, etc.)
  4. If still fails:
     → Continue with other sources
```

### Error: Low Completeness (< 70%)
```
Scenario: Only 5/9 required specs collected
Action:
  1. Flag warning in specs_log.json:
     "warning": "Low completeness (55.6%). Manual review recommended."
  2. Ask user:
     "Seulement 55% des specs collectées.
      Manquant: [suspension, roues_pouces, ...]
      Voulez-vous:
      a) Continuer avec données partielles
      b) Fournir specs manquantes manuellement
      c) Annuler recherche pour ce produit"
  3. If user provides manual specs:
     → Merge into specs.json
     → Mark source = "manual" in metadata
```

---

## Performance Optimizations

### Optimization 1: Parallel Source Scraping
```javascript
Instead of sequential (source1 → source2 → source3):

Launch 3 WebFetch calls IN PARALLEL:
  WebFetch(manufacturer_url, ...)
  WebFetch(amazon_url, ...)
  WebFetch(review_url, ...)

Wait for all to complete (or timeout after 4 min)
→ Speedup: 5 min → 2 min (3 sources in parallel)
```

### Optimization 2: Smart Cache Invalidation
```javascript
Instead of fixed 7-day TTL:

If product is NEW (< 6 months old):
  → TTL = 1 day (specs may update frequently)
If product is MATURE (> 1 year old):
  → TTL = 30 days (specs stable)

Detect age from manufacturer_url or Amazon listing date
```

### Optimization 3: Incremental Updates
```javascript
If cache exists but expired:
  1. Load cached specs
  2. Only re-fetch from sources that had low confidence
  3. Merge new data with cached data
  4. Update cache

→ Faster than full re-fetch
```

---

## Example: Complete Run (Vélo)

**Input**:
- product_name = "Décathlon Riverside 500"
- category = "velo"

**Execution**:

1. **Cache check**: Miss (no cache)

2. **Load required specs**:
   - type_velo, taille_cadre_cm, poids_kg, nb_vitesses, freins, materiau_cadre, suspension, prix, roues_pouces

3. **Scrape source 1** (Decathlon.fr):
   - URL: https://decathlon.fr/p/riverside-500...
   - Extracted: type_velo=VTT, taille_cadre_cm=48, poids_kg=13.5, prix=549, ...
   - Success: 7/9 specs

4. **Scrape source 2** (Amazon):
   - Search: "site:amazon.fr Décathlon Riverside 500"
   - Result: Product not found (404)
   - Success: 0/9 specs

5. **Scrape source 3** (velo-vert.com):
   - Search: "site:velo-vert.com Riverside 500 test"
   - URL: https://velo-vert.com/test/riverside-500
   - Extracted: ALL 9 specs (complete fiche technique)
   - Success: 9/9 specs ✅

6. **Merge**:
   - Use velo-vert.com as primary (complete)
   - Fill gaps with Decathlon.fr
   - Flag discrepancy: poids_kg (Decathlon=13.5, velo-vert=13.2)
   - Result: 9/9 specs (100% complete)

7. **Save**:
   - data/research_20250115/Riverside_500/specs.json
   - data/research_20250115/Riverside_500/specs_log.json
   - data/cache/specs/abc123.json (7-day TTL)

8. **Return**:
   ```json
   {
     "success": true,
     "completeness_pct": 100,
     "duration_sec": 120,
     "cache_updated": true
   }
   ```

**Duration**: ~2 min (3 sources scraped in parallel)
