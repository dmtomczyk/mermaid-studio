export function createCanvasShellUiSource(): string {
  return `
      function renderCanvasShellChrome(defaults) {
        sourceLabel.textContent = state.sourceLabel || defaults.sourceLabel;
        if (familySelect) {
          familySelect.innerHTML = (state.availableFamilies || []).map((entry) => '<option value="' + escapeHtml(entry.id) + '">' + escapeHtml(entry.label) + '</option>').join('');
          familySelect.value = state.family || defaults.family;
        }
        if (templateSectionTitle) {
          templateSectionTitle.textContent = state.shellLabels?.sidebarTemplateSection || defaults.templateSectionTitle;
        }
        if (relationSectionTitle) {
          relationSectionTitle.textContent = state.shellLabels?.relationSection || defaults.relationSectionTitle;
        }
        if (addClassButton) {
          addClassButton.textContent = state.shellLabels?.addTemplateButton || defaults.addTemplateButton;
        }
        if (addTemplateFromSidebarButton) {
          addTemplateFromSidebarButton.textContent = (state.shellLabels?.addTemplateButton || defaults.addTemplateButton) + ' to canvas';
        }
      }

      function bindCanvasFamilySwitcher(defaultFamily) {
        familySelect?.addEventListener('change', () => {
          const nextFamily = familySelect.value;
          if (hasCanvasContentForFamilySwitch() && !confirm('Switch diagram family and reset the current canvas?')) {
            familySelect.value = state.family || defaultFamily;
            return;
          }
          vscode.postMessage({ type: 'switchFamily', family: nextFamily });
        });
      }
`;
}
