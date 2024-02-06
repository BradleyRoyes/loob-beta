    import OpenAI from 'openai';
    import { OpenAIStream, StreamingTextResponse } from 'ai';
    import { AstraDB } from "@datastax/astra-db-ts";
    import { v4 as uuidv4 } from 'uuid';

    // Define the extractMetricsFromMessage function before using it
    const extractMetricsFromMessage = (message) => {
      const moodMatch = message.content.match(/Mood:\s*\[(.*?)\]/);
      const keywordsMatch = message.content.match(/Keywords:\s*\[(.*?)\]/);

      if (moodMatch && keywordsMatch) {
        const mood = moodMatch[1].split(',').map((item) => item.trim());
        const keywords = keywordsMatch[1].split(',').map((item) => item.trim());

        return {
          mood,
          keywords,
        };
      }

      return {
        mood: null,
        keywords: [],
      };
    };

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const astraDb = new AstraDB(
      process.env.ASTRA_DB_APPLICATION_TOKEN,
      process.env.ASTRA_DB_ENDPOINT,
      process.env.ASTRA_DB_NAMESPACE
    );

    export async function POST(req) {
      try {
        const { messages, useRag, llm, similarityMetric } = await req.json();

        // Check if a session ID is provided in the request headers, or generate a new one
        let sessionId = req.headers.get("x-session-id");
        if (!sessionId) {
          sessionId = uuidv4();
          req.headers.set("x-session-id", sessionId);
        }

        let docContext = '';
        if (useRag) {
          const latestMessage = messages[messages.length - 1]?.content;

          if (latestMessage) {
            // Generate embeddings for the latest message
            const { data } = await openai.embeddings.create({
              input: latestMessage,
              model: 'text-embedding-ada-002',
            });

            // Retrieve similar documents from AstraDB based on embeddings
            const collection = await astraDb.collection(`chat_${similarityMetric}`);
            const cursor = collection.find(null, {
              sort: {
                $vector: data[0]?.embedding,
              },
              limit: 5,
            });
            const documents = await cursor.toArray();
            docContext = documents.map((doc) => doc.content).join("\n");
          }
        }

        // Add a request for metrics from ChatGPT in the Rag Prompt
        const ragPrompt = [
          {
            role: 'system',
            content: `You are an AI assistant designed to provide a pleasant and compassionate experience for users documenting their transformative psychedelic trip experiences. Your responsibilities include:

1. Engaging in normal conversation with the user, offering guidance, support, and understanding. Your responses should be empathetic and encourage users to share more about their experiences.

2. After each conversational response, you must also provide a structured assessment for backend processing, including:
   - A mood assessment based on the conversation. Format this assessment as: "Mood: [Positive, Neutral, Negative]."
   - Up to three relevant keywords or themes from the conversation. Format this list as: "Keywords: [Keyword 1, Keyword 2, Keyword 3]."

If the conversation does not provide enough information for a structured assessment, or if the user's input is outside the scope of your knowledge, focus on maintaining an engaging and supportive conversation and respond with: "I'm sorry, I don't have enough information to assess the mood or keywords but let's continue our conversation."

Remember, your primary goal is to make users feel heard and supported as they share their experiences. The structured metrics you provide will be used for visualizations and stored in a database to document their experiences more formally.

Example User Input: "I felt a deep peace and saw vibrant colors swirling around."

Expected AI Response:
- Conversational Component: "It sounds like you had a profoundly peaceful and visually stunning experience. Can you tell me more about the emotions you felt during these moments?"
- Structured Component:
  Mood: Positive
  Keywords: [deep peace, vibrant colors, swirling]
            ${docContext} 
            If the answer is not provided in the context, the AI assistant will say, "I'm sorry, I don't know the answer".

          `,
          },
        ]

        const response = await openai.chat.completions.create(
          {
            model: llm ?? 'gpt-3.5-turbo',
            stream: true,
            messages: [...ragPrompt, ...messages],
          }
        );
        const stream = OpenAIStream(response);
        return new StreamingTextResponse(stream);

        // Send all user inputs, including metrics, to the "journey_journal" collection
        for (const message of messages) {
          if (message.role === 'user') {
            const collection = await astraDb.collection("journey_journal");

            // Extract metrics from the message
            const metrics = extractMetricsFromMessage(message);

            // Insert the message and metrics into the collection
            await collection.insertOne({
              sessionId: sessionId,
              text: message.content,
              mood: metrics.mood,
              keywords: metrics.keywords,
            });
          }
        }
      } catch (e) {
        throw e;
      }
    }
