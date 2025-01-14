export default async function generateDocContext(
    latestMessage: string,
    astraDb: any,
    openai: any
  ): Promise<string> {
    try {
      console.log("Generating embedding for user query...");
      
      // Generate embedding for the user query
      const embeddingRes = await openai.embeddings.create({
        input: latestMessage,
        model: "text-embedding-ada-002",
      });
      const userEmbedding = embeddingRes.data[0]?.embedding;
  
      if (!userEmbedding) {
        throw new Error("Failed to generate user embedding. Ensure OpenAI API response contains an embedding.");
      }
  
      console.log("Embedding successfully generated. Querying the database...");
  
      // Query the database for similar entries
      const libraryCollection = await astraDb.collection("library");
      const cursor = libraryCollection.find(
        {}, // Query all documents or apply filters if necessary
        {
          sort: {
            $vector: userEmbedding, // Vector similarity sort
          },
          limit: 5, // Limit the number of retrieved documents
        }
      );
  
      const documents = await cursor.toArray();
  
      if (!documents || documents.length === 0) {
        console.warn("No relevant listings found for the provided user query.");
        return "No relevant listings were found in the library.";
      }
  
      console.log(`Retrieved ${documents.length} document(s) from the database.`);
  
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
  