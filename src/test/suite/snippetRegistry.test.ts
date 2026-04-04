import * as assert from 'assert';
import { suite, test } from 'mocha';
import { getAvailableSlashSnippetChoices, getAvailableSnippetTopics, MERMAID_SNIPPET_TOPICS } from '../../registry/snippetRegistry';

suite('snippet registry', () => {
  test('includes core starter diagram types', () => {
    const labels = new Set(MERMAID_SNIPPET_TOPICS.filter((topic) => topic.kind === 'starter').map((topic) => topic.label));
    const required = [
      'Flowchart TD',
      'Flowchart LR',
      'Sequence Diagram',
      'Class Diagram',
      'State Diagram',
      'ER Diagram',
      'Gantt',
      'Mindmap',
      'Git Graph',
      'Architecture'
    ];

    for (const label of required) {
      assert.ok(labels.has(label), `Missing registry starter: ${label}`);
    }
  });

  test('filters micro snippets by active diagram type while keeping starters visible', () => {
    const sequenceSnippets = getAvailableSnippetTopics('sequenceDiagram');
    const flowSnippets = getAvailableSnippetTopics('flowchart');

    assert.ok(sequenceSnippets.some((topic) => topic.label === 'Sequence message'));
    assert.ok(!sequenceSnippets.some((topic) => topic.label === 'Gantt title'));
    assert.ok(flowSnippets.some((topic) => topic.label === 'Node: rectangle'));
    assert.ok(sequenceSnippets.some((topic) => topic.label === 'Flowchart TD'));
  });

  test('provides slash snippet choices and keeps them diagram-type-aware', () => {
    const sequenceChoices = getAvailableSlashSnippetChoices('sequenceDiagram', 'part');
    const architectureChoices = getAvailableSlashSnippetChoices('architecture-beta', 'group');
    const genericChoices = getAvailableSlashSnippetChoices(undefined, 'flow');

    assert.ok(sequenceChoices.some((choice) => choice.alias === 'participant'));
    assert.ok(!sequenceChoices.some((choice) => choice.alias === 'group'));
    assert.ok(architectureChoices.some((choice) => choice.alias === 'group'));
    assert.ok(genericChoices.some((choice) => choice.alias === 'flow'));
  });

  test('prioritizes favorites and recent snippets in slash choices', () => {
    const choices = getAvailableSlashSnippetChoices(undefined, 'flow', {
      favorites: ['starter-flowchart-td'],
      recent: ['starter-flowchart-lr']
    });

    const firstFavoriteIndex = choices.findIndex((choice) => choice.topic.id === 'starter-flowchart-td');
    const firstRecentIndex = choices.findIndex((choice) => choice.topic.id === 'starter-flowchart-lr');

    assert.ok(firstFavoriteIndex >= 0);
    assert.ok(firstRecentIndex >= 0);
    assert.ok(firstFavoriteIndex < firstRecentIndex);
    assert.strictEqual(choices[firstFavoriteIndex].favorite, true);
    assert.strictEqual(choices[firstRecentIndex].recent, true);
  });
});
