// Select the episodes that have not been summarised yet,
// and mark them as summarised.
// Keep the full list ofalready summarised episodes and summarisable episodes
// to store it again in the database.

const rawEpisodes = $('Get Episodes').first()?.json?.episodes || '[]';

let summarisableEpisodes = [];
let updatedEpisodes = [];

try {
  for (const episode of rawEpisodes) {

    let episodeParsed = JSON.parse(episode);
    if (episodeParsed.summarized === false) {
      // Add to the list of summarisable episodes and mark them as summarised
      episodeParsed.summarized = true;
      summarisableEpisodes.push(episodeParsed);
    }
    updatedEpisodes.push(episodeParsed);
  }

  return [{
    json: {
      summarisable_episodes: summarisableEpisodes,
      updated_episodes: updatedEpisodes
    }
  }];

} catch (e) {
  throw new Error("Error while processing episodes: " + e.message);
}
