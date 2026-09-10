// Parse and validate the JSON output
// Expected format is:
// [
//   {
//     "date": "2026-06-03",
//     "discussion_summaries": [
//       { 
//         "topic": "topics",
//         "content": "summary string"
//       }
//     ]
//   }
// ]

let result;
const errors = [];

// --- Parse document
const raw = $input.first().json.output || '{}';
try {
  // Strip potential markdown fences
  const cleaned = raw.replace(/```\s*$/i, '').trim();
  result = JSON.parse(cleaned);
} catch (e) {
  throw new Error(`Agent did not return valid JSON. Raw output: \n${raw}`);
}

if (!Array.isArray(result))
  throw new Error("Returned document is not a JSON array");

// Check the format of each document
for (const doc of result) {

  // --- Check field "pageContent"
  if (!doc.date || typeof doc.date !== "string") {
    errors.push("date must be a string");
  }

  // --- Check field "discussion_summaries"
  const summaries = doc.discussion_summaries;
  if (!summaries || !Array.isArray(summaries)) {
    errors.push("discussion_summaries must be an array");
  } else {

    for (const summary of summaries) {
      // --- Check field "topic"
      if (!summary.topic || typeof summary.topic !== "string") {
        errors.push("discussion_summaries.*.topic must be a string");
      }

      // --- Check field "content"
      if (!summary.content || typeof summary.content !== "string") {
        errors.push("discussion_summaries.*.content must be a string");
      }
    }
  }
}

if (errors.length > 0)
  throw new Error(`Agent returned a mis-formatted document: ${errors}`);
else
  return result;
