// app/api/chat/batchanalyze.ts
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
    const { sessionId } = req.body;
    const texts = await retrieveTextsForSession(sessionId);
    const concatenatedTexts = texts.map(text => text.content).join(" ");
    const keywords = extractKeywords(concatenatedTexts);

    // Map keywords to desired visualization structure
    const wordsData = keywords.map(keyword => ({
      text: keyword,
      frequency: wordOccurrences[keyword], // Assuming wordOccurrences is globally accessible or returned by extractKeywords
      sentiment: 'positive', // Placeholder for sentiment analysis
    }));

    res.status(200).json({ wordsData });
  } catch (error) {
    console.error('Error processing batch analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function retrieveTextsForSession(sessionId) {
  // Mock function to fetch texts by session ID - replace with actual AstraDB query method
  // This function simulates fetching documents based on a session ID
  // Actual implementation will vary based on AstraDB's API
  const texts = await mockFetchDocumentsBySessionId('journey_journal', sessionId);
  return texts;
}

// Placeholder for the actual database query function
// Replace with the method provided by AstraDB to fetch documents by session ID
async function mockFetchDocumentsBySessionId(collectionName, sessionId) {
  // Simulate database operation
  return []; // Return an array of documents
}

let wordOccurrences = {}; // Define globally if needed across functions
function extractKeywords(text) {
  wordOccurrences = {}; // Reset for each call
  text.split(/\s+/).forEach(word => {
    word = word.toLowerCase();
    if (!wordOccurrences[word]) wordOccurrences[word] = 0;
    wordOccurrences[word]++;
  });

  return Object.keys(wordOccurrences).sort((a, b) => wordOccurrences[b] - wordOccurrences[a]).slice(0, 10);
}