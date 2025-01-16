import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '../../../lib/astraDb';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Text splitter configuration
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

// Utility function for handling errors
const handleError = (message: string, status: number, code: string = '', missingFields: string[] = []) => {
  console.error(`[ERROR]: ${message}`);
  return NextResponse.json({ error: message, code, missingFields }, { status });
};

// Validate tags: Ensure each tag has both `category` and `value`
const validateTags = (tags: Array<{ category: string; value: string }>) => {
  if (!tags || !Array.isArray(tags)) return false;
  for (const tag of tags) {
    if (!tag.category || !tag.value) return false;
  }
  return true;
};

// Address validation: Ensure the address has a minimum length and characters
const validateAddress = (address: string) => {
  const regex = /^[a-zA-Z0-9\s,.'-]{10,}$/; // Minimum 10 characters
  return regex.test(address);
};

export async function POST(req: NextRequest) {
  try {
    console.log('Processing user entry...');
    const body = await req.json();
    const {
      dataType,
      pseudonym,
      email,
      phone,
      password,
      title,
      offeringType,
      description,
      location,
      name,
      address,
      externalLink,
      adminUsername,
      adminPassword,
      tags,
    } = body;

    // Validate required fields for each dataType
    const missingFields: string[] = [];
    if (!dataType) missingFields.push('dataType');

    if (dataType === 'Loobricate') {
      if (!name) missingFields.push('name');
      if (!description) missingFields.push('description');
      if (!address) missingFields.push('address');
      if (!adminUsername) missingFields.push('adminUsername');
      if (!adminPassword) missingFields.push('adminPassword');
    } else {
      if (!pseudonym) missingFields.push('pseudonym');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!title) missingFields.push('title');
      if (!offeringType) missingFields.push('offeringType');
      if (!description) missingFields.push('description');
      if (!location) missingFields.push('location');
    }

    // Validate tags for all entries
    if (!validateTags(tags)) {
      return handleError('Invalid tags. Each tag must have a category and value.', 400, 'invalid_tags');
    }

    // Validate address
    if (!validateAddress(address) && dataType === 'Loobricate') {
      return handleError('Invalid address format for Loobricate.', 400, 'invalid_address');
    }
    if (!validateAddress(location) && dataType !== 'Loobricate') {
      return handleError('Invalid location format.', 400, 'invalid_location');
    }

    // Return an error if there are missing fields
    if (missingFields.length > 0) {
      return handleError(
        `Missing required fields: ${missingFields.join(', ')}`,
        400,
        'missing_fields',
        missingFields
      );
    }

    if (dataType === 'Loobricate') {
      console.log('Processing Loobricate entry...');
      const loobricatesCollection = await getCollection('loobricates');

      // Check for duplicates
      const duplicate = await loobricatesCollection.findOne({
        $or: [{ name }, { address }, { adminUsername }],
      });

      if (duplicate) {
        return handleError(
          'A Loobricate with these details already exists.',
          400,
          'duplicate_loobricate'
        );
      }

      // Hash the admin password
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

      // Insert Loobricate entry
      const loobricateDocument = {
        name,
        description,
        address,
        externalLink: externalLink || 'N/A',
        adminUsername,
        adminPassword: hashedAdminPassword,
        tags,
        createdAt: new Date(),
      };

      await loobricatesCollection.insertOne(loobricateDocument);

      console.log('Loobricate entry added successfully.');
      return NextResponse.json({ message: 'Loobricate created successfully.' }, { status: 201 });
    }

    console.log('Processing non-Loobricate entry...');
    // Default placeholders for optional fields
    const placeholderPseudonym = pseudonym || 'Anonymously Contributed';
    const placeholderEmail = email || 'anon@example.com';
    const placeholderPhone = phone || 'N/A';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Combine text for embedding
    const combinedText = `${title} ${description} ${location}`;
    const chunks =
      combinedText.length > 500
        ? await splitter.splitText(combinedText)
        : [combinedText];

    console.log('Text chunks for embedding:', chunks);

    // Get the collection for user entries
    const libraryCollection = await getCollection('library');

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
          document_id: `${placeholderEmail}-${Date.now()}-${i}`,
          $vector: embedding, // Embedding vector
          title,
          offeringType,
          description,
          location,
          tags,
          pseudonym: placeholderPseudonym,
          email: placeholderEmail,
          phone: placeholderPhone,
          password: hashedPassword, // Store the hashed password
          dataType: 'userEntry',
          chunk,
          createdAt: new Date(),
        };

        console.log(`Inserting document ${i} into database...`);
        await libraryCollection.insertOne(document);
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
