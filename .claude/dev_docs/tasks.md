# Tasks - Product Comparison System

**Updated**: 2025-11-16

## Active Tasks

### 🔴 High Priority (This Week)

- [ ] **Create templates/ directory** (30 min)
  - Add report_template.md with standardized sections
  - Include comparison_table_template.md
  - Add verdict_template.md for final recommendations

- [ ] **Enrich settings.json with guardrails** (15 min)
  - Add hook guardrails: infiniteLoopProtection, lockFile, timeout
  - Configure hook timeout: 30000ms
  - Add lockFile path: `.claude/.hook_lock`

- [ ] **Fix missing helpers/sources.yaml** (20 min)
  - Create reviews-aggregator/helpers/sources.yaml
  - List review sources: Amazon, Reddit, YouTube, manufacturer sites
  - Define scraping patterns and selectors

- [ ] **Upgrade post_collection.js** (45 min)
  - Detect structural changes (new skills, hooks modified, config changed)
  - Create signal file `.claude/dev_docs/doc_update_signal.json`
  - Trigger documentation-updater when needed

### 🟡 Medium Priority (This Month)

- [ ] **Test documentation-updater workflow** (30 min)
  - Create test skill, verify CLAUDE.md updated
  - Validate INDEX.md sync
  - Check manifest checksums

- [ ] **Add price history tracking** (2 hours)
  - Create pricing-history skill
  - Store historical prices in data/pricing_history/
  - Generate price trend charts

- [ ] **Implement image scraping** (3 hours)
  - Add image URLs to specs-collector
  - Download and cache product images
  - Include images in report generation

### 🟢 Low Priority (Nice to Have)

- [ ] **Create dashboard visualization** (1 day)
  - HTML/JS dashboard for comparison results
  - Interactive charts (price trends, rating comparisons)
  - Export to PDF functionality

- [ ] **Add export formats** (4 hours)
  - JSON export for API consumption
  - CSV export for spreadsheet analysis
  - PDF export with images and charts

- [ ] **API integrations** (2 days)
  - CamelCamelCamel for Amazon price history
  - PriceRunner API for multi-retailer pricing
  - Google Shopping API for broader coverage

## Completed Tasks

- [x] **Project initialization** (2025-11-10)
- [x] **5 core skills implemented** (2025-11-12)
- [x] **Progressive Disclosure setup** (2025-11-13)
- [x] **Subagent isolation configured** (2025-11-14)
- [x] **Documentation auto-updater added** (2025-11-16)
- [x] **Doc manifest created** (2025-11-16)
- [x] **Dev docs filled** (2025-11-16)

## Blocked Tasks

None currently

## Deferred Tasks

- [ ] Community features (user reviews, ratings) - Deferred to Q2 2025
- [ ] Monetization setup (affiliate links) - Deferred to Q2 2025
