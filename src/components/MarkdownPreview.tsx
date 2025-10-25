interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  // Simple markdown parser for preview
  const parseMarkdown = (text: string) => {
    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-serif font-bold mb-3 mt-6">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-serif font-bold mb-4 mt-6">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-serif font-bold mb-4 mt-6">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // Italic
    html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary-glow" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unordered lists
    html = html.replace(/^\- (.*)$/gim, '<li class="ml-6 list-disc">$1</li>');
    html = html.replace(/(<li class="ml-6 list-disc">.*<\/li>)/s, '<ul class="my-3">$1</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.*)$/gim, '<li class="ml-6 list-decimal">$1</li>');
    html = html.replace(/(<li class="ml-6 list-decimal">.*<\/li>)/s, '<ol class="my-3">$1</ol>');

    // Blockquotes
    html = html.replace(/^> (.*)$/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3">$1</blockquote>');

    // Tables - basic support
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      const headers = lines[0].split('|').filter(cell => cell.trim());
      const rows = lines.slice(2).map(line => 
        line.split('|').filter(cell => cell.trim())
      );

      let table = '<table class="w-full border-collapse my-4"><thead><tr>';
      headers.forEach(header => {
        table += `<th class="border border-border px-4 py-2 bg-muted font-semibold text-left">${header.trim()}</th>`;
      });
      table += '</tr></thead><tbody>';
      
      rows.forEach(row => {
        table += '<tr>';
        row.forEach(cell => {
          table += `<td class="border border-border px-4 py-2">${cell.trim()}</td>`;
        });
        table += '</tr>';
      });
      
      table += '</tbody></table>';
      return table;
    });

    // Line breaks
    html = html.replace(/\n$/gim, '<br>');

    return html;
  };

  return (
    <div
      className="prose prose-sm max-w-none font-serif"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
