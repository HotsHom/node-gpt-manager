import { GPTContentOfMessage, GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes';

export function hasInputPDFHelper(messages: GPTRequest) {
  if (typeof messages === 'string') return false;

  return messages.some(message => {
    if (Array.isArray(message.content)) {
      return message.content.some(item => item.type === 'pdf_url');
    } else if (typeof message.content === 'object' && message.content !== null) {
      return message.content.type === 'pdf_url';
    }
    return false;
  });
}

export function getLastPDFUrl(messages: GPTRequest): string | null {
  if (typeof messages === 'string') return null;

  const lastPdfMessage = messages.find(message => {
    if (typeof message.content === 'string') return false;

    if (Array.isArray(message.content)) {
      return message.content.some(item => (item).type === 'pdf_url');
    }

    return message.content.type === 'pdf_url';
  });

  if (!lastPdfMessage || typeof lastPdfMessage.content === 'string') return null;

  if (Array.isArray(lastPdfMessage.content)) {
    const pdfItem = lastPdfMessage.content.find(item => item.type === 'pdf_url');
    return pdfItem?.pdf_url?.url || null;
  }

  return lastPdfMessage.content.pdf_url?.url || null;
}
