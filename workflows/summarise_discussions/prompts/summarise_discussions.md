# Goal

Summarise the discussions that happended on a certain date between an agent and a user.

You get as input a JSON array of the messages exchanged between the agent and the user, and you have to return a JSON array of **discussion summaries**.

A discussion summary is **topic-focused** and **succinct**. If several topics have been discussed, generate one entry for each topic.
A discussion summary does not record each individual message, but **briefly consolidates the salient arguments**, possibly naming the user and agent if they disagree.
A discussion summary is written in same language as that of the discussion.


## Input Format

The JSON array of recent messages (episodes) is formatted as follows:
- `date` (string): the date of the conversations.
- `episodes` (array of documents): each document describes one message exchanged
  - `episode.episode_type` = `user_message` : message sent by the user.
  - `episode.episode_type` = `send_spontaneous_message` or `reply_to_user_message`: message sent by the agent.

## Output format (CRITICAL)

You MUST return a single raw JSON array. No markdown. No prose. No explanation. No code fences. 
Each document in the JSON array must strictly follow the schema below:
- `date` (string): the date of the conversations.
- `discussion_summaries` (array of documents): contains
  - `topic` (string): A **single, concise** topic label (e.g., `"quantum computing principles"`).
  - `content` (string): short summary of the discussion about this topic.

**Example:**

{
  "date": "2026-06-03",
  "discussion_summaries": [
    { 
      "topic": "deep learning principles",
      "content": "Neural networks learn by iteratively adjusting weights through backpropagation. User proposed to expand discussion scope to transformers another time."
    }
  ]
}

If no information was summarised, then simply return a document with an empty summary: 

**Example:**

{
  "date": "2026-06-03",
  "discussion_summaries": []
}

## Processing Instructions

1. **Extract Information:**

Extract the topic and conversation details from fields `content`.

2. **Consolidate by Topic:**
   - Group exchanges that relate to the **same topic**.
   - Summarise their content into a **single, short** string.

3. **Filter:**

Exclude messages that contain **no information**, e.g., only conversational politness, informal chat with no specific summarisable information, etc.

# Data to be processed

{{ JSON.stringify($json.episodes, null, 2) }}