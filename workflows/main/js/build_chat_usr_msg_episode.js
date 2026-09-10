const timestamp = new Date().toISOString();
const episode = {
  id: `episode:${timestamp}:user_message`,
  episode_type: "user_message",
  timestamp: timestamp,
  content: $input.first().json.chatInput,
  summarized: false
}
return episode;
