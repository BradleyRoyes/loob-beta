import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { AstraDB } from "@datastax/astra-db-ts";
import { Buffer } from 'buffer';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const astraDb = new AstraDB(process.env.ASTRA_DB_APPLICATION_TOKEN, process.env.ASTRA_DB_ENDPOINT, process.env.ASTRA_DB_NAMESPACE);

export async function POST(req: Request) {
  try {
    // Assuming the request's Content-Type is multipart/form-data
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    let latestMessage = '';

    // Check if there's an audio file and if it is indeed a file
    if (audioFile instanceof File && audioFile.type.startsWith('audio/')) {
      // Convert File to ReadableStream for Whisper AI
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null); // Indicates end of stream

      // Transcribe audio using Whisper AI
      const transcriptionResponse = await openai.createTranscription(
        readableStream, 'whisper-1', '', 'text', 0, 'en'
      );

      if (transcriptionResponse.data) {
        latestMessage = transcriptionResponse.data.choices[0].text;

        // Here you can insert the latestMessage into your database
        // For example, let's insert it into a collection called 'transcriptions'
        const collection = await astraDb.collection('transcriptions');
        await collection.insertOne({ content: latestMessage });
      }
    } else {
      // Handle cases where 'audio' field is missing or not an audio file
      return new Response(JSON.stringify({ error: 'Audio file is required and must be of audio type' }), { status: 400 });
    }

    // You can continue to use latestMessage as part of your logic
    // If you also want to process text messages, you can include that logic here

    return new Response(JSON.stringify({ message: 'Transcription successful', transcription: latestMessage }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
