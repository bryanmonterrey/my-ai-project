'use client';

import { useState, useCallback } from 'react';
import { SystemConfig, ModelType, DEFAULT_SYSTEM_CONFIGS } from '@/app/types/index.js';

export function useSystemConfig(initialModel: ModelType = 'gpt-4o') {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIGS[initialModel]);

  const updateConfig = useCallback((updates: Partial<SystemConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const setModel = useCallback((model: ModelType) => {
    setConfig(DEFAULT_SYSTEM_CONFIGS[model]);
  }, []);

  return {
    config,
    updateConfig,
    setModel
  };
}