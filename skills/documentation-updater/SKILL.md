---
metadata:
  name: documentation-updater
  description: "Met à jour automatiquement CLAUDE.md et INDEX.md quand modifications structurelles détectées"
  patterns:
    - "update.*documentation"
    - "refresh.*claude.*md"
    - "sync.*index.*md"
    - "doc.*auto.*update"
  category: "maintenance"
  version: 1.0
  timeout: 120000
  dependencies:
    - "project CLAUDE.md"
    - "project INDEX.md"
  creates_files:
    - "CLAUDE.md (updated)"
    - "INDEX.md (updated)"
  estimated_duration: "1-2 min"
---

# Documentation Auto-Updater

**Mission**: Détecter modifications structurelles (skills, hooks, config) et mettre à jour CLAUDE.md + INDEX.md automatiquement.

**Workflow**: Load `helpers/workflow.md` for detailed step-by-step instructions.

## Quick Start

### Déclenchement Manuel
```
claude "update documentation"
```

### Déclenchement Automatique (Hook)
Configuré via `.claude/hooks/post_tool_use.js` pour détecter :
- Nouveaux skills créés
- Skills modifiés (SKILL.md, helpers/)
- Hooks ajoutés/modifiés
- Configuration changée (settings.json, skill-rules.json)
- Templates ajoutés

## Changements Détectés

Le skill analyse et met à jour automatiquement :

### CLAUDE.md
- **Repository Structure** : Ajout/suppression skills, hooks, config files
- **Key Guidelines** : Si nouvelles best practices émergent
- **Performance Metrics** : Si benchmarks mis à jour
- **Architecture** : Nouvelles sections techniques (v2.0, v3.0, etc.)
- **Version History** : Ajout versions avec dates

### INDEX.md
- **Quick Links** : Nouveaux skills, workflows, registries
- **Navigation** : Sections skills avec métadonnées actualisées
- **Structure** : helpers/, subagents/, nouvelles dépendances
- **Métriques** : Context efficiency, success rates, durations
- **Architecture** : Progressive Disclosure, nouvelles patterns

## Output

```
📝 Documentation updated:
   - CLAUDE.md: 3 sections modifiées (Repository Structure, Architecture, Version History)
   - INDEX.md: 2 sections modifiées (Quick Links, Navigation skill X)

✅ Changes detected:
   - New skill: skills/new-skill/ added
   - Modified: skills/existing-skill/SKILL.md (reduced 700 → 180 mots)
   - New config: .claude/skill-rules.json created
```

## Configuration

Le skill utilise un manifest de tracking dans `.claude/dev_docs/doc_manifest.json` :
```json
{
  "last_update": "2025-11-15T14:30:00Z",
  "tracked_files": {
    "skills": ["veille-scraping", "veille-synthesizer", "linkedin-post-generator"],
    "hooks": ["pre_prompt.js", "post_generation.js"],
    "config": ["settings.json", "skill-rules.json"]
  },
  "checksums": {
    "skills/veille-scraping/SKILL.md": "abc123...",
    "CLAUDE.md": "def456..."
  }
}
```

## Anti-Patterns
- ❌ **Ne jamais** modifier CLAUDE.md/INDEX.md sans backup (git commit avant)
- ❌ **Ne jamais** auto-update sans validation user si changements > 10 lignes
- ❌ **Ne jamais** supprimer sections sans confirmation
- ✅ **Toujours** générer diff preview avant application
- ✅ **Toujours** logger changements dans CHANGELOG.md

Voir `helpers/workflow.md` pour workflow complet avec exemples de détection et update patterns.
