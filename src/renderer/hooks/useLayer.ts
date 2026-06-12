import { useEffect } from 'react';
import type { LayerConfig } from '../config/layers.ts';

interface UseLayerOptions {
  config: LayerConfig;
  active: boolean;
  articleVersion: number;
}

function tagId(config: LayerConfig, kind: 'script' | 'style'): string {
  return `forge-layer-${config.id}-${kind}`;
}

function removeElement(id: string): void {
  document.getElementById(id)?.remove();
}

function jsonDataUrl(json: string): string {
  return `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
}

function unwrapAll(selector: string): void {
  document.querySelectorAll(selector).forEach((node) => {
    const parent = node.parentNode;
    if (!parent) return;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    node.remove();
    parent.normalize();
  });
}

function cleanupLayer(config: LayerConfig): void {
  removeElement(tagId(config, 'script'));
  removeElement(tagId(config, 'style'));

  if (config.id === 'claims') {
    unwrapAll('.claim-tag');
    document.querySelectorAll('[data-claim-processed]').forEach((node) => node.removeAttribute('data-claim-processed'));
  }

  if (config.id === 'glossary') {
    unwrapAll('.gloss-term');
    document.querySelectorAll('.glossary-tooltip, .glossary-panel').forEach((node) => node.remove());
  }

  if (config.id === 'equations') {
    document.body.classList.remove('level-easy', 'level-standard', 'level-academic', 'level-proof');
    document.querySelectorAll('.mtl-body').forEach((node) => node.remove());
    document.querySelectorAll('.mtl-dot, .mtl-label, .mtl-chevron, .mtl-audio').forEach((node) => node.remove());
    document.querySelectorAll('[data-mtl-prepared], [data-mtl-status], [data-mtl-mapped-from], [data-mtl-mapped-to]').forEach((node) => {
      node.removeAttribute('data-mtl-prepared');
      node.removeAttribute('data-mtl-status');
      node.removeAttribute('data-mtl-mapped-from');
      node.removeAttribute('data-mtl-mapped-to');
    });
  }

  if (config.id === 'audio' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

async function injectLayer(config: LayerConfig): Promise<void> {
  cleanupLayer(config);

  if (config.stylePath) {
    const css = await window.forge.readSharedAsset(config.stylePath);
    const style = document.createElement('style');
    style.id = tagId(config, 'style');
    style.dataset.forgeLayer = config.id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  const scriptSource = await window.forge.readSharedAsset(config.scriptPath);
  const script = document.createElement('script');
  script.id = tagId(config, 'script');
  script.dataset.forgeLayer = config.id;

  if (config.dataPath) {
    const data = await window.forge.readSharedAsset(config.dataPath);
    if (config.id === 'glossary') script.dataset.glossaryJson = jsonDataUrl(data);
    if (config.id === 'equations') script.dataset.mtlJson = jsonDataUrl(data);
  }

  if (config.mappingPath) {
    const mapping = await window.forge.readSharedAsset(config.mappingPath);
    script.dataset.mtlMapping = jsonDataUrl(mapping);
  }

  script.textContent = scriptSource;
  document.body.appendChild(script);
}

export function useLayer({ config, active, articleVersion }: UseLayerOptions): void {
  useEffect(() => {
    let cancelled = false;

    if (!active) {
      cleanupLayer(config);
      return undefined;
    }

    void injectLayer(config).then(() => {
      if (cancelled) cleanupLayer(config);
    });

    return () => {
      cancelled = true;
      cleanupLayer(config);
    };
  }, [active, articleVersion, config]);
}
