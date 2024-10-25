import { IGPTManager } from '../gptManager/IGPTManager.interface';
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes';
import { IStrategy } from './IStrategy.interfrace';
import { BaseGPTConfig } from '../types/GPTConfig';
/**
 * Strategy that attempts to get a response from the first GPT model that successfully generates text.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export declare class FirstSuccessStrategy<TGPTNames extends string> implements IStrategy {
    private manager;
    NAME: string;
    /**
     * Constructs a new FirstSuccessStrategy.
     *
     * @param manager - Instance of the GPT manager.
     */
    constructor(manager: IGPTManager<TGPTNames>);
    /**
     * Attempts to generate text using the first GPT provider that succeeds.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    completion(request: GPTRequest, finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>, onStreamCallback?: (chunk: string) => void): Promise<GPTMessageEntity | string | void>;
}
