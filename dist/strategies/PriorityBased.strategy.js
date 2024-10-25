"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityBasedStrategy = void 0;
/**
 * Strategy that uses GPT providers based on their priority.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
class PriorityBasedStrategy {
    /**
     * Constructs a new PriorityBasedStrategy.
     *
     * @param manager - Instance of the GPT manager.
     * @param priorities - Object defining the priority of each GPT provider.
     */
    constructor(manager, priorities) {
        this.manager = manager;
        this.NAME = 'PriorityBased';
        this.priorities = priorities;
    }
    /**
     * Attempts to generate text using GPT providers in order of their priority.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    async completion(request, finishCallback, onStreamCallback) {
        const sortedProviders = Array.from(this.manager.getProvidersWithNamesMap().entries())
            .sort((a, b) => {
            const priorityA = this.priorities[a[0]] || 0;
            const priorityB = this.priorities[b[0]] || 0;
            return priorityA - priorityB;
        })
            .map(entry => entry[0]);
        for (const gptName of sortedProviders) {
            try {
                const provider = this.manager.getGPTProvider(gptName);
                const response = await provider.completion(request, onStreamCallback);
                if (response) {
                    finishCallback && (await finishCallback(provider.getConfig(), gptName));
                    return response;
                }
            }
            catch (error) {
                console.warn(`Provider ${gptName} failed: ${error}`);
            }
        }
        throw new Error('All providers failed to generate text');
    }
}
exports.PriorityBasedStrategy = PriorityBasedStrategy;
