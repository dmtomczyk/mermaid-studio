export function createCanvasShellUiSource(): string {
  return `
      function renderCanvasShellChrome(runtimeFamily) {
        sourceLabel.textContent = state.sourceLabel || runtimeFamily.shell.sourceLabel;
        if (familySelect) {
          familySelect.innerHTML = (state.availableFamilies || []).map((entry) => '<option value="' + escapeHtml(entry.id) + '">' + escapeHtml(entry.label) + '</option>').join('');
          familySelect.value = state.family || runtimeFamily.family;
        }
        if (templateSectionTitle) {
          templateSectionTitle.textContent = state.shellLabels?.sidebarTemplateSection || runtimeFamily.shell.templateSectionTitle;
        }
        if (relationSectionTitle) {
          relationSectionTitle.textContent = state.shellLabels?.relationSection || runtimeFamily.shell.relationSectionTitle;
        }
        if (addClassButton) {
          addClassButton.textContent = state.shellLabels?.addTemplateButton || runtimeFamily.shell.addTemplateButton;
        }
        if (addTemplateFromSidebarButton) {
          addTemplateFromSidebarButton.textContent = (state.shellLabels?.addTemplateButton || runtimeFamily.shell.addTemplateButton) + ' to canvas';
        }
      }

      function bindCanvasFamilySwitcher(runtimeFamily) {
        familySelect?.addEventListener('change', () => {
          const nextFamily = familySelect.value;
          if (runtimeFamily.hasContent(state.model) && !confirm('Switch diagram family and reset the current canvas?')) {
            familySelect.value = state.family || runtimeFamily.family;
            return;
          }
          vscode.postMessage({ type: 'switchFamily', family: nextFamily });
        });
      }
`;
}
