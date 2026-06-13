import { createContext, useContext, useMemo, useState } from 'react';
import type { LayerId } from '../config/layers.ts';

interface LayerContextValue {
  activeLayers: LayerId[];
  isLayerActive: (layerId: LayerId) => boolean;
  toggleLayer: (layerId: LayerId) => void;
}

interface LayerProviderProps {
  children: JSX.Element | JSX.Element[];
}

const storageKey = 'forge.activeLayers';
const LayerContext = createContext<LayerContextValue | null>(null);

function readInitialLayers(): LayerId[] {
  const raw = globalThis.localStorage?.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LayerId => item === 'claims' || item === 'equations' || item === 'glossary' || item === 'audio');
  } catch {
    return [];
  }
}

export function LayerProvider({ children }: LayerProviderProps): JSX.Element {
  const [activeLayers, setActiveLayers] = useState<LayerId[]>(readInitialLayers());

  const value = useMemo<LayerContextValue>(() => {
    const persist = (nextLayers: LayerId[]): void => {
      globalThis.localStorage?.setItem(storageKey, JSON.stringify(nextLayers));
    };

    return {
      activeLayers,
      isLayerActive: (layerId) => activeLayers.includes(layerId),
      toggleLayer: (layerId) => {
        setActiveLayers((currentLayers) => {
          const nextLayers = currentLayers.includes(layerId)
            ? currentLayers.filter((currentLayer) => currentLayer !== layerId)
            : [...currentLayers, layerId];
          persist(nextLayers);
          return nextLayers;
        });
      }
    };
  }, [activeLayers]);

  return <LayerContext.Provider value={value}>{children}</LayerContext.Provider>;
}

export function useLayerContext(): LayerContextValue {
  const context = useContext(LayerContext);
  if (!context) throw new Error('useLayerContext must be used inside LayerProvider');
  return context;
}
