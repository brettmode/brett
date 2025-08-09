import React from 'react';

interface FormattedMessageProps {
  message: string;
}

export default function FormattedMessage({ message }: FormattedMessageProps) {
  // Function to parse and format the message
  const formatMessage = (text: string) => {
    // Split by lines to handle each line individually
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    let currentIndex = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - add some spacing
        continue;
      }
      
      // Check if this line starts with a number (numbered list item)
      const listMatch = trimmedLine.match(/^(\d+\.\s)(.*)/);
      
      if (listMatch) {
        // This is a numbered list item
        const [, listNumber, content] = listMatch;
        elements.push(
          <div key={currentIndex++} className="flex gap-3 mb-3">
            <span className="text-blue-400 font-medium text-sm mt-0.5 flex-shrink-0">
              {listNumber}
            </span>
            <div className="flex-1 text-gray-100">
              {formatTextWithLinks(content)}
            </div>
          </div>
        );
      } else {
        // Regular paragraph text
        elements.push(
          <p key={currentIndex++} className="text-base leading-relaxed text-gray-100 mb-4">
            {formatTextWithLinks(trimmedLine)}
          </p>
        );
      }
    }
    
    return elements;
  };

  // Function to format links and bold text within a text string
  const formatTextWithLinks = (text: string) => {
    // Pattern to match [text](url) markdown links
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(linkPattern);
    
    const elements: (string | React.ReactElement)[] = [];
    
    for (let i = 0; i < parts.length; i += 3) {
      // Regular text
      if (parts[i]) {
        elements.push(parts[i]);
      }
      
      // Link text and URL (if they exist)
      if (parts[i + 1] && parts[i + 2]) {
        elements.push(
          <a
            key={i}
            href={parts[i + 2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            {parts[i + 1]}
          </a>
        );
      }
    }
    
    return elements;
  };

  return (
    <div className="space-y-2">
      {formatMessage(message)}
    </div>
  );
}
