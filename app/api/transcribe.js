import { Configuration, OpenAIApi } from "openai";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Initialize OpenAI client
      const openai = new OpenAIApi(new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      }));

      // Assuming you're sending the file's base64 in the body under `fileBase64`
      const { fileBase64 } = req.body;

      // Decode the base64 file
      const audioBuffer = Buffer.from(fileBase64, 'base64');

      // Call Whisper API to transcribe the audio file
      const response = await openai.createTranscription({
        model: "whisper-large",
        audio: audioBuffer,
      });

      // Send the transcription back to the client
      res.status(200).json({ transcription: response.data.choices[0].text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error processing transcription request" });
    }
  } else {
    // Handle any non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}