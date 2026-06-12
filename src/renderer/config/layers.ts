export type LayerId = 'claims' | 'equations' | 'glossary' | 'audio';

export interface LayerConfig {
  id: LayerId;
  label: string;
  icon: string;
  scriptPath: string;
  stylePath?: string;
  dataPath?: string;
  mappingPath?: string;
  description: string;
}

export const layerConfigs: LayerConfig[] = [
  {
    id: 'claims',
    label: 'Claims',
    icon: '◇',
    scriptPath: 'js/claim-layer.js',
    stylePath: 'css/claim-layer.css',
    description: 'Highlights claims and connects them to proof-panel evidence.'
  },
  {
    id: 'equations',
    label: 'Equations',
    icon: 'Σ',
    scriptPath: 'js/mtl-equation.js',
    stylePath: 'css/mtl-equation.css',
    dataPath: 'data/mtl-equations.json',
    mappingPath: 'data/eq-id-mapping.json',
    description: 'Enables the Math Translation Layer for equation callouts.'
  },
  {
    id: 'glossary',
    label: 'Glossary',
    icon: 'G',
    scriptPath: 'js/glossary-layer.js',
    stylePath: 'css/glossary-layer.css',
    dataPath: 'data/glossary-terms.json',
    description: 'Wraps glossary terms and shows hover/click definitions.'
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: '▶',
    scriptPath: 'js/mda-browser-tts.js',
    description: 'Activates browser text-to-speech controls for article audio.'
  }
];
