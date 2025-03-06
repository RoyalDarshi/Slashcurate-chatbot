// TextContent.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TextContent = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => (
          <p className="whitespace-pre-wrap break-words" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default TextContent;
