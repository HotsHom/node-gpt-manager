"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelRequestsStrategy = void 0;
/**
 * Strategy that sends requests to multiple GPT providers in parallel and returns the first successful response.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
class ParallelRequestsStrategy {
    /**
     * Constructs a new ParallelRequestsStrategy.
     *
     * @param manager - Instance of the GPT manager.
     */
    constructor(manager) {
        this.manager = manager;
        this.NAME = 'ParallelRequests';
    }
    /**
     * Attempts to generate text by sending requests to multiple GPT providers in parallel.
     * Returns the response from the first provider that succeeds.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    async completion(request, finishCallback, onStreamCallback) {
        const providers = Array.from(this.manager.getProvidersWithNamesMap().entries()).map(async (gptProviderWithName) => {
            const provider = gptProviderWithName[1];
            const response = await provider.completion(request, onStreamCallback);
            return {
                config: provider.getConfig(),
                name: gptProviderWithName[0],
                response,
            };
        });
        try {
            const result = await Promise.any(providers);
            finishCallback && (await finishCallback(result.config, result.name));
            return result.response;
        }
        catch (error) {
            throw new Error('All providers failed to generate text');
        }
    }
}
exports.ParallelRequestsStrategy = ParallelRequestsStrategy;
