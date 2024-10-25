import { IGPTManager } from '../gptManager/IGPTManager.interface';
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes';
import { IStrategy } from './IStrategy.interfrace';
import { BaseGPTConfig } from '../types/GPTConfig';
/**
 * Strategy that attempts to use a primary GPT provider and falls back to others if it fails.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export declare class FallbackStrategy<TGPTNames extends string> implements IStrategy {
    private manager;
    NAME: string;
    private readonly primaryModelName;
    private readonly fallbackModelNames;
    /**
     * Constructs a new FallbackStrategy.
     *
     * @param manager - Instance of the GPT manager.
     * @param primaryModelName - Name of the primary GPT provider.
     */
    constructor(manager: IGPTManager<TGPTNames>, primaryModelName: TGPTNames);
    /**
     * Attempts to generate text using the primary GPT provider, and falls back to other providers if the primary fails.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    completion(request: GPTRequest, finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>, onStreamCallback?: (chunk: string) => void): Promise<GPTMessageEntity | string | void>;
}
