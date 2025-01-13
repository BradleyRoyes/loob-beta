export default async function generateDocContext(
    latestMessage: string,
    astraDb: any,
    openai: any
  ): Promise<string> {
    try {
      console.log("Generating embedding for user query...");
      const embeddingRes = await openai.embeddings.create({
        input: latestMessage,
        model: "text-embedding-ada-002",
      });
      const userEmbedding = embeddingRes.data[0]?.embedding;
      if (!userEmbedding) {
        throw new Error("Failed to generate user embedding.");
      }
  
      console.log("Querying the database for relevant entries...");
      const libraryCollection = await astraDb.collection("library");
      const cursor = libraryCollection.find(
        {}, // Adjust if specific conditions are needed
        {
          sort: {
            $vector: userEmbedding,
          },
          limit: 5,
        }
      );
  
      const documents = await cursor.toArray();
      if (documents.length === 0) {
        return "No relevant listings were found in the library.";
      }
  
      console.log("Formatting retrieved documents...");
      return documents
        .map((doc) => {
          if (doc.dataType === "memory") {
            return `
              Title: ${doc.title || "Untitled"}
              Content: ${doc.content || "No content available"}
            `;
          } else if (doc.dataType === "userEntry") {
            return `
              Title: ${doc.title || "Untitled"}
              Offering Type: ${doc.offeringType || "Unknown"}
              Description: ${doc.description || "No description available"}
              Location: ${doc.location || "Unknown"}
              Email: ${doc.email || "No email provided"}
              Phone: ${doc.phone || "No phone number provided"}
            `;
          } else {
            return "Unrecognized data type.";
          }
        })
        .join("\n\n");
    } catch (error) {
      console.error("Error generating document context:", error);
      return "An error occurred while retrieving library listings.";
    }
  }
  