export interface CommentaryItem {
  label: string;
  value: string;
}

export interface BlockLayerData {
  easy?: string;
  academic?: string;
  math_translation?: string;
  commentary?: CommentaryItem[];
}

export interface LayerDocument {
  document_id: string;
  layers: Record<string, BlockLayerData>;
}

export interface Claim {
  id: string;
  block_id: string;
  claim: string;
  evidence: string[];
  kill_condition?: string;
  confidence?: number | null;
}

export interface ClaimsDocument {
  document_id: string;
  claims: Claim[];
}

export interface SidecarLoadStatus {
  path: string;
  loaded: boolean;
}

export interface LoadedLayers {
  layerDocument?: LayerDocument;
  claimsDocument?: ClaimsDocument;
  layersByBlock: Record<string, BlockLayerData>;
  claimsByBlock: Record<string, Claim[]>;
  layerFile: SidecarLoadStatus;
  claimsFile: SidecarLoadStatus;
}
