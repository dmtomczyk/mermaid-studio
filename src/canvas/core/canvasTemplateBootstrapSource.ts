export function createCanvasTemplateBootstrapSource(): string {
  return `
      function initializeCanvasTemplateSelect(options, fallbackTemplateId) {
        classTemplateSelect.innerHTML = options.map((option) => '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + '</option>').join('');
        classTemplateSelect.addEventListener('change', () => {
          selectedTemplateId = classTemplateSelect.value || fallbackTemplateId;
          renderTemplatePreview();
        });
      }
`;
}
