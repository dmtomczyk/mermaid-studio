import * as assert from 'assert';
import { suite, test } from 'mocha';
import {
  getLocalExamplesCommandUriForTitle,
  getReferenceExampleRelativePath,
  getReferenceUrlForTitle,
  inferReferenceTopic
} from '../../registry/exampleRegistry';
import {
  getCompletionOnlyTopics,
  getHoverOnlyKeywordHelpTopics,
  getRootCompletionTopics,
  getRootKeywordHelpTopics,
  getSharedCompletionTopics,
  getSharedKeywordHelpTopics
} from '../../registry/syntaxRegistry';

suite('registry helpers', () => {
  test('shared root syntax topics expose completion and hover starter coverage', () => {
    const completionLabels = new Set(getRootCompletionTopics().map((topic) => topic.label));
    const hoverTopics = getRootKeywordHelpTopics();

    for (const label of ['flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram-v2', 'erDiagram', 'gantt', 'mindmap', 'gitGraph', 'architecture-beta']) {
      assert.ok(completionLabels.has(label), `Missing root completion topic: ${label}`);
      assert.ok(hoverTopics[label], `Missing root hover topic: ${label}`);
    }
  });

  test('reference/example helpers map titles consistently', () => {
    assert.strictEqual(inferReferenceTopic('sequenceDiagram'), 'sequence');
    assert.strictEqual(getReferenceUrlForTitle('sequenceDiagram'), 'https://mermaid.js.org/syntax/sequenceDiagram.html');
    assert.strictEqual(getReferenceExampleRelativePath('sequence'), 'docs/examples/sequence.md');
    assert.ok(getLocalExamplesCommandUriForTitle('sequenceDiagram').includes('mermaidstudio.openReferenceExample'));
  });

  test('shared syntax topics provide aligned completion and hover coverage', () => {
    const completionLabels = new Set(getSharedCompletionTopics().map((topic) => topic.label));
    const hoverTopics = getSharedKeywordHelpTopics();

    for (const label of [
      'participant', '->>', '-->>', 'note', 'loop', 'alt',
      'subgraph', 'direction', 'click', 'classDef', 'class', 'linkStyle',
      'dateFormat', 'axisFormat', 'title', 'section', 'todayMarker', 'excludes', 'includes',
      'commit', 'branch', 'checkout', 'merge', 'cherry-pick',
      'namespace', 'state', 'choice', 'fork', 'join',
      'group', 'service'
    ]) {
      assert.ok(completionLabels.has(label), `Missing shared completion topic: ${label}`);
      assert.ok(hoverTopics[label], `Missing shared hover topic: ${label}`);
    }
  });

  test('completion-only and hover-only registry topics cover the remaining provider catalogs', () => {
    const completionOnly = new Set(getCompletionOnlyTopics().map((topic) => topic.label));
    const hoverOnly = getHoverOnlyKeywordHelpTopics();

    for (const label of ['gantt task', 'er relationship']) {
      assert.ok(completionOnly.has(label), `Missing completion-only topic: ${label}`);
    }

    for (const label of ['graph', 'end', 'LR', 'RL', 'TD', 'BT', 'opt', 'else', 'par', 'and', 'critical', 'break', 'rect', 'activate', 'deactivate', 'style', 'accTitle', 'accDescr']) {
      assert.ok(hoverOnly[label], `Missing hover-only topic: ${label}`);
    }
  });
});
