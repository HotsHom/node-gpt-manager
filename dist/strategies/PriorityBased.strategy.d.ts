import { IGPTManager } from '../gptManager/IGPTManager.interface';
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes';
import { IStrategy } from './IStrategy.interfrace';
import { BaseGPTConfig } from '../types/GPTConfig';
/**
 * Configuration for the priority of each GPT provider.
 */
interface PriorityConfig {
    [gptName: string]: number;
}
/**
 * Strategy that uses GPT providers based on their priority.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export declare class PriorityBasedStrategy<TGPTNames extends string> implements IStrategy {
    private manager;
    NAME: string;
    private priorities;
    /**
     * Constructs a new PriorityBasedStrategy.
     *
     * @param manager - Instance of the GPT manager.
     * @param priorities - Object defining the priority of each GPT provider.
     */
    constructor(manager: IGPTManager<TGPTNames>, priorities: PriorityConfig);
    /**
     * Attempts to generate text using GPT providers in order of their priority.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    completion(request: GPTRequest, finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>, onStreamCallback?: (chunk: string) => void): Promise<GPTMessageEntity | string | void>;
}
export {};