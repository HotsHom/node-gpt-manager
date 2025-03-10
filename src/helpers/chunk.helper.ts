import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { GPTContentOfMessage, GPTMessageEntity } from '../types/GPTRequestTypes';
import { GPTRoles } from '../constants/GPTRoles';

export interface ChunkOptions {
  maxTokens?: number;
  overlap?: number;
  model?: TiktokenModel;
}

export function chunkMessages(
  messages: GPTMessageEntity[],
  options: ChunkOptions = {}
): GPTMessageEntity[][] {
  const { maxTokens = 2048, overlap = 200, model = 'gpt-4o' } = options;
  const tokenizer = encoding_for_model(model);

  const extractText = (content: string | GPTContentOfMessage | GPTContentOfMessage[]): string => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map(extractText).join(' ');
    if ('type' in content && content.type === 'text' && content.text) return content.text;
    return '';
  };

  const chunks: GPTMessageEntity[][] = [];
  let currentChunk: GPTMessageEntity[] = [];
  let tokenCount = 0;

  for (const message of messages) {
    if (
      typeof message.content !== 'string' &&
      !Array.isArray(message.content) &&
      'type' in message.content &&
      (message.content.type === 'image_url' || message.content.type === 'input_audio')
    ) {
      currentChunk.push(message);
      continue;
    }

    const textContent = extractText(message.content);
    const tokens = tokenizer.encode(textContent);

    if (tokenCount + tokens.length > maxTokens) {
      if (currentChunk.length) chunks.push([...currentChunk]);
      currentChunk = currentChunk.slice(-overlap);
      tokenCount = tokenizer.encode(currentChunk.map(m => extractText(m.content)).join(' ')).length;
    }

    currentChunk.push(message);
    tokenCount += tokens.length;
  }

  if (currentChunk.length) chunks.push(currentChunk);

  if (chunks.length === 0) {
    chunks.push([{ role: GPTRoles.USER, content: ' ' }]);
  }

  return chunks;
}
