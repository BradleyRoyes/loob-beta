import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // bcrypt for password hashing
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

// Error handling utility
const handleError = (message: string, status: number, code: string = '') => {
  console.error(`[ERROR] ${message}`);
  return NextResponse.json({ error: message, code }, { status });
};

export async function POST(req: NextRequest) {
  try {
    console.log('Processing user entry...');
    const body = await req.json();
    const { pseudonym, email, phone, title, offeringType, description, location, password } = body;

    // Validate required fields
    if (!pseudonym || !email || !title || !offeringType || !description || !location || !password) {
      return handleError('Missing required fields.', 400, 'missing_fields');
    }

    console.log('Request validated successfully.');

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // Use 10 salt rounds

    const combinedText = `${title} ${description} ${location}`;
    const chunks = combinedText.length > 500 ? await splitter.splitText(combinedText) : [combinedText];
    console.log('Text chunks for embedding:', chunks);

    const collection = await getCollection('library');

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
          password: hashedPassword, // Store the hashed password
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
        return handleError(`Error processing chunk ${i}.`, 500, 'chunk_processing_error');
      }
    }

    console.log('All chunks processed successfully.');
    return NextResponse.json({ message: 'User entry added successfully.' }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error processing user entry:', error);
    return handleError('Internal server error.', 500, 'internal_error');
  }
}
