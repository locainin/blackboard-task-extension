import { useCallback, useRef, useState } from 'react';
import update, { Spec } from 'immutability-helper';
import { safeStorageSyncSet } from '../utils/extensionContext';

type StoreUpdateFunction<Type> = (
  root: string[], // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
) => Record<string, Type>;
type StoreDeleteFunction<Type> = (root: string[]) => Record<string, Type>;
type StoreInitFunction<Type> = (arg: Record<string, Type>) => void;
type StoreState<Type> = { [key: string]: Type };

export interface StoreInterface<Type> {
  state: StoreState<Type>;
  update: StoreUpdateFunction<Type>;
  delete: StoreDeleteFunction<Type>;
  initialize: StoreInitFunction<Type>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeSpec<Type>(root: string[], value: any) {
  // no error handling is done, assume all entries filled when initialized
  root.push(''); // leave one step for the final { $set: value } node
  const spec = root
    .reverse()
    .reduce((spec: Spec<Type, never>, key: string, i: number) => {
      if (i == 0) return { $set: value } as Spec<Type, never>;
      return { [key]: spec } as Spec<Type, never>;
    }, {} as Spec<Type, never>);
  return spec;
}
// nested state object store for dynamic data
// stored as a mapping from id to object of type Type
export function useObjectStore<Type>(
  arg: Record<string, Type>
): StoreInterface<Type> {
  const [state, updateState] = useState<Record<string, Type>>(arg);
  const cachedRef = useRef(state);

  // Keep a live copy around so fast back-to-back updates do not race each other
  cachedRef.current = state;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateKey = useCallback(function updateKey(
    root: string[],
    value: any
  ) {
    // Read from the ref instead of the render snapshot
    // This keeps rapid updates from overwriting each other
    const newState = update(
      cachedRef.current,
      makeSpec<Record<string, Type>>(root, value)
    );
    cachedRef.current = newState;
    updateState(newState);
    return newState;
  }, []);

  // for now, only deletes one root-level key from the passed argument
  const deleteKey = useCallback(function deleteKey(root: string[]) {
    // Deletes always target one top-level entry in this store
    const newState = update(cachedRef.current, { $unset: [root[0]] } as Spec<
      Record<string, Type>,
      never
    >);
    cachedRef.current = newState;
    updateState(newState);
    return newState;
  }, []);

  const initializeState = useCallback(function initializeState(
    arg: Record<string, Type>
  ) {
    // Replace the full object when a new Blackboard page is loaded
    cachedRef.current = arg;
    updateState(arg);
  }, []);

  return {
    state,
    update: updateKey,
    delete: deleteKey,
    initialize: initializeState,
  };
}

type ConfigStoreUpdateFunction<Type> = (
  root: string[], // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  write?: boolean
) => Type;

// Unique key-value store (i.e. configs) instead of object instance store
export type SyncStoreInterface<Type> = {
  state: Type;
  update: ConfigStoreUpdateFunction<Type>;
};

// useStore but with unique key-value properties (could be nested as well) instead of identical instance types
// writes can be synced to local/sync storage either directly or under a provided key
export function useConfigStore<Type extends Record<string, unknown>>(
  arg: Type,
  sync = false,
  syncKey = ''
): SyncStoreInterface<Type> {
  const [state, updateState] = useState<Type>(arg);
  const cachedRef = useRef(state);

  // Keep storage writes aligned with the latest in-memory state
  cachedRef.current = state;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateKey = useCallback(function updateKey(
    root: string[],
    value: any,
    write = true
  ) {
    const newState = update(cachedRef.current, makeSpec<Type>(root, value));
    cachedRef.current = newState;
    updateState(newState);
    if (sync && write) {
      // Some stores write under a wrapper key instead of the raw object
      // Use the computed property so the real storage key is updated
      const obj = syncKey ? { [syncKey]: newState } : newState;
      // Ignore writes from stale content scripts after an extension reload
      void safeStorageSyncSet(obj);
    }
    return newState;
  }, [sync, syncKey]);

  return { state: state, update: updateKey };
}
