import dotenv from "dotenv"; // Import dotenv
import generateDocContext from "./generateDocContext";
import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from "openai";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Log the loaded environment variables for debugging
console.log("Loaded Environment Variables:", process.env);

async function test() {
  try {
    // Ensure the OpenAI API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API Key. Ensure OPENAI_API_KEY is set in .env.local.");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Ensure AstraDB credentials exist
    if (
      !process.env.ASTRA_DB_APPLICATION_TOKEN ||
      !process.env.ASTRA_DB_ENDPOINT ||
      !process.env.ASTRA_DB_NAMESPACE
    ) {
      throw new Error("Missing AstraDB credentials in .env.local.");
    }

    const astraDb = new AstraDB(
      process.env.ASTRA_DB_APPLICATION_TOKEN,
      process.env.ASTRA_DB_ENDPOINT,
      process.env.ASTRA_DB_NAMESPACE
    );

    // Example user query
    const latestMessage = "I need speakers for a medium-sized event.";
    console.log("Generating document context for message:", latestMessage);

    const context = await generateDocContext(latestMessage, astraDb, openai);
    console.log("Generated Document Context:\n", context);
  } catch (error) {
    console.error("Error during test:", error);
  }
}

test();
