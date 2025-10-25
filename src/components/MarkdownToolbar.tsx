import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Table,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MarkdownToolbarProps {
  onInsert: (before: string, after?: string) => void;
}

export function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const tools = [
    { icon: Bold, label: 'Bold', before: '**', after: '**' },
    { icon: Italic, label: 'Italic', before: '_', after: '_' },
    { icon: Strikethrough, label: 'Strikethrough', before: '~~', after: '~~' },
    { icon: Code, label: 'Code', before: '`', after: '`' },
  ];

  const headingTools = [
    { icon: Heading1, label: 'Heading 1', before: '# ', after: undefined },
    { icon: Heading2, label: 'Heading 2', before: '## ', after: undefined },
    { icon: Heading3, label: 'Heading 3', before: '### ', after: undefined },
  ];

  const listTools = [
    { icon: List, label: 'Bullet List', before: '- ', after: undefined },
    { icon: ListOrdered, label: 'Numbered List', before: '1. ', after: undefined },
    { icon: Quote, label: 'Quote', before: '> ', after: undefined },
  ];

  const insertTable = () => {
    const table = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
    onInsert(table);
  };

  const insertLink = () => {
    onInsert('[', '](url)');
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-b border-border/50 bg-muted/30">
        {tools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onInsert(tool.before, tool.after)}
                className="h-8 w-8 p-0"
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {headingTools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onInsert(tool.before, tool.after)}
                className="h-8 w-8 p-0"
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {listTools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onInsert(tool.before, tool.after)}
                className="h-8 w-8 p-0"
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertLink}
              className="h-8 w-8 p-0"
            >
              <Link className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert Link</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertTable}
              className="h-8 w-8 p-0"
            >
              <Table className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert Table</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
