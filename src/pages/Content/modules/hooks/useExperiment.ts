import { ExperimentConfig } from '../types';
import { CLIENT_ID_LENGTH, EXPERIMENT_CONFIG_URL } from '../constants';
import { useEffect, useMemo, useContext, useState } from 'react';
import { ExperimentsContext } from '../contexts/contexts';
import axios from 'axios';
import {
  safeStorageSyncGet,
  safeStorageSyncSet,
} from '../utils/extensionContext';

// cryptographically secure random number of length N
// https://codeql.github.com/codeql-query-help/javascript/js-biased-cryptographic-random/
function generateRandomNumber(length: number): string {
  let num = '';
  let i = 0;
  while (num.length < length) {
    i += 1;
    if (i > 100) break; // failsafe to not hang everything in case something breaks
    const byte = window.crypto.getRandomValues(new Uint8Array(1))[0];
    if (byte >= 250) {
      continue;
    }
    num += (byte % 10).toString();
  }

  return num;
}

async function getClientId(): Promise<string> {
  // Reuse the stored id so experiment buckets stay stable across sessions
  const result = await safeStorageSyncGet<Record<string, unknown>>(
    ['client_id'],
    {}
  );
  const clientId = result['client_id'];
  if (typeof clientId === 'string' && clientId) {
    return clientId;
  }

  const nextClientId = generateRandomNumber(CLIENT_ID_LENGTH);
  await safeStorageSyncSet({ client_id: nextClientId });
  return nextClientId;
}

async function getExperimentConfigs(): Promise<ExperimentConfig[]> {
  try {
    const res = await axios.get(EXPERIMENT_CONFIG_URL);
    return (await res.data)['experiments'] as ExperimentConfig[];
  } catch (err) {
    return [];
  }
}

export interface ExperimentsHubInterface {
  configs: ExperimentConfig[];
  userId: string;
}

export function useExperiments(): ExperimentsHubInterface {
  const [userId, setUserId] = useState<string>('');
  const [experimentConfigs, setExperimentConfigs] = useState<
    ExperimentConfig[]
  >([]);

  useEffect(() => {
    let active = true;

    async function loadExperiments() {
      const [configs, id] = await Promise.all([
        getExperimentConfigs(),
        getClientId(),
      ]);

      // Blackboard navigation can unmount this tree while async work is in flight
      // Ignore late results instead of updating dead state
      if (!active) return;

      setExperimentConfigs(configs);
      setUserId(id);
    }

    void loadExperiments();
    return () => {
      active = false;
    };
  }, []);

  return { configs: experimentConfigs, userId };
}

export interface ExperimentInterface {
  config: ExperimentConfig | null;
  userId: string;
  treated: boolean;
}

export function useExperiment(id: string): ExperimentInterface {
  const exp = useContext(ExperimentsContext);
  const config = useMemo<ExperimentConfig | null>(
    // Derive the active config straight from the latest hub data
    // This keeps the hook in sync when the caller switches experiment ids
    () => exp.configs.find((configEntry) => configEntry.id === id) ?? null,
    [exp.configs, id]
  );

  const treated = useMemo(() => {
    if (!exp.userId || !config) {
      return false;
    }

    if (new Date(config.start_time).valueOf() > Date.now()) {
      return false;
    }

    const rolloutSeed =
      (parseInt(exp.userId.slice(CLIENT_ID_LENGTH - 2)) +
        config.random_offset) %
      100;
    const treatmentSeed =
      (parseInt(exp.userId.slice(CLIENT_ID_LENGTH - 4, CLIENT_ID_LENGTH - 2)) +
        config.random_offset) %
      100;

    return rolloutSeed < config.rollout && treatmentSeed < config.treatment_split;
  }, [config, exp.userId]);

  return { config, userId: exp.userId, treated };
}
