import * as vscode from 'vscode';
import { MermaidSnippetTopic } from './snippetRegistry';

const FAVORITES_KEY = 'mermaidstudio.favoriteSnippets';
const RECENT_KEY = 'mermaidstudio.recentSnippets';
const MAX_RECENT_SNIPPETS = 12;

export function getFavoriteSnippetIds(context: vscode.ExtensionContext): string[] {
  return normalizeStringArray(context.globalState.get<string[]>(FAVORITES_KEY, []));
}

export function getRecentSnippetIds(context: vscode.ExtensionContext): string[] {
  return normalizeStringArray(context.globalState.get<string[]>(RECENT_KEY, []));
}

export async function toggleFavoriteSnippet(context: vscode.ExtensionContext, snippetId: string): Promise<boolean> {
  const favorites = getFavoriteSnippetIds(context);
  const nextFavorites = favorites.includes(snippetId)
    ? favorites.filter((id) => id !== snippetId)
    : [snippetId, ...favorites];
  await context.globalState.update(FAVORITES_KEY, nextFavorites);
  return nextFavorites.includes(snippetId);
}

export async function recordRecentSnippet(context: vscode.ExtensionContext, snippetId: string): Promise<void> {
  const recent = getRecentSnippetIds(context).filter((id) => id !== snippetId);
  recent.unshift(snippetId);
  await context.globalState.update(RECENT_KEY, recent.slice(0, MAX_RECENT_SNIPPETS));
}

export function sortSnippetTopics(
  topics: MermaidSnippetTopic[],
  favorites: string[] = [],
  recent: string[] = []
): MermaidSnippetTopic[] {
  const favoriteSet = new Set(favorites);
  const recentIndex = new Map(recent.map((id, index) => [id, index]));

  return [...topics].sort((left, right) => {
    const leftFavorite = favoriteSet.has(left.id);
    const rightFavorite = favoriteSet.has(right.id);
    if (leftFavorite !== rightFavorite) {
      return leftFavorite ? -1 : 1;
    }

    const leftRecent = recentIndex.has(left.id);
    const rightRecent = recentIndex.has(right.id);
    if (leftRecent !== rightRecent) {
      return leftRecent ? -1 : 1;
    }
    if (leftRecent && rightRecent) {
      return (recentIndex.get(left.id) ?? 0) - (recentIndex.get(right.id) ?? 0);
    }

    if (left.kind !== right.kind) {
      return left.kind === 'starter' ? -1 : 1;
    }

    return left.label.localeCompare(right.label);
  });
}

function normalizeStringArray(value: string[]): string[] {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0) : [];
}
