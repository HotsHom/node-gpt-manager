"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackStrategy = void 0;
/**
 * Strategy that attempts to use a primary GPT provider and falls back to others if it fails.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
class FallbackStrategy {
    /**
     * Constructs a new FallbackStrategy.
     *
     * @param manager - Instance of the GPT manager.
     * @param primaryModelName - Name of the primary GPT provider.
     */
    constructor(manager, primaryModelName) {
        this.manager = manager;
        this.NAME = 'Fallback';
        this.primaryModelName = primaryModelName;
        this.fallbackModelNames = Array.from(manager.getProvidersWithNamesMap().entries())
            .filter(item => item[0] !== primaryModelName)
            .map(item => item[0]);
    }
    /**
     * Attempts to generate text using the primary GPT provider, and falls back to other providers if the primary fails.
     *
     * @param request - The request to be sent to the GPT models.
     * @param finishCallback
     * @param onStreamCallback
     * @returns A promise that resolves to the generated text or throws an error if all providers fail.
     */
    async completion(request, finishCallback, onStreamCallback) {
        const models = [this.primaryModelName, ...this.fallbackModelNames];
        for (const gptName of models) {
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
exports.FallbackStrategy = FallbackStrategy;
