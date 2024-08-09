export type AvailableModelsType<TGPTNames extends string> = {
  [key in TGPTNames]: boolean;
};

export type ZeroToOne = number & { __type: 'ZeroToOne' };
