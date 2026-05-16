'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  codeString: string;
}

function CodeBlock({ language, codeString }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#282c34] shadow-sm group">
      {/* 顶部标题栏 / 复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 text-zinc-400 text-xs font-mono border-b border-zinc-800">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-all text-zinc-400"
          aria-label="复制代码"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      {/* 语法高亮区域 */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.85rem',
          lineHeight: '1.5',
          background: 'transparent',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // 1. 代码块与行内代码
        br() {
          return <br className="block my-1" />;
        },
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          if (!inline && match) {
            return (
              <CodeBlock
                language={match[1]}
                codeString={String(children).replace(/\n$/, '')}
              />
            );
          }
          return (
            <code
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono font-medium"
              {...props}
            >
              {children}
            </code>
          );
        },
        // 2. 表格相关
        table({ children, ...props }: any) {
          return (
            <div className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <table className="w-full border-collapse text-sm" {...props}>
                {children}
              </table>
            </div>
          );
        },
        thead({ children, ...props }: any) {
          return (
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300" {...props}>
              {children}
            </thead>
          );
        },
        tr({ children, ...props }: any) {
          return (
            <tr className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors" {...props}>
              {children}
            </tr>
          );
        },
        th({ children, ...props }: any) {
          return (
            <th className="p-3 text-left align-middle font-medium" {...props}>
              {children}
            </th>
          );
        },
        td({ children, ...props }: any) {
          return (
            <td className="p-3 align-middle text-zinc-600 dark:text-zinc-400" {...props}>
              {children}
            </td>
          );
        },
        // 3. 基础排版标签
        p({ children, ...props }: any) {
          return (
            <p className="my-2 leading-relaxed text-zinc-900 dark:text-zinc-100 first:mt-0 last:mb-0" {...props}>
              {children}
            </p>
          );
        },
        ul({ children, ...props }: any) {
          return (
            <ul className="my-2 ml-6 list-disc space-y-1 text-zinc-900 dark:text-zinc-100" {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }: any) {
          return (
            <ol className="my-2 ml-6 list-decimal space-y-1 text-zinc-900 dark:text-zinc-100" {...props}>
              {children}
            </ol>
          );
        },
        li({ children, ...props }: any) {
          return (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          );
        },
        h1({ children, ...props }: any) {
          return <h1 className="mt-6 mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50" {...props}>{children}</h1>;
        },
        h2({ children, ...props }: any) {
          return <h2 className="mt-5 mb-2.5 text-xl font-bold text-zinc-900 dark:text-zinc-50" {...props}>{children}</h2>;
        },
        h3({ children, ...props }: any) {
          return <h3 className="mt-4 mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-50" {...props}>{children}</h3>;
        },
        a({ children, ...props }: any) {
          return (
            <a className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors" target="_blank" rel="noreferrer" {...props}>
              {children}
            </a>
          );
        },
        blockquote({ children, ...props }: any) {
          return (
            <blockquote className="my-3 border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic text-zinc-600 dark:text-zinc-400" {...props}>
              {children}
            </blockquote>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
