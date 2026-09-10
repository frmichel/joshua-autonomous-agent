let doc = {
  timestamp: new Date().toISOString(),
  action: {
    type: "user_message",
    content: $input.first().json.content
  }
};
return doc;