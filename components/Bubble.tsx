import React, { forwardRef, RefObject, useEffect } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContent {
  role: string;
  content: string;
  processing?: boolean;
  url?: string;
}

const Bubble: React.ForwardRefRenderFunction<HTMLDivElement, MessageContent> = ({ content }, ref) => {
  const isUser = content.role === "user";

  // Function to parse the structured analysis data
  const parseAnalysis = (content: string) => {
    const analysisMarker = 'Analysis: ';
    const analysisStart = content.indexOf(analysisMarker);
    if (analysisStart !== -1) {
      try {
        const analysisJson = content.substring(analysisStart + analysisMarker.length);
        const analysis = JSON.parse(analysisJson.replace(/'/g, '"'));
        return { text: content.substring(0, analysisStart), analysis };
      } catch (error) {
        console.error('Error parsing analysis:', error);
        return { text: content, analysis: null };
      }
    }
    return { text: content, analysis: null };
  };

  const { text, analysis } = parseAnalysis(content.content);

  // Function to send analysis data to the server
  const sendAnalysisToServer = async (analysisData) => {
    try {
      await fetch('/api/chat/route', { // Replace '/api/yourEndpoint' with your actual API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'analysis',
          analysis: analysisData,
          // sessionId: sessionId, // Assuming sessionId is managed elsewhere and included in the body if needed
        }),
      });
    } catch (error) {
      console.error('Failed to send analysis data:', error);
    }
  };

  // Send analysis data to the server if present
  useEffect(() => {
    if (analysis) {
      sendAnalysisToServer(analysis);
    }
  }, [analysis]);

  return (
    <div ref={ref as RefObject<HTMLDivElement>} className={`block mt-4 md:mt-6 pb-[7px] clear-both ${isUser ? 'float-right' : 'float-left'}`}>
      <div className={`flex justify-end ${isUser ? '' : 'flex-row-reverse'}`}>
        <div className={`talk-bubble ${isUser ? 'user' : ''} p-2 md:p-4`}>
          {content.processing ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="dot-flashing"></div>
            </div>
          ) : (
            <Markdown remarkPlugins={[remarkGfm]} children={text} />
          )}
          {/* Tail SVG omitted for brevity */}
        </div>
      </div>
      {content.url && (
        <div className="flex justify-end mt-3">
          <Link href={content.url}>
            <a className="chatbot-faq-link flex items-center px-2 py-0.5 text-sm font-semibold" target="_blank">
              View Source
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default forwardRef(Bubble);
