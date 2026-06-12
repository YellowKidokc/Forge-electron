import { layerConfigs } from '../config/layers.ts';
import { useLayerContext } from '../context/LayerProvider.tsx';
import { useLayer } from '../hooks/useLayer.ts';

interface LayerToggleBarProps {
  articleVersion: number;
  gridActive: boolean;
  onToggleGrid: () => void;
}

function LayerRuntime({ articleVersion }: Pick<LayerToggleBarProps, 'articleVersion'>): JSX.Element {
  const { isLayerActive } = useLayerContext();
  for (const config of layerConfigs) {
    useLayer({ config, active: isLayerActive(config.id), articleVersion });
  }
  return <></>;
}

export function LayerToggleBar({ articleVersion, gridActive, onToggleGrid }: LayerToggleBarProps): JSX.Element {
  const { isLayerActive, toggleLayer } = useLayerContext();

  return (
    <div className="border-t border-zinc-900 bg-forge-card/95 px-4 py-3">
      <LayerRuntime articleVersion={articleVersion} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 font-display text-xs uppercase tracking-[0.24em] text-forge-amber">Layers</span>
        <button
          type="button"
          title="Show the addressable word grid underneath the document."
          onClick={onToggleGrid}
          className={`rounded-full border px-3 py-2 text-sm transition ${
            gridActive
              ? 'border-forge-accent bg-forge-accent text-white shadow-red-glow'
              : 'border-zinc-800 bg-black/30 text-forge-text hover:border-forge-amber hover:text-forge-bright'
          }`}
        >
          <span className="mr-2 font-mono">▦</span>
          Grid
        </button>
        {layerConfigs.map((layer) => {
          const active = isLayerActive(layer.id);
          return (
            <button
              key={layer.id}
              type="button"
              title={layer.description}
              onClick={() => toggleLayer(layer.id)}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                active
                  ? 'border-forge-accent bg-forge-accent text-white shadow-red-glow'
                  : 'border-zinc-800 bg-black/30 text-forge-text hover:border-forge-amber hover:text-forge-bright'
              }`}
            >
              <span className="mr-2 font-mono">{layer.icon}</span>
              {layer.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
