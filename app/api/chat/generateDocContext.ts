import { AstraDB } from "@datastax/astra-db-ts";
import OpenAI from "openai";

export default async function generateDocContext(
  latestMessage: string,
  astraDb: AstraDB,
  openai: OpenAI,
  contextPath?: string
): Promise<string> {
  try {
    console.log("Generating embedding for user query...");
    
    // Generate embedding for the user query
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: latestMessage,
    });

    const embedding = embeddingRes.data[0].embedding;
    const messagesCollection = await astraDb.collection("messages");

    // Build the query based on contextPath
    const query: any = {
      $vector: embedding,
    };

    // If contextPath is provided, add it to the query
    if (contextPath) {
      query.contextPath = contextPath;
    }

    // Find similar documents
    const documents = await messagesCollection
      .find(query, {
        sort: {
          $vector: embedding,
        },
        limit: 5,
      })
      .toArray();

    if (!documents || documents.length === 0) {
      console.log("No relevant documents found.");
      return "";
    }

    // Format retrieved documents
    const formattedDocuments = documents.map((doc) => {
      const title = doc.title || "Untitled";
      
      if (doc.dataType === "memory") {
        return `Title: ${title}\nContent: ${doc.content || "No content available"}`;
      } else if (doc.dataType === "userEntry") {
        return `
          Title: ${title}
          Offering Type: ${doc.offeringType || "Unknown"}
          Description: ${doc.description || "No description available"}
          Location: ${doc.location || "Unknown"}
          Email: ${doc.email || "No email provided"}
          Phone: ${doc.phone || "No phone number provided"}
        `;
      } else {
        return `Title: ${title}\nData Type: Unrecognized`;
      }
    });

    console.log("Formatted retrieved documents successfully.");

    return formattedDocuments.join("\n\n");
  } catch (error) {
    console.error("Error generating document context:", error);
    return "An error occurred while retrieving library listings. Please try again later.";
  }
}
  