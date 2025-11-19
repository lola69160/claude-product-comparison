# Documentation Auto-Updater - Workflow Détaillé

**Version**: 1.0
**Loaded when**: Skill activated via pattern match OR hook PostToolUse

---

## CRITICAL: Execute this workflow step-by-step

### Step 0: Détection Changements (Trigger)

**Déclenchement** :
1. **Manuel** : User exécute `claude "update documentation"`
2. **Automatique** : Hook PostToolUse détecte modifications structurelles

**Changements trackés** :
```javascript
// Dans .claude/hooks/post_tool_use.js
const STRUCTURAL_CHANGES = {
  skills: {
    created: /skills\/[^\/]+\/SKILL\.md created/,
    modified: /skills\/[^\/]+\/(SKILL|workflow)\.md (updated|edited)/,
    deleted: /skills\/[^\/]+\/ deleted/
  },
  hooks: {
    created: /hooks\/[^\/]+\.js created/,
    modified: /hooks\/[^\/]+\.js (updated|edited)/
  },
  config: {
    settings: /\.claude\/settings\.json (created|updated)/,
    skillRules: /\.claude\/skill-rules\.json (created|updated)/
  },
  templates: {
    created: /templates\/[^\/]+\.md created/
  }
};
```

### Step 1: Scanner État Actuel vs Manifest

**ACTION REQUIRED** : Lire `.claude/dev_docs/doc_manifest.json` (ou créer si n'existe pas)

**Comparer avec état actuel** :
```bash
# Lister tous les fichiers trackés
find skills/ -name "SKILL.md" -o -name "workflow.md"
find hooks/ -name "*.js"
find .claude/ -name "settings.json" -o -name "skill-rules.json"
find templates/ -name "*.md"
```

**Calculer checksums** (pour détecter modifications) :
```javascript
const crypto = require('crypto');
const fs = require('fs');

function getChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

// Comparer checksums manifest vs actuel
manifest.checksums['skills/X/SKILL.md'] !== getChecksum('skills/X/SKILL.md')
```

### Step 2: Identifier Changements Spécifiques

**Output Step 1 → Input Step 2** :
```json
{
  "changes": [
    {
      "type": "skill_created",
      "path": "skills/documentation-updater/SKILL.md",
      "impact": ["CLAUDE.md:Repository Structure", "INDEX.md:Navigation"]
    },
    {
      "type": "skill_modified",
      "path": "skills/veille-scraping/SKILL.md",
      "before": "745 words",
      "after": "150 words",
      "impact": ["INDEX.md:Section 1 Veille & Scraping"]
    },
    {
      "type": "config_created",
      "path": ".claude/skill-rules.json",
      "impact": ["CLAUDE.md:Architecture v2.0", "INDEX.md:Quick Links"]
    }
  ]
}
```

**Règles de mapping Changes → Sections à updater** :

| Change Type | CLAUDE.md Sections | INDEX.md Sections |
|-------------|-------------------|-------------------|
| `skill_created` | Repository Structure, Skills list | Quick Links, Navigation Département |
| `skill_modified` | Repository Structure (si structure change) | Navigation Département (metadata) |
| `hook_created` | Repository Structure, Hooks list | Section 5 Système & Config |
| `config_created` | Repository Structure, Architecture | Quick Links, Section 5 Config |
| `template_created` | Repository Structure | Section 4 Archives & Templates |

### Step 2.5: Valider Format SKILL.md (CRITIQUE)

**ACTION REQUIRED** : Pour chaque SKILL.md détecté (nouveau ou modifié), valider le format

**Validation YAML Frontmatter** :
```javascript
function validateSkillFormat(skillPath) {
  const content = fs.readFileSync(skillPath, 'utf8');

  // Check 1: YAML frontmatter présent
  const hasYAMLFrontmatter = /^---\s*\n[\s\S]+?\n---\s*\n/.test(content);

  // Check 2: Markdown headers utilisés (INCORRECT)
  const hasMarkdownMetadata = /^## Metadata/m.test(content);

  // Check 3: Références helpers impératives (INCORRECT)
  const hasImperativeHelperRefs = /Voir `helpers\/|Utiliser `helpers\/|Lire `helpers\//i.test(content);

  // Check 4: Word count
  const wordCount = content.split(/\s+/).length;

  return {
    valid: hasYAMLFrontmatter && !hasMarkdownMetadata && !hasImperativeHelperRefs && wordCount < 500,
    issues: {
      missingYAML: !hasYAMLFrontmatter,
      markdownHeaders: hasMarkdownMetadata,
      imperativeRefs: hasImperativeHelperRefs,
      tooLarge: wordCount >= 500,
      wordCount: wordCount
    }
  };
}
```

**Générer Warnings** :
```javascript
const validation = validateSkillFormat('skills/my-skill/SKILL.md');

if (!validation.valid) {
  console.warn(`
⚠️  SKILL FORMAT WARNING: ${skillPath}

Issues detected:
${validation.issues.missingYAML ? '❌ Missing YAML frontmatter (---delimited)' : ''}
${validation.issues.markdownHeaders ? '❌ Uses markdown headers (## Metadata) instead of YAML' : ''}
${validation.issues.imperativeRefs ? '❌ Imperative helper references ("Voir helpers/") instead of conditional ("Load when needed")' : ''}
${validation.issues.tooLarge ? `❌ Too large (${validation.issues.wordCount} words, target < 500)` : ''}

Progressive Disclosure will NOT work correctly!

Fix required:
1. Convert to YAML frontmatter format
2. Change helper references to conditional ("Load when needed")
3. Externalize content to helpers/ if > 500 words

See: skills/PROGRESSIVE_DISCLOSURE.md for migration guide
  `);

  // Add to changes detection
  changes.push({
    type: 'skill_format_invalid',
    path: skillPath,
    issues: validation.issues,
    impact: ['PROGRESSIVE_DISCLOSURE_BROKEN'],
    severity: 'CRITICAL'
  });
}
```

**Auto-Fix Suggestion** :
```javascript
// Si markdown headers détecté, proposer conversion automatique
if (validation.issues.markdownHeaders && !validation.issues.missingYAML) {
  console.log(`
💡 Auto-fix available:

Would you like to convert ${skillPath} to YAML frontmatter format?

Before (markdown headers):
  # Skill Name
  ## Metadata
  **Pattern**: pattern regex
  **Type**: orchestration

After (YAML frontmatter):
  ---
  metadata:
    name: skill-name
    patterns: ["pattern regex"]
    type: orchestration
  ---
  # Skill Name

Apply auto-fix? (y/n)
  `);
}
```

**Integration dans Changes Detection** :

Après validation format, ajouter aux changements détectés :
```json
{
  "changes": [
    {
      "type": "skill_format_invalid",
      "path": "skills/product-research-orchestrator/SKILL.md",
      "issues": {
        "missingYAML": true,
        "markdownHeaders": true,
        "imperativeRefs": true,
        "wordCount": 183
      },
      "severity": "CRITICAL",
      "impact": ["PROGRESSIVE_DISCLOSURE_BROKEN"],
      "fix_available": true,
      "recommendation": "Convert to YAML frontmatter (see skills/PROGRESSIVE_DISCLOSURE.md)"
    }
  ]
}
```

**Test Cases** :

```javascript
// Test 1: Valid YAML frontmatter
const valid = validateSkillFormat('skills/example-skill/SKILL.md');
// Expected: valid = true, issues = {}

// Test 2: Markdown headers (INVALID)
const invalid1 = validateSkillFormat('skills/old-format-skill/SKILL.md');
// Expected: valid = false, issues.markdownHeaders = true, issues.missingYAML = true

// Test 3: Imperative helper refs (INVALID)
const invalid2 = validateSkillFormat('skills/bad-refs-skill/SKILL.md');
// Expected: valid = false, issues.imperativeRefs = true

// Test 4: Too large (WARNING)
const warning = validateSkillFormat('skills/large-skill/SKILL.md');
// Expected: valid = false, issues.tooLarge = true, issues.wordCount > 500
```

**Output Example** :
```
📊 SKILL.md Format Validation:

✅ skills/example-skill/SKILL.md - VALID (183 words, YAML frontmatter)
⚠️  skills/product-research-orchestrator/SKILL.md - INVALID
    ❌ Missing YAML frontmatter
    ❌ Uses markdown headers (## Metadata)
    ❌ Imperative helper references detected
    💡 Auto-fix available

🔧 Recommendation:
   Run: claude "convert skill format product-research-orchestrator"
   Or manually migrate using: skills/PROGRESSIVE_DISCLOSURE.md guide

⚠️  Progressive Disclosure will NOT work for invalid skills!
   Expected context: ~200 words
   Actual context: ~2,500 words (12× overflow)
```

---

### Step 3: Générer Updates pour CLAUDE.md

**Pour chaque changement impactant CLAUDE.md** :

#### A. Repository Structure Update
```markdown
## Repository Structure (v2.0)
- `.claude/skill-rules.json` : Registry Progressive Disclosure
- `.claude/settings.json` : Configuration complète
- `skills/veille-scraping/` : [description]
  - `SKILL.md` : Metadata-only (150 mots)
  - `helpers/workflow.md` : Workflow détaillé (745 mots)
- `skills/NEW-SKILL/` : [NEW - ADD DESCRIPTION]  ← AUTO-AJOUTÉ
- `hooks/` : pre_prompt.js, post_generation.js
```

**Template pour nouveau skill** :
```
- `skills/{skill-name}/` : {description from SKILL.md metadata.description}
  - `SKILL.md` : Metadata-only ({word_count} mots)
  - `helpers/workflow.md` : Workflow détaillé ({workflow_word_count} mots)
```

#### B. Architecture / Version History Update
Si changement majeur (Progressive Disclosure, nouvelle feature) :
```markdown
### Version History
- **v1.0 (2024-11-01)** : Initial release
- **v2.0 (2025-11-15)** : Progressive Disclosure implemented
- **v2.1 (YYYY-MM-DD)** : [NEW VERSION - DESCRIBE CHANGES]  ← AUTO-AJOUTÉ
```

#### C. Performance Metrics Update
Si benchmarks changent :
```markdown
**Context Efficiency (vX.X)** : {new_baseline} mots (vs {old_baseline} avant) = {percentage}% reduction
**Scalability** : Capacité {new_capacity} skills (vs {old_capacity} avant)
```

### Step 4: Générer Updates pour INDEX.md

**Pour chaque changement impactant INDEX.md** :

#### A. Quick Links Update
```markdown
## Quick Links (v2.0)
- **[New Skill](./skills/new-skill/SKILL.md)** → Commande : "{activation_pattern}" | [Workflow](./skills/new-skill/helpers/workflow.md)  ← AUTO-AJOUTÉ
- **[Skill Rules Registry](./.claude/skill-rules.json)** → Patterns activation
```

#### B. Navigation Département Update
```markdown
### X. New Skill Category (`skills/new-skill/`)
**Usage**: `Claude, {activation_example}`
- **Description**: {from SKILL.md metadata.description}
- **Structure**: [SKILL.md](link) ({word_count} mots) + [helpers/workflow.md](link) ({workflow_words} mots)
- **Dependencies**: {list from metadata.dependencies}
- **Output**: {from metadata.creates_files}
- **Duration**: {from metadata.estimated_duration}
```

#### C. Architecture / Métriques Update
```markdown
### Métriques v2.1  ← AUTO-INCREMENT VERSION
- **Context baseline** : {new} mots (vs {old} en v2.0) = {change}%
- **Skill capacity** : {new} skills (vs {old} en v2.0)
- **New metric**: {value} ({description})  ← AUTO-AJOUTÉ SI NOUVEAU METRIC
```

### Step 5: Générer Diff Preview

**ACTION REQUIRED** : Créer preview des changements avant application

```diff
# CLAUDE.md
@@ Repository Structure @@
+ - `skills/documentation-updater/` : Auto-update CLAUDE.md et INDEX.md
+   - `SKILL.md` : Metadata-only (180 mots)
+   - `helpers/workflow.md` : Workflow détaillé (950 mots)

@@ Version History @@
+ - **v2.1 (2025-11-15)** : Documentation auto-updater skill added

# INDEX.md
@@ Quick Links @@
+ - **[Doc Auto-Updater](./skills/documentation-updater/SKILL.md)** → Commande : "update documentation"

@@ Navigation @@
+ ### 6. Documentation Maintenance (`skills/documentation-updater/`)
+ **Usage**: `Claude, update documentation`
+ - **Description**: Auto-update CLAUDE.md/INDEX.md on structural changes
```

**Afficher au user** :
```
📝 Preview Documentation Updates:

CLAUDE.md (3 changes):
  + Repository Structure: Added skills/documentation-updater/
  + Version History: Added v2.1
  ~ Performance Metrics: Updated context baseline

INDEX.md (2 changes):
  + Quick Links: Added Doc Auto-Updater
  + Navigation: Added Section 6 Documentation Maintenance

Apply changes? (y/n)
```

### Step 6: Application Changements (Avec Validation)

**Si user valide (ou auto-apply si < 5 lignes modifiées)** :

```javascript
// 1. Backup files (git commit or copy)
fs.copyFileSync('CLAUDE.md', 'CLAUDE.md.backup');
fs.copyFileSync('INDEX.md', 'INDEX.md.backup');

// 2. Apply changes using Edit tool
Edit(file_path: 'CLAUDE.md', old_string: '...', new_string: '...');
Edit(file_path: 'INDEX.md', old_string: '...', new_string: '...');

// 3. Update manifest
manifest.last_update = new Date().toISOString();
manifest.tracked_files.skills.push('documentation-updater');
manifest.checksums['skills/documentation-updater/SKILL.md'] = getChecksum('...');
fs.writeFileSync('.claude/dev_docs/doc_manifest.json', JSON.stringify(manifest, null, 2));

// 4. Log dans CHANGELOG.md (si version change)
if (versionChanged) {
  appendToChangelog({
    version: 'v2.1',
    date: new Date().toISOString().split('T')[0],
    changes: changesList
  });
}
```

### Step 7: Validation Post-Update

**Vérifications** :
```bash
# 1. CLAUDE.md est valide markdown
markdownlint CLAUDE.md

# 2. Tous les liens internes INDEX.md pointent vers fichiers existants
grep -oP '\[.*?\]\(\./.*?\)' INDEX.md | while read link; do
  path=$(echo $link | sed 's/.*(\.\///' | sed 's/).*//')
  [ -f "$path" ] || echo "BROKEN LINK: $link"
done

# 3. Pas de duplication sections (ex: 2× "Repository Structure")
grep -n "^## " CLAUDE.md | sort | uniq -d

# 4. Version history cohérente (dates chronologiques)
grep "v[0-9]" CLAUDE.md | # validate dates ascending
```

### Step 8: Reporting

**Output final** :
```
═══════════════════════════════════════════════
✅ Documentation auto-updated

📝 Files modified:
   - CLAUDE.md (3 sections, +15 lines)
   - INDEX.md (2 sections, +22 lines)

🔍 Changes:
   ✓ Added skills/documentation-updater/
   ✓ Updated Performance Metrics (context baseline)
   ✓ Added Version v2.1 history

📦 Manifest updated:
   - 4 skills tracked (was 3)
   - Last update: 2025-11-15T14:45:00Z

💾 Backups:
   - CLAUDE.md.backup
   - INDEX.md.backup

📋 Next: Review changes and commit
   git diff CLAUDE.md INDEX.md
   git add CLAUDE.md INDEX.md .claude/dev_docs/doc_manifest.json
   git commit -m "docs: auto-update CLAUDE.md + INDEX.md (v2.1)"
═══════════════════════════════════════════════
```

---

## Error Handling

| Error | Action | Recovery |
|-------|--------|----------|
| Manifest corrompu | Régénérer depuis scan files | Continue |
| CLAUDE.md locked (editing) | Skip, retry in 30s | Alert user |
| Invalid markdown generated | Rollback from backup | Alert + manual fix required |
| Broken links detected | Fix auto or alert | Continue with warning |
| Git conflict on commit | Alert user | Manual resolution |

---

## Configuration

**Manifest location** : `.claude/dev_docs/doc_manifest.json`

**Auto-apply threshold** : < 5 lignes modifiées (configurable dans settings.json)

**Backup retention** : 7 derniers backups gardés

**Scan frequency** (hook) : À chaque PostToolUse si changements structurels détectés

---

## Integration avec Hook

Le hook `.claude/hooks/post_tool_use.js` doit :

```javascript
// Détecter si outil Edit/Write a modifié fichiers structurels
if (toolName === 'Edit' || toolName === 'Write') {
  const changedFile = toolParams.file_path;

  if (isStructuralFile(changedFile)) {
    // Trigger documentation-updater skill
    triggerSkill('documentation-updater', {
      trigger: 'auto',
      changedFile: changedFile
    });
  }
}

function isStructuralFile(path) {
  return path.match(/skills\/.*\/SKILL\.md/) ||
         path.match(/skills\/.*\/helpers\/workflow\.md/) ||
         path.match(/hooks\/.*\.js/) ||
         path.match(/\.claude\/(settings|skill-rules)\.json/) ||
         path.match(/templates\/.*\.md/);
}
```

---

## Performance Targets

- **Detection time** : < 5s (scan manifest + checksums)
- **Update generation** : < 30s (diff preview ready)
- **Application** : < 10s (Edit tool calls)
- **Total** : < 1 min end-to-end

---

## Exemples Concrets

### Exemple 1 : Nouveau Skill Créé
```
Input: skills/my-new-skill/SKILL.md created
Detection: skill_created
Impact:
  - CLAUDE.md → Repository Structure (+3 lines)
  - INDEX.md → Quick Links (+1 line), Navigation (+7 lines)
Preview: [diff shown]
User validation: y
Result: Files updated, manifest saved
```

### Exemple 2 : Skill Modifié (Progressive Disclosure Applied)
```
Input: skills/veille-scraping/SKILL.md modified (745 → 150 words)
Detection: skill_modified, metadata.word_count changed
Impact:
  - INDEX.md → Section 1 Veille & Scraping (metadata updated)
Preview: [diff shown]
Auto-apply: Yes (< 5 lines)
Result: INDEX.md updated automatically
```

### Exemple 3 : Nouvelle Config
```
Input: .claude/skill-rules.json created
Detection: config_created
Impact:
  - CLAUDE.md → Repository Structure, Architecture v2.0 section
  - INDEX.md → Quick Links, Section 5 Config
Preview: [diff shown]
User validation: y
Result: Both files updated, version bumped to v2.1
```
