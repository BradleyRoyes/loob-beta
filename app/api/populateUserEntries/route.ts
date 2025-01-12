import { NextRequest, NextResponse } from 'next/server';
import { initializeCollection, getCollection } from '../../../lib/astraDb';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Text splitter configuration for chunking
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // Adjust chunk size for user-generated content
  chunkOverlap: 50,
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { pseudonym, email, phone, title, offeringType, description, location } = body;

    // Validate required fields
    if (!pseudonym || !email || !title || !offeringType || !description || !location) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Initialize the library collection with vector search enabled
    await initializeCollection('library', 'cosine');

    // Combine content for embedding generation
    const combinedText = `${title} ${description} ${location}`;
    const chunks = combinedText.length > 500 ? await splitter.splitText(combinedText) : [combinedText];

    // Generate embeddings and store in the library collection
    const collection = await getCollection('library');
    let i = 0;
    for (const chunk of chunks) {
      try {
        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          input: chunk,
          model: 'text-embedding-ada-002',
        });

        const embedding = embeddingResponse.data[0]?.embedding;
        if (!embedding) {
          console.warn('Failed to generate embedding for chunk:', chunk);
          continue;
        }

        // Create and insert document with embedding and metadata
        const document = {
          document_id: `${email}-${Date.now()}-${i}`,
          $vector: embedding, // Embedding vector
          title,
          offeringType,
          description,
          location,
          pseudonym,
          email,
          phone,
          dataType: 'userEntry',
          chunk,
          createdAt: new Date(),
        };

        await collection.insertOne(document);
        i++;
      } catch (err) {
        console.error('Error generating embedding or inserting document:', err);
      }
    }

    return NextResponse.json({ message: 'User entry added successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Error processing user entry:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
