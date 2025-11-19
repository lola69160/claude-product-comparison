# Context - Product Comparison System

**Last Updated**: 2025-11-16

## Just Completed
- [x] Project setup and structure initialization
- [x] 5 core skills implemented (specs-collector, reviews-aggregator, pricing-tracker, report-generator, orchestrator)
- [x] Subagent isolation for parallel product research
- [x] Progressive Disclosure configuration (skill-rules.json)
- [x] Documentation auto-updater skill added (2025-11-16)
- [x] Doc manifest tracking system created

## Working On
- System conformity update to _master standards
- Templates directory creation for standardized reports
- Dev docs completion (context, plan, tasks)

## Key Decisions

### Architecture
- **Orchestration Pattern**: product-research-orchestrator coordinates 4 data collection skills
- **Parallel Subagents**: Maximum 2 concurrent subagents for comparing 2 products simultaneously
- **Cache Strategy**: 7-day TTL for specs/reviews/pricing to minimize redundant API calls
- **Data Isolation**: Each product gets isolated directory `data/research_{timestamp}/{product_name}/`

### Performance Targets
- **Research Duration**: < 5 min per product (specs + reviews + pricing)
- **Report Generation**: < 2 min (synthesis + markdown formatting)
- **Total Workflow**: < 12 min for complete 2-product comparison

### Progressive Disclosure
- **SKILL.md Size**: All skills < 200 words (target 150-180)
- **Helpers Externalized**: workflows, scraping patterns, templates in helpers/
- **Load Strategy**: eager for orchestrator, on_demand for data collectors
- **Context Baseline**: ~1,200 words total (6 skills × 200 words avg)

### Hook System
- **pre_research.js**: Validates product names, checks cache, prepares directories
- **post_collection.js**: Validates data quality (specs complete, reviews >= 10, pricing available)
- **Guardrails**: Need to add infiniteLoopProtection, lockFile, timeout config

## Open Questions
- [ ] Should we add image scraping for product visuals?
- [ ] Integrate price history tracking (vs current price only)?
- [ ] Add affiliate link generation in reports?

## Technical Debt
- [ ] reviews-aggregator references missing helpers/sources.yaml (need to create)
- [ ] templates/ directory missing (report templates inline in skill)
- [ ] settings.json lacks guardrails configuration
- [ ] post_collection.js should detect structural changes (upgrade to post_tool_use pattern)

## Dependencies
- WebSearch for manufacturer sites, review sites
- WebFetch for Amazon, Reddit, manufacturer pages
- MCP servers: None currently (future: price APIs, affiliate programs)

## Metrics to Track
- **Success Rate**: % comparisons completed without errors
- **Data Quality**: % products with complete specs + reviews + pricing
- **Cache Hit Rate**: % requests served from cache (target > 50%)
- **User Satisfaction**: Subjective report quality (collect feedback)