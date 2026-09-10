// --- Get the agent profile
const agentProfile = $('Get Agent Profile').first()?.json['agent-profile'] || '{}';
let agentProfileParsed = {};
try { agentProfileParsed = JSON.parse(agentProfile) } catch (e) {
  throw new Error("Invalid agent profile");
}

// --- Get the user profile
const userProfile = $('Get User Profile').first()?.json['user-profile'] || '{}';
let userProfileParsed = {};
try { userProfileParsed = JSON.parse(userProfile) } catch (e) {
  throw new Error("Invalid user profile");
}

// --- Build the list of episodes
const rawEpisodes = $('Get Episodes').first()?.json?.episodes || '[]';
let episodes = [];
try {
  // For breviety, remove the score from web search results
  let episodesParsed = [];
  for (const episode of rawEpisodes) {
    let episodeParsed = JSON.parse(episode)
    if (episodeParsed.episode_type == "web_search")
      for (const result of episodeParsed.content.results) {
        //delete result.content;  
        delete result.score;
      }
    episodesParsed.push(episodeParsed);
  }
  // Sort by most recent episodes first
  episodes = episodesParsed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Find the most recent with type "nothing"
  const mostRecentNothingEpisode = episodes.find(ep => ep.episode_type === "nothing");
  // Remove all older episodes with type "nothing" to avoid wasting tokens for "nothing" haha
  episodes = episodes.filter(ep => ep.episode_type !== "nothing" || ep === mostRecentNothingEpisode);

  // Keep only the x most recent episodes
  episodes = episodes.slice(0, 15);

} catch (e) {
  throw new Error("Invalid list of episodes");
}

// --- Get the discussion summaries
const discussions = $('Get discussion summaries').first()?.json?.discussion_summaries || '{}';
let discussionsParsed = {};
try {
  discussionsParsed = JSON.parse(discussions);
  // Sort by most recent first
  discussionsParsed = discussionsParsed.sort((a, b) => b.date.localeCompare(a.date));
  // Keep only the last 10 days
  discussionsParsed = discussionsParsed.slice(0, 10);
} catch (e) {
  throw new Error("Invalid discussion summaries");
}

return [{
  json: {
    timestamp: new Date().toISOString(),
    weekDay: $('Calc weekday & time').first().json.weekDay,
    time: $('Calc weekday & time').first().json.time,
    context: {
      agentProfile: agentProfileParsed,
      userProfile: userProfileParsed,
      recentEpisodes: episodes,
      discussionSummaries: discussionsParsed
    }
  }
}];