import React from 'react';

// Helper to parse inline markdown: bold, italic, inline code, links
function parseInline(text) {
  if (!text) return null;

  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    // Check link: [text](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-accent hover:underline font-semibold"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Check bold: **text**
    const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={index} className="font-bold text-navy-dark">
          {boldMatch[1]}
        </strong>
      );
    }

    // Check inline code: `code`
    const codeMatch = part.match(/^`(.*?)`$/);
    if (codeMatch) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-gray-100 text-navy-dark font-mono text-[11px] border border-gray-200"
        >
          {codeMatch[1]}
        </code>
      );
    }

    // Check italic: *text*
    const italicMatch = part.match(/^\*(.*?)\*$/);
    if (italicMatch) {
      return (
        <em key={index} className="italic">
          {italicMatch[1]}
        </em>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let currentListType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (currentListType === 'ol') {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="list-decimal list-outside ml-5 space-y-1 my-2 text-xs text-text-primary leading-relaxed"
          >
            {currentList.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="space-y-1.5 my-2 text-xs text-text-primary leading-relaxed"
          >
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-teal-accent font-bold select-none">•</span>
                <span>{parseInline(item)}</span>
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      currentListType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Horizontal Rule
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={idx} className="my-3 border-gray-200" />);
      return;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1
          key={idx}
          className="text-lg sm:text-xl font-bold text-navy-dark mt-4 mb-2 pb-1 border-b border-gray-200 tracking-tight"
        >
          {parseInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2
          key={idx}
          className="text-base sm:text-lg font-bold text-navy-dark mt-3.5 mb-1.5 flex items-center gap-1.5 tracking-tight"
        >
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3
          key={idx}
          className="text-sm font-bold text-navy-secondary mt-2.5 mb-1 tracking-tight"
        >
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    // Heading 4
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4
          key={idx}
          className="text-xs font-bold text-teal-accent uppercase tracking-wider mt-2 mb-1"
        >
          {parseInline(trimmed.slice(5))}
        </h4>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={idx}
          className="border-l-3 border-teal-accent bg-teal-light/20 px-3.5 py-2 my-2 rounded-r-xl text-xs italic text-navy-dark leading-relaxed"
        >
          {parseInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Ordered List item (e.g., 1. Item)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (currentListType && currentListType !== 'ol') flushList();
      currentListType = 'ol';
      currentList.push(olMatch[2]);
      return;
    }

    // Unordered List item (e.g., - Item or * Item)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentListType && currentListType !== 'ul') flushList();
      currentListType = 'ul';
      currentList.push(trimmed.slice(2));
      return;
    }

    // Normal paragraph text
    flushList();
    elements.push(
      <p
        key={idx}
        className="text-xs leading-relaxed text-text-primary my-1.5 font-normal"
      >
        {parseInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className={`markdown-body ${className}`}>{elements}</div>;
}
