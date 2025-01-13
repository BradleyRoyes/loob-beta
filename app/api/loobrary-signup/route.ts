import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '../../../lib/astraDb';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Text splitter configuration for chunking
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

export async function POST(req: NextRequest) {
  try {
    console.log('Processing user entry...');
    // Parse request body
    const body = await req.json();
    const { pseudonym, email, phone, title, offeringType, description, location } = body;

    // Validate required fields
    if (!pseudonym || !email || !title || !offeringType || !description || !location) {
      console.error('Missing required fields in request:', body);
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    console.log('Request validated successfully.');

    // Combine content for embedding generation
    const combinedText = `${title} ${description} ${location}`;
    const chunks = combinedText.length > 500 ? await splitter.splitText(combinedText) : [combinedText];
    console.log('Text chunks for embedding:', chunks);

    // Get the `library` collection
    const collection = await getCollection('library');

    // Generate embeddings and store data
    let i = 0;
    for (const chunk of chunks) {
      try {
        console.log(`Generating embedding for chunk ${i}:`, chunk);
        const embeddingResponse = await openai.embeddings.create({
          input: chunk,
          model: 'text-embedding-ada-002',
        });

        const embedding = embeddingResponse.data[0]?.embedding;
        if (!embedding) {
          console.warn(`Failed to generate embedding for chunk ${i}. Skipping.`);
          continue;
        }

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

        console.log(`Inserting document ${i} into database...`);
        await collection.insertOne(document);
        console.log(`Document ${i} inserted successfully.`);
        i++;
      } catch (err) {
        console.error(`Error processing chunk ${i}:`, err);
      }
    }

    console.log('All chunks processed successfully.');
    return NextResponse.json({ message: 'User entry added successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Error processing user entry:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
