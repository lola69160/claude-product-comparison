# Reviews Aggregation & Sentiment Analysis

## Outils de Scraping

### Priorité 1: MCP Apify (Recommandé)
| Outil | Usage |
|-------|-------|
| `mcp__apify__call-actor` avec `apify/amazon-reviews-scraper` | Reviews Amazon structurés (rating, text, verified) |
| `mcp__apify__call-actor` avec `apify/reddit-scraper` | Posts/comments Reddit avec upvotes |
| `mcp__apify__apify-slash-rag-web-browser` | Reviews experts (sites spécialisés) |

### Priorité 2: Fallback
| Outil | Usage |
|-------|-------|
| `WebFetch` | Si MCP échoue ou timeout (>2 min) |

**Avantages MCP Apify**:
- Amazon Reviews: JSON structuré, tous les champs (rating, verified, helpful), contourne anti-bot
- Reddit: Posts complets avec upvotes, comments thread
- Meilleure couverture des données

---

## Workflow

### Phase 1: Collect User Reviews

#### Source 1: Amazon Reviews
```javascript
1. Get Amazon product URL or ASIN

2. **PRIMARY: MCP Apify Amazon Reviews Scraper**
   // Step 1: Get actor info
   mcp__apify__call-actor({
     actor: "apify/amazon-reviews-scraper",
     step: "info"
   })

   // Step 2: Call actor
   mcp__apify__call-actor({
     actor: "apify/amazon-reviews-scraper",
     step: "call",
     input: {
       productUrls: [amazon_url],
       maxReviews: 50,
       sort: "helpful"  // Most helpful first
     }
   })

   // Step 3: Get output
   mcp__apify__get-actor-output({
     datasetId: result.datasetId,
     fields: "rating,title,text,isVerified,helpfulVotes,date"
   })
   → Returns JSON array with all review fields

3. **FALLBACK: WebFetch** (if MCP fails)
   WebFetch Amazon product page
   Extract reviews section with prompt:
   "Extract product reviews with: rating (1-5 stars), review title,
    review text, verified purchase status, helpfulness votes.
    Return first 20 most helpful reviews as JSON array."

4. Parse reviews:
   {
     "source": "amazon",
     "total_reviews": 1250,
     "avg_rating": 4.3,
     "reviews": [
       {
         "rating": 5,
         "title": "Excellent produit",
         "text": "Très satisfait, puissant et silencieux...",
         "verified": true,
         "helpful_votes": 145
       },
       ...
     ]
   }
```

**Note**: MCP Actor retourne plus de reviews (50 vs 20) et données plus complètes

#### Source 2: Reddit Mentions
```javascript
1. Identify relevant subreddits:
   velo → r/bicycling, r/whichbike, r/cycling
   electromenager → r/BuyItForLife, r/homeimprovement
   auto → r/cars, r/whatcarshouldibuy
   sport → r/running, r/fitness

2. **PRIMARY: MCP Apify Reddit Scraper**
   // Step 1: Get actor info
   mcp__apify__call-actor({
     actor: "apify/reddit-scraper",
     step: "info"
   })

   // Step 2: Call actor
   mcp__apify__call-actor({
     actor: "apify/reddit-scraper",
     step: "call",
     input: {
       searches: [
         {
           term: product_name,
           sort: "relevance",
           time: "year"
         }
       ],
       maxItems: 30,
       includeComments: true,
       maxComments: 10
     }
   })

   // Step 3: Get output
   mcp__apify__get-actor-output({
     datasetId: result.datasetId,
     fields: "title,body,subreddit,score,numComments,url,comments"
   })
   → Returns posts + comments with upvotes

3. **FALLBACK: WebFetch** (if MCP fails)
   WebFetch Google: "site:reddit.com {product_name}"
   Extract mentions with prompt:
   "Extract Reddit discussions about this product.
    For each post/comment: subreddit, upvotes, user opinion (positive/negative),
    main points mentioned. Return as JSON array."

4. Parse mentions:
   {
     "source": "reddit",
     "mentions_count": 15,
     "avg_sentiment": "positive",  // positive, neutral, negative
     "discussions": [
       {
         "subreddit": "r/bicycling",
         "upvotes": 23,
         "sentiment": "positive",
         "text": "Great value for money, very solid build"
       },
       ...
     ]
   }
```

**Note**: MCP Actor inclut les comments (plus de context) et tous les upvotes

---

### Phase 2: Collect Expert Reviews

```javascript
1. Load review sites from category_specs.yaml:
   review_sites = category_specs[category].review_sites
   Example for velo: ["velo-vert.com", "citycle.com", "lecyclo.com"]

2. For each review site (limit 3):

   **PRIMARY: MCP Apify RAG Web Browser**
   query = "{product_name} test avis site:{review_site}"

   mcp__apify__apify-slash-rag-web-browser({
     query: query,
     maxResults: 1,
     outputFormats: ["markdown"]
   })
   → Returns review article as Markdown

   Parse Markdown with prompt:
   "Extract product review from this article:
    - Overall rating (if numeric)
    - Pros (bullet points)
    - Cons (bullet points)
    - Verdict/conclusion
    - Recommendation (yes/no/conditional)
    Return as JSON."

   **FALLBACK: WebFetch** (if MCP fails)
   a. WebFetch Google: "site:{review_site} {product_name} test avis"
   b. Get review article URL
   c. WebFetch article with same extraction prompt

3. Aggregate expert reviews:
   {
     "source": "expert",
     "reviews_count": 3,
     "reviews": [
       {
         "site": "velo-vert.com",
         "rating": 8.5,
         "pros": ["Excellent rapport qualité/prix", "Robuste", "Confortable"],
         "cons": ["Transmission basique", "Poids un peu élevé"],
         "verdict": "Très bon vélo pour débuter le VTT",
         "recommended": true
       },
       {
         "site": "citycle.com",
         "rating": null,  // No numeric rating
         "pros": ["Polyvalent", "Bonne géométrie"],
         "cons": ["Freins à améliorer"],
         "verdict": "Bon choix pour loisir",
         "recommended": true
       },
       ...
     ]
   }
```

---

### Phase 3: Sentiment Analysis

```javascript
1. Analyze Amazon reviews sentiment:
   - Count 5-star: X, 4-star: Y, 3-star: Z, 2-star: A, 1-star: B
   - Sentiment score = (5*X + 4*Y + 3*Z + 2*A + 1*B) / total_reviews
   - Distribution: {5: X%, 4: Y%, ...}

2. Extract common themes from review texts:
   - Positive keywords: "excellent", "powerful", "quiet", "durable"
   - Negative keywords: "broke", "expensive", "heavy", "noisy"
   - Frequency analysis → Top 5 pros, Top 5 cons

3. Reddit sentiment:
   - Count positive/neutral/negative mentions
   - Extract recurring points:
     Positive: "great value", "solid build"
     Negative: "battery life", "heavy"

4. Expert consensus:
   - Count recommended vs not recommended
   - Aggregate pros (merge similar points):
     ["Excellent rapport qualité/prix" + "Great value"] → "Value for money"
   - Aggregate cons similarly
```

---

### Phase 4: Synthesis

```javascript
1. Merge all sources into unified pros/cons:

PROS (consolidated):
   - "Excellent rapport qualité/prix" (expert:3, amazon:45, reddit:8)
   - "Robuste et durable" (expert:2, amazon:32, reddit:5)
   - "Confortable" (expert:1, amazon:28, reddit:3)
   - ...

CONS (consolidated):
   - "Poids un peu élevé" (expert:2, amazon:15, reddit:4)
   - "Freins basiques" (expert:2, amazon:8, reddit:2)
   - ...

2. Calculate overall sentiment:
   - Amazon: 4.3/5 (1250 reviews)
   - Reddit: 85% positive (15 mentions)
   - Expert: 100% recommended (3/3 sites)
   - OVERALL: "Very Positive ✅"

3. Generate consensus summary (2-3 sentences):
   "Le {product} reçoit des avis très positifs sur tous les fronts.
    Les utilisateurs et experts s'accordent sur son excellent rapport qualité/prix
    et sa robustesse. Seul bémol récurrent: le poids un peu élevé pour sa catégorie."

4. Create reviews_summary.json:
{
  "product": "Décathlon Riverside 500",
  "category": "velo",
  "timestamp": "2025-01-15T14:40:00Z",

  "overall_sentiment": "very_positive",
  "overall_score": 4.2,  // 0-5 scale

  "sources": {
    "amazon": {
      "total_reviews": 1250,
      "avg_rating": 4.3,
      "verified_purchases_pct": 85,
      "sentiment_distribution": {
        "5_star": 65,
        "4_star": 20,
        "3_star": 8,
        "2_star": 4,
        "1_star": 3
      }
    },
    "reddit": {
      "mentions": 15,
      "sentiment": {
        "positive": 85,
        "neutral": 10,
        "negative": 5
      }
    },
    "expert": {
      "reviews_count": 3,
      "avg_rating": 8.5,
      "recommended_pct": 100
    }
  },

  "pros": [
    {
      "point": "Excellent rapport qualité/prix",
      "mentions": {"expert": 3, "amazon": 45, "reddit": 8},
      "total_mentions": 56
    },
    {
      "point": "Robuste et durable",
      "mentions": {"expert": 2, "amazon": 32, "reddit": 5},
      "total_mentions": 39
    },
    ...
  ],

  "cons": [
    {
      "point": "Poids un peu élevé",
      "mentions": {"expert": 2, "amazon": 15, "reddit": 4},
      "total_mentions": 21
    },
    ...
  ],

  "consensus": "Le Décathlon Riverside 500 reçoit des avis très positifs. Excellent rapport qualité/prix et robustesse selon tous. Poids un peu élevé."
}
```

---

### Phase 5: Save & Cache

```javascript
1. Save detailed reviews:
   - data/research_{timestamp}/{product}/reviews_user.json (Amazon + Reddit raw)
   - data/research_{timestamp}/{product}/reviews_expert.json (Expert reviews raw)

2. Save summary:
   - data/research_{timestamp}/{product}/reviews_summary.json

3. Cache summary (7 days):
   - data/cache/reviews/{cache_key}.json

4. Return:
   {
     "success": true,
     "overall_sentiment": "very_positive",
     "overall_score": 4.2,
     "sources_collected": 3,
     "total_reviews_analyzed": 1268
   }
```

---

## Sentiment Scoring Algorithm

```javascript
function calculateOverallScore(amazon, reddit, expert):
  // Weighted average (Amazon 50%, Expert 30%, Reddit 20%)
  amazon_score = amazon.avg_rating  // 0-5 scale
  reddit_score = (reddit.positive_pct / 100) * 5  // Convert % to 0-5
  expert_score = (expert.avg_rating / 10) * 5  // Convert 0-10 to 0-5

  overall = (amazon_score * 0.5) + (expert_score * 0.3) + (reddit_score * 0.2)

  return overall  // 0-5 scale

Sentiment classification:
  4.5-5.0 → "Exceptional ✅✅"
  4.0-4.4 → "Very Positive ✅"
  3.5-3.9 → "Positive ⭐"
  3.0-3.4 → "Mixed ⚠️"
  2.5-2.9 → "Negative ❌"
  0-2.4 → "Very Negative ❌❌"
```

---

## Error Handling

### Low Review Count
```
If Amazon reviews < 10 AND Reddit mentions < 5:
  → Flag: "Insufficient user reviews for reliable analysis"
  → Rely more on expert reviews (increase weight to 50%)
```

### No Expert Reviews Found
```
If expert reviews count = 0:
  → Continue with user reviews only
  → Flag: "No expert reviews found - user opinions only"
  → Overall score = Amazon (70%) + Reddit (30%)
```

### Contradictory Sentiment
```
If Amazon=positive BUT expert=negative (or vice versa):
  → Flag: "Contradictory reviews - check sources manually"
  → Highlight discrepancy in summary:
    "Note: Avis utilisateurs positifs (4.3/5) mais experts mitigés (6/10)"
```
