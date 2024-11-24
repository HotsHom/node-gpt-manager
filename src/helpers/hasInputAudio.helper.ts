import { GPTRequest } from '../types/GPTRequestTypes'

/**
 * Проверяет, есть ли в массиве сообщений сообщение с input_audio.
 * @param messages Массив сообщений GPTMessageEntity.
 * @returns true, если хотя бы одно сообщение содержит input_audio, иначе false.
 */
export function hasInputAudio(messages: GPTRequest) {
  if (typeof messages === 'string') return false

  return messages.some(message => {
    if (Array.isArray(message.content)) {
      return message.content.some(item => item.type === 'input_audio')
    } else if (typeof message.content === 'object' && message.content !== null) {
      return message.content.type === 'input_audio'
    }
    return false
  })
}
