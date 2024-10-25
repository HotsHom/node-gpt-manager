"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPTManager = void 0;
const FirstSuccess_strategy_1 = require("../strategies/FirstSuccess.strategy");
const Fallback_strategy_1 = require("../strategies/Fallback.strategy");
/**
 * Manager class responsible for managing GPT providers and configurations.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
class GPTManager {
    /**
     * Constructs a new GPTManager instance.
     *
     * @param providerClassMap - Map of GPT provider classes with their respective names as keys.
     */
    constructor(providerClassMap) {
        this.gptProviders = new Map();
        this.providerClassMap = providerClassMap;
        this.strategy = new FirstSuccess_strategy_1.FirstSuccessStrategy(this);
    }
    /**
     * Initializes the GPTManager with the specified configurations.
     *
     * @param gptConfigs - Initial configurations for GPT providers.
     * @returns A promise that resolves to the initialized GPTManager instance or null if initialization fails.
     */
    static async init(gptConfigs) {
        if (!GPTManager.instance) {
            const providers = Object.entries(gptConfigs).reduce((acc, [key, value]) => {
                acc[key] = value.provider;
                return acc;
            }, {});
            GPTManager.instance = new GPTManager(providers);
        }
        try {
            for (const gptName of Object.keys(gptConfigs)) {
                const config = gptConfigs[gptName];
                if (!config)
                    continue;
                await GPTManager.instance.addProvider(gptName, config);
                await GPTManager.instance.getGPTProvider(gptName).authenticate();
            }
            return GPTManager.instance;
        }
        catch (e) {
            console.error(e);
            return null;
        }
    }
    /**
     * Retrieves the singleton instance of GPTManager.
     *
     * @returns The singleton instance of GPTManager.
     */
    static getInstance() {
        return GPTManager.instance;
    }
    /**
     * Adds a GPT provider to the manager with the specified configuration.
     *
     * @param gptName - Name of the GPT provider.
     * @param config - Configuration for the GPT provider.
     * @returns A promise that resolves to true if the provider is added successfully, false otherwise.
     */
    async addProvider(gptName, config) {
        const ProviderClass = this.providerClassMap[gptName];
        if (!ProviderClass)
            return false;
        const newProvider = new ProviderClass(config, gptName);
        this.gptProviders.set(gptName, newProvider);
        return true;
    }
    /**
     * Retrieves the GPT provider instance with the specified name.
     *
     * @param gptName - Name of the GPT provider.
     * @returns The GPT provider instance.
     * @throws Error if the provider with the specified name is not found.
     */
    getGPTProvider(gptName) {
        const gptProvider = this.gptProviders.get(gptName);
        if (!gptProvider)
            throw new Error('GPT provider not found');
        return gptProvider;
    }
    /**
     * Retrieves a map of GPT provider instances with their respective names.
     *
     * @returns A map containing GPT provider instances with their names as keys.
     */
    getProvidersWithNamesMap() {
        return this.gptProviders;
    }
    /**
     * Sets the strategy for generating text using GPT models.
     *
     * @param {IStrategy} newStrategy - The new strategy to be set.
     * @return {void} No return value.
     */
    setStrategy(newStrategy) {
        this.strategy = newStrategy;
    }
    /**
     * Calls the completion method of the strategy with the given request and finishCallback.
     *
     * This method can be called in three different ways:
     * 1. With a request and a model name, to use a specific GPT model for completion.
     * 2. With a request and a finish callback, to use the default strategy for completion.
     * 3. With a request, a model name or a finish callback, and an optional finish callback.
     *
     * @param {GPTRequest} request - The request to be sent to the GPT models.
     * @param {TGPTNames} [model] - The name of the GPT model to use for completion.
     * @param {(gpt: BaseGPTConfig, gptName?: string) => Promise<void>} [finishCallback] - Optional callback function to be called after the completion.
     * @param onStreamCallback
     * @return {Promise<GPTMessageEntity | string>} - A promise that resolves to the generated text or throws an error.
     */
    completion(request, model, finishCallback, onStreamCallback) {
        if (model) {
            const fallbackStrategy = new Fallback_strategy_1.FallbackStrategy(this, model);
            return fallbackStrategy.completion(request, finishCallback, onStreamCallback);
        }
        return this.strategy.completion(request, finishCallback, onStreamCallback);
    }
    /**
     * Retrieves a list of available GPT providers with their respective names.
     *
     * @returns {AvailableModelsType<TGPTNames>} A list of objects containing GPT provider names as keys and their availability as values.
     */
    async getAvailableProviders() {
        const availableModels = Object.create(null);
        for (const [gptName, provider] of this.gptProviders) {
            availableModels[gptName] = {
                isAvailable: await provider.isAvailable(),
                extra: provider.getConfig().extra,
            };
        }
        return availableModels;
    }
}
exports.GPTManager = GPTManager;
