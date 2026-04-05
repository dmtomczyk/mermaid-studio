export function createCanvasStateBridgeSource(): string {
  return `
      function mergeCanvasShellState(message, defaults) {
        return {
          family: message.family || defaults.family,
          familyLabel: message.familyLabel || defaults.familyLabel,
          availableFamilies: Array.isArray(message.availableFamilies) ? message.availableFamilies : state.availableFamilies,
          shellLabels: message.shellLabels || state.shellLabels,
          sourceLabel: message.sourceLabel,
          linkedFileLabel: message.linkedFileLabel || message.sourceLabel,
          linkedFileKind: message.linkedFileKind || 'ephemeral',
          canReimport: !!message.canReimport,
          canOpenLinkedFile: !!message.canOpenLinkedFile,
          canApply: message.canApply !== false,
          issues: Array.isArray(message.issues) ? message.issues : [],
          model: message.model,
          mermaid: message.mermaid
        };
      }
`;
}
