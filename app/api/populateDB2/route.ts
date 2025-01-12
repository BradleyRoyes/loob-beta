// app/api/populateDB2/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeCollection, getCollection } from '../../../lib/astraDb';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import OpenAI from 'openai';

// Define the structure of the incoming form data
interface FormData {
  pseudonym: string;
  email: string;
  phone: string;
  offerings: {
    title: string;
    type: string;
    description: string;
    location: string;
  };
}

// Initialize OpenAI with your API key
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Define the similarity metrics you want to use
const similarityMetrics: Array<'cosine' | 'euclidean' | 'dot_product'> = [
  'cosine',
  'euclidean',
  'dot_product',
];

// Initialize the text splitter to handle large texts
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming JSON data
    const body = await req.json();

    const { pseudonym, email, phone, offerings } = body as FormData;

    // Basic validation to ensure all required fields are present
    if (
      !pseudonym ||
      !email ||
      !offerings.title ||
      !offerings.type ||
      !offerings.description ||
      !offerings.location
    ) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Initialize the 'library' collection with 'cosine' similarity metric
    await initializeCollection('library', 'cosine');

    // Initialize similarity metric-specific collections
    for (const metric of similarityMetrics) {
      await initializeCollection(`chat_${metric}`, metric);
    }

    // Combine relevant fields for embedding generation
    const combinedText = `${offerings.title} ${offerings.description} ${offerings.location} ${offerings.type}`;
    const chunks = await splitter.splitText(combinedText);

    // Generate and store embeddings for each similarity metric
    for (const metric of similarityMetrics) {
      const collectionName = `chat_${metric}`;
      const collection = await getCollection(collectionName);

      let i = 0;
      for (const chunk of chunks) {
        try {
          // Generate embedding using OpenAI
          const embeddingResponse = await openaiClient.embeddings.create({
            input: chunk,
            model: 'text-embedding-ada-002',
          });

          const embedding = embeddingResponse.data[0]?.embedding;

          if (!embedding) {
            console.error('Embedding generation failed for chunk:', chunk);
            continue; // Skip this chunk if embedding fails
          }

          // Prepare the document to insert into AstraDB
          const document = {
            document_id: `${email}-${i}`,
            $vector: embedding,
            title: offerings.title,
            description: offerings.description,
            location: offerings.location,
            pseudonym: pseudonym,
            email: email,
            phone: phone,
            type: offerings.type,
            chunk: chunk,
          };

          // Insert the document into the respective collection
          await collection.insertOne(document);
          i++;
        } catch (embeddingError) {
          console.error('Error generating embedding or inserting document:', embeddingError);
          // Optionally, implement retry logic here
        }
      }

      console.log(`Data for "${offerings.title}" loaded into ${collectionName}`);
    }

    // Additionally, save the entire form data into the 'library' collection
    const libraryCollection = await getCollection('library');
    const libraryDocument = {
      document_id: `${email}-${Date.now()}`,
      pseudonym,
      email,
      phone,
      offerings,
      createdAt: new Date(),
    };
    await libraryCollection.insertOne(libraryDocument);
    console.log(`Form data for "${offerings.title}" saved to library collection.`);

    // Respond with a success message
    return NextResponse.json({ message: 'Entry added successfully to the library.' }, { status: 201 });
  } catch (error) {
    console.error('Error processing signup:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
