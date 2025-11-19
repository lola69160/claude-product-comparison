/**
 * Pre-Research Hook
 *
 * Triggered: UserPromptSubmit (when user asks to compare products)
 * Purpose: Validate product names exist before starting expensive research
 * Execution time: ~30 sec
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = async function preResearch(context) {
  const { userPrompt, tools } = context;

  // Detect comparison request
  const comparisonPattern = /compare\s+(.+?)\s+vs\s+(.+)|research\s+products?\s+(.+)/i;
  const match = userPrompt.match(comparisonPattern);

  if (!match) {
    // Not a comparison request, skip hook
    return { proceed: true };
  }

  // Extract product names
  let product1, product2;
  if (match[1] && match[2]) {
    // "compare X vs Y" format
    product1 = match[1].trim();
    product2 = match[2].trim();
  } else if (match[3]) {
    // "research products X, Y" format
    const products = match[3].split(/,|and/).map(p => p.trim());
    if (products.length !== 2) {
      return {
        proceed: false,
        message: "❌ Veuillez spécifier exactement 2 produits à comparer.\nFormat: 'compare [produit1] vs [produit2]'"
      };
    }
    [product1, product2] = products;
  }

  console.log(`[Pre-Research Hook] Validating products: "${product1}" vs "${product2}"`);

  // Quick validation: Check if products seem valid (not empty, not too short)
  if (product1.length < 3 || product2.length < 3) {
    return {
      proceed: false,
      message: "❌ Noms de produits trop courts. Soyez plus spécifique.\nExemple: 'compare Dyson V15 vs Shark Stratos'"
    };
  }

  // Check if products are identical
  if (product1.toLowerCase() === product2.toLowerCase()) {
    return {
      proceed: false,
      message: "❌ Vous essayez de comparer un produit avec lui-même! Veuillez choisir 2 produits différents."
    };
  }

  // Initialize research session ID
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const sessionId = `research_${timestamp}`;

  // Create research session metadata
  const sessionMetadata = {
    session_id: sessionId,
    timestamp_created: new Date().toISOString(),
    products: [product1, product2],
    status: "initialized",
    validated: false
  };

  // Save session metadata
  const sessionPath = path.join(process.cwd(), 'data', sessionId);
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const metadataPath = path.join(sessionPath, 'session_metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(sessionMetadata, null, 2));

  console.log(`[Pre-Research Hook] Research session initialized: ${sessionId}`);

  // Add context to user prompt
  return {
    proceed: true,
    augmentedPrompt: `${userPrompt}

[Pre-Research Hook Context]
- Research Session ID: ${sessionId}
- Product 1: ${product1}
- Product 2: ${product2}
- Session initialized at: ${sessionPath}
- Next step: Orchestrator will validate products exist via web search
`,
    metadata: {
      sessionId,
      product1,
      product2,
      sessionPath
    }
  };
};
