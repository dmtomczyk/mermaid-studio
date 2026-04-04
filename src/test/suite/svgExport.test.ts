import * as assert from 'assert';
import { suite, test } from 'mocha';
import { getExportableSvgEntries, prepareSvgForExport, selectSvgExports } from '../../preview/svgExport';

suite('prepareSvgForExport', () => {
  test('injects namespace, background, and export styles', () => {
    const input = '<svg width="100" height="100"><text>Hi</text></svg>';
    const output = prepareSvgForExport(input);

    assert.ok(output.includes('xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(output.includes('<rect width="100%" height="100%" fill="#ffffff"></rect>'));
    assert.ok(output.includes('fill: #111827'));
    assert.ok(output.includes('background:#ffffff'));
    assert.ok(output.includes('foreignObject div, foreignObject span, foreignObject p'));
  });

  test('merges with an existing svg style attribute instead of redefining it', () => {
    const input = '<svg width="100" height="100" style="max-width: 100%;"><text>Hi</text></svg>';
    const output = prepareSvgForExport(input);

    assert.strictEqual((output.match(/\sstyle=/g) || []).length, 1);
    assert.ok(output.includes('style="max-width: 100%;background:#ffffff;color:#111827;"'));
  });

  test('uses viewBox bounds for the export background when viewBox starts outside 0,0', () => {
    const input = '<svg viewBox="-204.10560607910156 -65.5 488.2112121582031 262"><text>Hi</text></svg>';
    const output = prepareSvgForExport(input);

    assert.ok(output.includes('<rect x="-204.10560607910156" y="-65.5" width="488.2112121582031" height="262" fill="#ffffff"></rect>'));
  });

  test('flattens foreignObject HTML labels into standalone SVG text', () => {
    const input = '<svg><g class="label" transform="translate(-16.8984375, -12)"><rect></rect><foreignObject width="33.796875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell;"><span class="nodeLabel"><p>Start</p></span></div></foreignObject></g></svg>';
    const output = prepareSvgForExport(input);

    assert.ok(!output.includes('<foreignObject'));
    assert.ok(output.includes('<text x="16.8984375" y="12" class="nodeLabel" fill="#111827" text-anchor="middle" dominant-baseline="middle" style="fill:#111827;color:#111827;">Start</text>'));
  });
});

suite('selectSvgExports', () => {
  test('prefers the active SVG for current export', () => {
    const state = {
      activeSvg: '<svg id="active"></svg>',
      entries: [
        { title: 'Diagram 1', svg: '<svg id="one"></svg>' },
        { title: 'Diagram 2', svg: '<svg id="active"></svg>' }
      ]
    };

    const selected = selectSvgExports(state, 'current');
    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0].title, 'Diagram 2');
    assert.strictEqual(selected[0].svg, '<svg id="active"></svg>');
  });

  test('falls back to the first rendered entry when no active SVG is available', () => {
    const state = {
      entries: [
        { title: 'Diagram 1', svg: '<svg id="one"></svg>' },
        { title: 'Diagram 2', svg: '<svg id="two"></svg>' }
      ]
    };

    const selected = selectSvgExports(state, 'current');
    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0].title, 'Diagram 1');
  });

  test('returns all rendered entries for all export mode and filters blanks', () => {
    const state = {
      activeSvg: '',
      entries: [
        { title: 'Diagram 1', svg: '<svg id="one"></svg>' },
        { title: 'Diagram 2', svg: '   ' },
        { title: 'Diagram 3', svg: '<svg id="three"></svg>' }
      ]
    };

    const entries = getExportableSvgEntries(state);
    const selected = selectSvgExports(state, 'all');

    assert.strictEqual(entries.length, 2);
    assert.strictEqual(selected.length, 2);
    assert.deepStrictEqual(selected.map((entry) => entry.title), ['Diagram 1', 'Diagram 3']);
  });
});
