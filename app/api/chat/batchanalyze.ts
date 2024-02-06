// app/chat/api/analyze.ts
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Initialize AstraDB and OpenAI clients
const astraDb = new AstraDB(
  process.env.ASTRA_DB_APPLICATION_TOKEN,
  process.env.ASTRA_DB_ENDPOINT,
  process.env.ASTRA_DB_NAMESPACE
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeBatch(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  try {
    // Extract sessionId from request
    const { sessionId } = req.body;

    // Retrieve session-specific texts from AstraDB
    const texts = await retrieveTextsForSession(sessionId);

    // Concatenate all texts into one large string for analysis
    const concatenatedTexts = texts.map(text => text.content).join(" ");

    // Simple keyword extraction from the concatenated text
    const keywords = extractKeywords(concatenatedTexts);

    // Respond with the keywords for visualization
    res.status(200).json({ keywords });
  } catch (error) {
    console.error('Error processing batch analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function retrieveTextsForSession(sessionId) {
  // Assuming AstraDB's collection method is similar to MongoDB's for simplicity
  const texts = await astraDb.collection('journey_journal').find({ sessionId });
  return texts;
}

function extractKeywords(text) {
  // Simple keyword extraction logic (placeholder for demonstration)
  // This could be a more sophisticated NLP process depending on your requirements
  const wordOccurrences = {};
  text.split(/\s+/).forEach(word => {
    word = word.toLowerCase();
    if (!wordOccurrences[word]) wordOccurrences[word] = 0;
    wordOccurrences[word]++;
  });

  // Convert the occurrences object into an array of words sorted by frequency
  const sortedWords = Object.keys(wordOccurrences).sort((a, b) => wordOccurrences[b] - wordOccurrences[a]);

  // For simplicity, return the top 10 words as keywords
  return sortedWords.slice(0, 10);
}