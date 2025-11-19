/**
 * Post-Collection Hook
 *
 * Triggered: PostToolUse after Write tool (when data files are saved)
 * Purpose: Validate quality of collected data (completeness, format)
 * Execution time: ~5 sec
 */

const fs = require('fs');
const path = require('path');

module.exports = async function postCollection(context) {
  const { toolName, toolInput, toolOutput } = context;

  // Only trigger for Write tool
  if (toolName !== 'Write') {
    return { proceed: true };
  }

  const filePath = toolInput.file_path;

  // Check if file is a data collection output
  const dataFilePatterns = [
    /specs\.json$/,
    /reviews_summary\.json$/,
    /pricing\.json$/,
    /product_profile\.json$/
  ];

  const isDataFile = dataFilePatterns.some(pattern => pattern.test(filePath));
  if (!isDataFile) {
    return { proceed: true };
  }

  console.log(`[Post-Collection Hook] Validating data file: ${filePath}`);

  // Read and validate file
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Determine file type and validation rules
    let validation = { valid: true, warnings: [], errors: [] };

    if (filePath.endsWith('specs.json')) {
      validation = validateSpecs(data, filePath);
    } else if (filePath.endsWith('reviews_summary.json')) {
      validation = validateReviews(data, filePath);
    } else if (filePath.endsWith('pricing.json')) {
      validation = validatePricing(data, filePath);
    } else if (filePath.endsWith('product_profile.json')) {
      validation = validateProfile(data, filePath);
    }

    // Log validation results
    const logPath = path.join(process.cwd(), '.claude', 'logs', 'post_collection.log');
    const logEntry = `
[${new Date().toISOString()}] ${filePath}
Valid: ${validation.valid}
Warnings: ${validation.warnings.length}
Errors: ${validation.errors.length}
${validation.warnings.map(w => `  ⚠️  ${w}`).join('\n')}
${validation.errors.map(e => `  ❌ ${e}`).join('\n')}
---
`;
    fs.appendFileSync(logPath, logEntry);

    // Display warnings/errors to user
    if (validation.errors.length > 0) {
      console.error(`[Post-Collection Hook] ❌ Data validation failed for ${path.basename(filePath)}`);
      validation.errors.forEach(err => console.error(`  - ${err}`));
      return {
        proceed: true, // Don't block, but warn
        message: `⚠️  Data validation errors detected in ${path.basename(filePath)}:\n${validation.errors.join('\n')}\n\nContinuing, but data may be incomplete.`
      };
    }

    if (validation.warnings.length > 0) {
      console.warn(`[Post-Collection Hook] ⚠️  Data validation warnings for ${path.basename(filePath)}`);
      validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
    }

    return { proceed: true };

  } catch (error) {
    console.error(`[Post-Collection Hook] Error validating ${filePath}:`, error.message);
    return {
      proceed: true,
      message: `⚠️  Could not validate ${path.basename(filePath)}: ${error.message}`
    };
  }
};

/**
 * Validate specs.json
 */
function validateSpecs(data, filePath) {
  const validation = { valid: true, warnings: [], errors: [] };

  // Check for required fields
  if (!data._metadata) {
    validation.errors.push('Missing _metadata field');
    validation.valid = false;
  }

  // Count collected specs
  const collectedSpecs = Object.keys(data).filter(k => !k.startsWith('_')).length;
  if (collectedSpecs === 0) {
    validation.errors.push('No specifications collected');
    validation.valid = false;
  } else if (collectedSpecs < 5) {
    validation.warnings.push(`Only ${collectedSpecs} specs collected (expected 8-10 for most categories)`);
  }

  // Check for null values
  const nullSpecs = Object.entries(data)
    .filter(([k, v]) => !k.startsWith('_') && (v === null || v === undefined || v === ''))
    .map(([k]) => k);

  if (nullSpecs.length > 0) {
    validation.warnings.push(`Specs with null/empty values: ${nullSpecs.join(', ')}`);
  }

  return validation;
}

/**
 * Validate reviews_summary.json
 */
function validateReviews(data, filePath) {
  const validation = { valid: true, warnings: [], errors: [] };

  // Check required fields
  if (!data.overall_score || typeof data.overall_score !== 'number') {
    validation.errors.push('Missing or invalid overall_score');
    validation.valid = false;
  }

  if (!data.overall_sentiment) {
    validation.errors.push('Missing overall_sentiment');
    validation.valid = false;
  }

  if (!data.sources) {
    validation.errors.push('Missing sources data');
    validation.valid = false;
  }

  // Check if at least one source has data
  if (data.sources) {
    const hasAmazon = data.sources.amazon && data.sources.amazon.total_reviews > 0;
    const hasReddit = data.sources.reddit && data.sources.reddit.mentions > 0;
    const hasExpert = data.sources.expert && data.sources.expert.reviews_count > 0;

    if (!hasAmazon && !hasReddit && !hasExpert) {
      validation.errors.push('No review sources collected (Amazon, Reddit, or Expert)');
      validation.valid = false;
    }

    // Warnings for low data
    if (hasAmazon && data.sources.amazon.total_reviews < 10) {
      validation.warnings.push(`Low Amazon review count: ${data.sources.amazon.total_reviews} (< 10)`);
    }

    if (hasExpert && data.sources.expert.reviews_count < 2) {
      validation.warnings.push(`Low expert review count: ${data.sources.expert.reviews_count} (< 2)`);
    }
  }

  // Check pros/cons
  if (!data.pros || data.pros.length === 0) {
    validation.warnings.push('No pros extracted');
  }

  if (!data.cons || data.cons.length === 0) {
    validation.warnings.push('No cons extracted');
  }

  return validation;
}

/**
 * Validate pricing.json
 */
function validatePricing(data, filePath) {
  const validation = { valid: true, warnings: [], errors: [] };

  // Check for retailers data
  if (!data.retailers || data.retailers.length === 0) {
    validation.errors.push('No retailers data collected');
    validation.valid = false;
    return validation;
  }

  // Check each retailer entry
  let validPrices = 0;
  data.retailers.forEach((retailer, index) => {
    if (!retailer.name) {
      validation.warnings.push(`Retailer ${index + 1} missing name`);
    }

    if (!retailer.price || retailer.price === 0) {
      validation.warnings.push(`Retailer ${retailer.name || index + 1} has no price`);
    } else {
      validPrices++;
    }

    if (!retailer.availability) {
      validation.warnings.push(`Retailer ${retailer.name || index + 1} missing availability status`);
    }
  });

  if (validPrices === 0) {
    validation.errors.push('No valid prices collected from any retailer');
    validation.valid = false;
  } else if (validPrices < 2) {
    validation.warnings.push(`Only ${validPrices} retailer with valid price (expected 3+)`);
  }

  // Check best_price field
  if (!data.best_price) {
    validation.warnings.push('Missing best_price field');
  }

  return validation;
}

/**
 * Validate product_profile.json
 */
function validateProfile(data, filePath) {
  const validation = { valid: true, warnings: [], errors: [] };

  // Check required sections
  if (!data.specs) {
    validation.errors.push('Missing specs section');
    validation.valid = false;
  }

  if (!data.reviews) {
    validation.errors.push('Missing reviews section');
    validation.valid = false;
  }

  if (!data.pricing) {
    validation.errors.push('Missing pricing section');
    validation.valid = false;
  }

  if (!data.data_quality) {
    validation.errors.push('Missing data_quality section');
    validation.valid = false;
  }

  // Check data quality scores
  if (data.data_quality) {
    if (data.data_quality.specs === 'poor') {
      validation.warnings.push('Specs data quality is POOR');
    }

    if (data.data_quality.reviews === 'low') {
      validation.warnings.push('Reviews data quality is LOW');
    }

    if (data.data_quality.pricing === 'limited') {
      validation.warnings.push('Pricing data is LIMITED');
    }
  }

  // Check duration (flag if suspiciously fast or slow)
  if (data.duration_sec) {
    if (data.duration_sec < 60) {
      validation.warnings.push(`Suspiciously fast research: ${data.duration_sec}s (possible cache hit)`);
    }

    if (data.duration_sec > 1800) {
      validation.warnings.push(`Very slow research: ${data.duration_sec}s (> 30 min)`);
    }
  }

  // Check errors
  if (data.errors && data.errors.length > 0) {
    validation.warnings.push(`${data.errors.length} errors occurred during research`);
  }

  return validation;
}
