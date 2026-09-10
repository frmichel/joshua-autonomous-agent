// Validated input format:
// [
//   {
//     "date": "2026-06-03",
//     "discussion_summaries": [
//       { 
//         "topic": "topic",
//         "content": "summary string"
//       }
//     ]
//   }
// ]

const rawSummaries = $('Get summaries').first()?.json?.discussion_summaries || '[]';
let summaries = [];

const input = $('Validate output').first()?.json || '[]';
const date = input.date;

try {
  summaries = JSON.parse(rawSummaries);

  // If date already in the summaries, replace the summaries 
  // for that date with the new summaries
  let index = summaries.findIndex(s => s.date === date);
  if (index !== -1) {
    summaries[index] = input;
  } else {
    // Otherwise, add a new entry for the date
    summaries.push(input);
  }
} catch (e) {
  throw new Error("Invalid list of summaries");
}

return [{
  json: {
    summaries
  }
}];