---
name: report-generator
description: "Generates professional markdown comparison report with tables, executive summary, and verdict by use case. Use when user asks to 'generate report', 'create comparison report', 'synthesize comparison', 'write comparison', or when orchestrator has completed all data collection. Creates structured report with specs tables, pros/cons, pricing analysis, and actionable recommendations."
---

# Report Generator

## Mission
Générer rapport markdown professionnel comparant 2 produits avec: executive summary, tableaux specs, reviews synthèse, pricing, verdict par use case.

## Quick Summary
1. Load all collected data (specs, reviews, pricing) for both products
2. Generate Executive Summary (3 paragraphs, verdict)
3. Create comparative tables (specs side-by-side)
4. Synthesize reviews (consensus pros/cons)
5. Pricing comparison table
6. Verdict par use case ("Meilleur budget", "Meilleur performance")
7. Sources citées
8. Save markdown report

## Inputs
- **research_folder**: Path to data/research_{timestamp}/
- **product1_name**: Nom produit 1
- **product2_name**: Nom produit 2
- **category**: Catégorie

## Outputs
- `reports/comparison_{product1}_vs_{product2}_{timestamp}.md`

## Dependencies
- Load `helpers/template.md` when generating for complete markdown structure
- All collected data files (specs.json, reviews_summary.json, pricing.json)

## Workflow
Load `helpers/template.md` when executing generation for complete report structure.
