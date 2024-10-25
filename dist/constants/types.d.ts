export type AvailableModelsType<TGPTNames extends string> = {
    [key in TGPTNames]: {
        isAvailable: boolean;
        extra?: Record<string, unknown>;
    };
};
