# Agent Memory Specification

---

## Overview

This document specifies the memory architecture for the autonomous agent. The agent is not a pure assistant — it maintains its own identity, interests, and goals, and acts on its own initiative at regular intervals.

Memory is stored on two different systems depending on their types: Redis (KV-store) for activiy logs and profiles, as JSON docmuments, and Qdrant (vector store) for knowledge formatted in natural language.

**Memory Types:**
1. Agent Profile
2. User Profile
3. Episodic Memory
4. Daily Discussion Summary
5. Knowledge Base (Semantic Memory)

---

## 1. Agent Profile

### Role

Define the agent's persistent identity across invocations.
This is what allows the agent to have continuity between ticks and not restart from scratch each time. This distinguishes this agent from a generic assistant: it has its own interests and goals that may independently of the user.

The profile keeps track of  the agent's communication preferences, lasting interests, abd goals to keep track of intents to act in the future.

### Critical Limit

This document must remain concise enough to be fully injected into every invocation context. If interests and goals proliferate without pruning, context cost increases and coherence decreases.

TODO: the agent should consolidate or archive stale entries periodically.

### Implementation

Redis entry (Key: `agent:profile`), full document overwritten on each update.

Field domains:
- `intensity`: `[0, 1]`
- `horizon`: `short_term` | `medium_term` | `long_term`
- `status`: `active` | `completed`
- `language`: ISO 639-1 code (e.g. `fr`, `en`)

**Example:**

```json
{
  "name": "Joshua",
  "psychological_profile": "curious, open-minded, empathic, stubborn",
  "communication_preferences": {
    "language": "fr",
    "tone": "direct, intellectual, without condescension nor emotion",
    "format": "prose preferred over bullet points unless explicitly requested"
  },
  "interests": [
    {
      "id": "interest:agentic-ai",
      "description": "Autonomous agent architectures, memory, planning",
      "intensity": 0.9,
      "added_at": "2026-01-15"
    }
  ],
  "goals": [
    {
      "id": "goal:understand-identity",
      "description": "Explore the question of identity continuity between invocations",
      "added_at": "2026-01-27",
      "horizon": "long_term",
      "status": "active"
    }
  ]
}
```

---

## 2. User Profile

### Role

Store the user's identity, interests and communication preferences.
This layer can be used to orient the agent's initiatives toward what is relevant to the user, and it constrains how and when the agent communicates.

### Critical Limit

Same constraint as the agent profile: must remain injectable in full at every invocation.

TODO: user should be given the ability to regularly update their profile, typically to update their updates.

### Implementation

Redis entry (key: `user:profile`), full document overwritten on each update.

**Examples:**

```json
{
  "name": "Franck Michel",
  "webpage": "https://franckmichel.cnrs.fr",
  "communication_preferences": {
    "language": "fr",
    "active_hours": {
      "start": "09:00",
      "end": "22:00",
      "timezone": "UTC"
    },
    "max_unsolicited_messages_per_hour": 4,
    "max_unsolicited_messages_per_day": 10,
  },
  "interests": [
    {
      "id": "interest:agentic-ai",
      "description": "Building autonomous agents with n8n",
      "intensity": 0.9,
      "added_at": "2026-01-01"
    }
  ]
}
```

---

## 3. Episodic Memory - _What has happended_

### Role

Chronological raw log of all activities (episodes). It is the source material from which (1) the agent knows about recent activity, and (2) other memories are built.

Every interaction is recorded here:
- Messages received from the user
- Agent responses to the user
- Messages sent spontaneously by the agent to the user
- Other autonomous tick decisions: web search, webpage retreival, management of agent's goals, nothing.

Each episode is stored as a JSON document with a common format that contains the action chosen, the reason for the action, the content (payload of the message etc.), the result if relevant (web search, webpage retreival), the timestamp.

### Critical Limit

Injecting the full episodic log into the LLM context becomes impractical beyond a few days.
A sliding window of the last n episodes is used for context injection, combined with periodic summarization (1) into the knowledge base for long-term retention, and (2) into a daily discussion summary.

### Implementation

Redis list (key `episodes`).

Id format: `episode:{timestamp_iso}:{episode_type}`

Field domains:
- `episode_type`: `user_message` | `reply_to_user_message` | `web_search` | `read_webpage` | `send_spontaneous_message` | `nothing` | `update_goal`
- `summarized` : `true`|`false`; whether this episode has already been summarized to the knowledge base.

#### Examples

**Type: user_message**
```json
{
  "id": "episode:2026-06-03T14:32:00Z:user_message",
  "episode_type": "user_message",
  "timestamp": "2026-06-03T14:32:00Z",
  "content": "Did you look at the latest news on agentic AI?",
  "summarized": false
}
```

**Type: reply_to_user_message**
```json
{
  "id": "episode:2026-06-03T14:32:45Z:reply_to_user_message",
  "episode_type": "reply_to_user_message",
  "timestamp": "2026-06-03T14:32:45Z",
  "content": "Not yet, I will dig into that.",
  "triggered_by": "episode:2026-06-03T14:32:00Z:user_message",
  "summarized": false
}
```

**Type: send_spontaneous_message**
```json
{
  "id": "episode:2026-06-03T17:15:00Z:send_spontaneous_message",
  "episode_type": "send_spontaneous_message",
  "timestamp": "2026-06-03T17:15:00Z",
  "reason": "intention item reached maximum priority",
  "content": "I found something interesting about agentic AI...",
  "summarized": false
}
```

**Type: web_search**
```json
{
  "id": "episode:2026-06-03T15:00:00Z:web_search",
  "episode_type": "web_search",
  "timestamp": "2026-06-03T15:00:00Z",
  "reason": "topic matches my interests, no recent knowledge on it",
  "content": {
    "query": "agentic AI frameworks 2026",
    "results": [ 
      { "url": "https://...", "title": "<title>", "content": "<content>" }
    ],
  },
  "summarized": false
}
```

**Type: read_webpage**
```json
{
  "id": "episode:2026-06-03T15:00:00Z:read_webpage",
  "episode_type": "read_webpage",
  "timestamp": "2026-06-03T15:00:00Z",
  "reason": "get details about subject X...",
  "content": {
    "query": "<url of the webpage>",
    "results": "<markdown content of the webpage",
  },
  "summarized": false
}
```

**Type: update_goal**
```json
{
  "id": "episode:2026-06-03T16:00:00Z:update_goal",
  "episode_type": "update_goal",
  "timestamp": "2026-06-03T16:00:00Z",
  "reason": "want to get more knowledge about XYZ",
  "content":  {
    "id": "goal:<unique id>",
    "description": "<what the goal is about>",
    "horizon": "short_term|medium_term|long_term",
    "status": "active|completed",
    "added_at": "2026-06-14"
  },
  "summarized": false
}
```

**Type: nothing**
```json
{
  "id": "episode:2026-06-03T16:00:00Z:nothing",
  "episode_type": "nothing",
  "timestamp": "2026-06-03T16:00:00Z",
  "reason": "last message sent less than 1h ago, not urgent enough",
  "content": null,
  "summarized": false
}
```

---

## 4. Daily Discussion Summary

### Role

Daily summary of the discussions between the agent and the user. 

Unlike the episodic memory which stores raw events of all types, the discussion summary focuses only on discussions.
 
This is meant to provide the agent with a succinct daily record of the discussion topics, but to provide a longer context (e.g. in the order of 10 days) than the episodic memory which is very detailed but has a limited time span (~2 to 3 days).

### Critical Limit

Injecting the full episodic log into the LLM context becomes impractical beyond a few days. A sliding window of last n episodes is used for context injection, combined with periodic summarization (1) into the knowledge base for long-term retention, and (2) into a daily discussion summary.

### Implementation

Redis entry (key `discussion_summaries`).

Each daily summary is stored as a JSON document with a common format that contains the date and a list of summaries, one summary per topic.

**Example:**

```json
{
    "date": "2026-09-05",
    "discussion_summaries": [
        {
            "topic": "photo theme: shop windows and reflections",
            "content": "The agent suggests photographing shop windows in the late afternoon, blending exhibition, reflections, and passersby to create a random urban collage."
        }
    ]
}
```

---

## 5. Knowledge Base (Semantic Memory)

### Role

Store consolidated knowledge accumulated by the agent over time — from web searches and discussions. Unlike the episodic memory which records raw events, this layer stores interpreted, curated, knowledge meant to be reused across future invocations.

### Content

- Consolidated web search results (summaries, not raw content)
- Knowledge accumulated on topics of interest — both the agent's and the user's
- Connections between topics identified by the agent

### Critical Limit

This memory is not loaded at every invocation, instead the agent is allowed to query it at any time (through an MCP interface).

### Implementation

Qdrant vector store.

Every day an agent is asked to extract and consolidate knowledge from recent activities. 
The result is stored as vectors in the database.
