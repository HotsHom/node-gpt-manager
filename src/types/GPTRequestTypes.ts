import { GPTRoles } from '../constants/GPTRoles'

/**
 * Type representing a request to be sent to GPT models.
 */
export type GPTRequest = GPTMessageEntity[] | string
/**
 * Type representing a message entity for GPT requests.
 */
export type GPTMessageEntity = {
  /**
   * Role of the message entity.
   */
  role: GPTRoles
  /**
   * Content of the message entity.
   */
  content: string | GPTContentOfMessage | GPTContentOfMessage[]
}
export type GPTContentOfMessage = {
  type: 'text' | 'image_url' | 'input_audio' | 'pdf_url'
  text?: string
  image_url?: {
    url: string
    detail?: string
  }
  input_audio?: {
    data: string
    format: 'mp3' | 'wav'
  }
  pdf_url?: {
    url: string
  }
}
