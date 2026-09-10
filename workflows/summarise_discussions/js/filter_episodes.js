const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// --- Build the list of episodes
const rawEpisodes = $('Get Episodes').first()?.json?.episodes || '[]';
let episodes = [];
let result = [];

try {
  for (const rawEpisode of rawEpisodes) {
    let episode = JSON.parse(rawEpisode)
    if (["user_message", "reply_to_user_message", "send_spontaneous_message"].includes(episode.episode_type)) {
      delete episode.summarized;
      delete episode.triggered_by;
      delete episode.reason;
      episodes.push(episode);
    }
  }

  // Keep only episodes from yesterday
  result = episodes.filter(ep => ep.timestamp.split('T')[0] === yesterday);

  // Sort episodes in chronological order
  result = result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

} catch (e) {
  throw new Error("Invalid list of episodes");
}

return [{
  json: {
    date: yesterday,
    episodes: result
  }
}];