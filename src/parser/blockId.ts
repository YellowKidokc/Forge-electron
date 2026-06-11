const EXISTING_BLOCK_ID = /<!--\s*forge:(?:id|block)\s*=\s*([a-zA-Z0-9_-]+)\s*-->/;

export interface BlockIdResult {
  id: string;
  collision?: {
    requestedId: string;
    repairedId: string;
  };
}

export function extractForgeId(markdown: string): string | undefined {
  return markdown.match(EXISTING_BLOCK_ID)?.[1];
}

export function hasForgeId(markdown: string): boolean {
  return EXISTING_BLOCK_ID.test(markdown);
}

export function removeForgeComments(markdown: string): string {
  return markdown.replace(/\s*<!--\s*forge:(?:id|block)\s*=\s*[a-zA-Z0-9_-]+\s*-->/g, '').trim();
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');

  return slug || 'untitled';
}

export function createBlockId(type: string, text: string, usedIds: Map<string, number>, explicitId?: string): BlockIdResult {
  const base = explicitId ?? `${type}-${slugify(text)}`;
  const count = usedIds.get(base) ?? 0;
  usedIds.set(base, count + 1);

  if (count === 0) return { id: base };

  const repairedId = `${base}-${String(count + 1).padStart(3, '0')}`;
  return {
    id: repairedId,
    collision: {
      requestedId: base,
      repairedId
    }
  };
}
