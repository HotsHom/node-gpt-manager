"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirstSuccessStrategy = void 0;
/**
 * Strategy that attempts to get a response from the first GPT model that successfully generates text.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
class FirstSuccessStrategy {
    /**
     * Constructs a new FirstSuccessStrategy.
     *
     * @param manager - Instance of the GPT manager.
     */
    constructor(manager) {
        this.manager = manager;
        this.NAME = 'FirstSuccess';
    }
    /**
     * Attempts to generate text using the first GPT provider that succeeds.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    async completion(request, finishCallback, onStreamCallback) {
        for (const gptProviders of this.manager.getProvidersWithNamesMap()) {
            try {
                const provider = gptProviders[1];
                const response = await provider.completion(request, onStreamCallback);
                if (response) {
                    finishCallback && (await finishCallback(provider.getConfig(), gptProviders[0]));
                    return response;
                }
            }
            catch (error) {
                console.warn(`Provider ${gptProviders[0]} failed: ${error}`);
            }
        }
        throw new Error('All providers failed to generate text');
    }
}
exports.FirstSuccessStrategy = FirstSuccessStrategy;
