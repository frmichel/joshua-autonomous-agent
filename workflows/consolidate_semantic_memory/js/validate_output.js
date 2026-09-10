// Parse and validate the JSON output
// Expected format is:
// [{
//   "metadata": {
//     "topic": "neural network training",
//     "episode_ids": ["episode:2026-06-03T15:00:00Z:web_search"],
//   },
//   "pageContent": "Neural networks learn by iteratively adjusting weights through backpropagation, minimizing the difference between predicted and actual outputs using gradient descent"
// }]

let episodes;
const errors = [];

// --- Parse document
const raw = $input.first().json.output || '{}';
try {
  // Strip potential markdown fences
  const cleaned = raw.replace(/```\s*$/i, '').trim();
  episodes = JSON.parse(cleaned);
} catch (e) {
  throw new Error(`Agent did not return valid JSON. Raw output: \n${raw}`);
}

if (!Array.isArray(episodes))
  throw new Error("Returned document is not a JSON array");

// Check the format of each document
for (const doc of episodes) {

  // --- Check field "pageContent"
  if (!doc.pageContent || typeof doc.pageContent !== "string") {
    errors.push("pageContent must be a string");
  }

  // --- Check field "metadata"
  const metadata = doc.metadata;
  if (!metadata || typeof metadata !== "object") {
    errors.push("metadata must be an object");
  } else {
    // --- Check field "topic"
    if (!metadata.topic || typeof metadata.topic !== "string") {
      errors.push("metadata.topic must be a string");
    }

    // --- Check field "episode_ids"
    if (!metadata.episode_ids || !Array.isArray(metadata.episode_ids)) {
      errors.push("metadata.episode_ids must be an array");
    } else {
      for (const id of metadata.episode_ids) {
        if (typeof id !== "string") {
          errors.push("All episode_ids must be strings");
          break;
        }
      }
    }

    // Add a timestamp in each semantic memory item
    if (errors.length === 0)
      metadata.timestamp = new Date().toISOString();
  }
}

if (errors.length > 0)
  throw new Error(`Agent returned an mis-formatted document: ${errors}`);
else
  return episodes.map(doc => ({
    json: doc
  }));
