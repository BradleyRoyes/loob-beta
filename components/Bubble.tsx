import React, { forwardRef, RefObject } from 'react';
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

  // Directly rendering children between Markdown tags to fix the ESLint error
  return (
    <div ref={ref as RefObject<HTMLDivElement>} className={`bubble mt-4 md:mt-6 pb-[7px] clear-both ${isUser ? 'float-right' : 'float-left'}`}>
      <div className={`flex justify-end ${isUser ? '' : 'flex-row-reverse'}`}>
        <div className={`talk-bubble ${isUser ? 'user' : ''} p-2 md:p-4`}>
          {content.processing ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="dot-flashing"></div>
            </div>
          ) : (
            <Markdown remarkPlugins={[remarkGfm]}>
              {content.content}
            </Markdown>
          )}
          {/* Tail SVG and other UI elements can be placed here */}
        </div>
      </div>
      {content.url && (
        <div className="flex justify-end mt-3">
          <Link href={content.url} passHref>
            <a className="chatbot-faq-link flex items-center px-2 py-0.5 text-sm font-semibold" target="_blank" rel="noopener noreferrer">
              View Source
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default forwardRef(Bubble);
