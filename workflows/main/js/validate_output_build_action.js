// Parse and validate the agent's JSON output
// Expected format is:
// {
//   "action": {
//     "type": "<reply_to_user_message|send_spontaneous_message|
//               memory_search|web_search|read_webpage|update_goal|nothing>",
//     "reason": "<why you chose this action>",
//     "related_interest_ids": [ "interest:xyz" ],
//     "content": "<depending on action type>"
//   }
// } 
// Field "timestamp" will be added at the root upon validation.


let doc;
const errors = [];
const ALLOWED_ACTIONS = new Set([
  "memory_search", "web_search", "read_webpage", "reply_to_user_message",
  "send_spontaneous_message", "update_goal", "nothing"
]);

// --- Parse document
const raw = $input.first().json.output || '{}';
try {
  // Strip potential markdown fences
  const cleaned = raw.replace(/```\s*$/i, '').trim();
  doc = JSON.parse(cleaned);
} catch (e) {
  throw new Error(`Agent did not return valid JSON. Raw output: \n${raw}`);
}

// --- Find field "action"
if (!doc.action || typeof doc.action !== "object" || Array.isArray(doc.action)) {
  throw new Error(`Agent did not return valid JSON. Field action must be an object: \n${raw}`);
}
const action = doc.action;


// --- Field type
const type = action.type?.trim() ?? null;
if (typeof type !== "string") {
  errors.push("action.type must be a string");
} else if (!ALLOWED_ACTIONS.has(type)) {
  errors.push(`action.type must be one of: ${[...ALLOWED_ACTIONS].join(", ")}`);
}

// --- Field reason is optional, but must be a string if provided
const reason = action.reason?.trim() ?? null;
if (reason && typeof reason !== "string") {
  errors.push("action.reason must be a string");
}

// --- related_interest_ids
const related_interest_ids = action.related_interest_ids || [];
if (!Array.isArray(related_interest_ids)) {
  errors.push("action.related_interest_ids must be an array");
} else {
  for (const id of related_interest_ids) {
    if (typeof id !== "string") {
      errors.push("All related_interest_ids must be strings");
      break;
    }
  }
}

// --- Content validation depending on action type
const content = action.content;
switch (type) {
  case "nothing":
    break;

  case "reply_to_user_message":
  case "send_spontaneous_message":
  case "web_search":
  case "memory_search":
    if (typeof content !== "string" || content.trim() === "")
      errors.push("action.content must be a non-empty string");
    break;

  case "read_webpage":
    if (typeof content !== "string" || content.trim() === "" || !content.startsWith("http"))
      errors.push("action.content must be an http URL");
    break;

  case "update_goal":
    // Expected format of "content":
    //  {
    //    "id": "goal:<unique id>",
    //    "description": "<what the goal is about>",
    //    "horizon": "short_term|medium_term|long_term",
    //    "status": "active|completed"
    //  }
    // Fields "added_at" will be added upon validation.

    const requiredFields = ['id', 'description', 'horizon'];
    let required_ok = true;
    for (const field of requiredFields) {
      if (!(field in content)) {
        errors.push(`action type update_goal requires field ${field}`);
        required_ok = false;
      }
    }
    if (required_ok) {
      if (typeof content.description !== 'string' || content.description.trim() === '')
        errors.push("action type update_goal requires a non empty description");

      const validHorizons = ['short_term', 'medium_term', 'long_term'];
      if (!validHorizons.includes(content.horizon))
        errors.push(`action type update_goal, invalid horizon value: ${content.horizon}`);

      const validStatus = ['active', 'completed'];
      if (!validStatus.includes(content.status))
        errors.push(`action type update_goal, invalid status value: ${content.status}`);

      // Add field "added_at"
      content.added_at = new Date().toISOString().split('T')[0];
    };
    break;
}

if (errors.length > 0)
  throw new Error(`Agent returned an mis-formatted document: ${errors}`);
else {
  // Add the timestamp
  doc.timestamp = new Date().toISOString();
  return doc;
}