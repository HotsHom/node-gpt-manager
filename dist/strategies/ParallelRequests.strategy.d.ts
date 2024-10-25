import { IGPTManager } from '../gptManager/IGPTManager.interface';
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes';
import { IStrategy } from './IStrategy.interfrace';
import { BaseGPTConfig } from '../types/GPTConfig';
/**
 * Strategy that sends requests to multiple GPT providers in parallel and returns the first successful response.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export declare class ParallelRequestsStrategy<TGPTNames extends string> implements IStrategy {
    private manager;
    NAME: string;
    /**
     * Constructs a new ParallelRequestsStrategy.
     *
     * @param manager - Instance of the GPT manager.
     */
    constructor(manager: IGPTManager<TGPTNames>);
    /**
     * Attempts to generate text by sending requests to multiple GPT providers in parallel.
     * Returns the response from the first provider that succeeds.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    completion(request: GPTRequest, finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>, onStreamCallback?: (chunk: string) => void): Promise<GPTMessageEntity | string | void>;
}
