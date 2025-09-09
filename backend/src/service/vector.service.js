// Import the Pinecone library
const { Pinecone } = require("@pinecone-database/pinecone");

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const chatGPT = pc.index("chatgpt-ai");

async function createMemory({ vectors, metadata, messageID }) {
  await chatGPT.upsert([
    {
      id: messageID,
      values: vectors,
      metadata,
    },
  ]);
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
  const query = {
    vector: queryVector,
    topK: limit,
    includeMetadata: true,
  };

  if (metadata && Object.keys(metadata).length > 0) {
    query.filter = metadata;
  }

  const data = await chatGPT.query(query);
  return data.matches;
}

module.exports = {
  createMemory,
  queryMemory,
};
