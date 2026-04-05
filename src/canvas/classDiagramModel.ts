import {
  ClassDiagramCanvasEdge,
  ClassDiagramCanvasModel,
  ClassDiagramCanvasNode,
  ClassDiagramRelationType
} from './families/classDiagram/classDiagramTypes';

export type {
  ClassDiagramCanvasEdge,
  ClassDiagramCanvasModel,
  ClassDiagramCanvasNode,
  ClassDiagramRelationType
} from './families/classDiagram/classDiagramTypes';

export interface ClassDiagramClass extends ClassDiagramCanvasNode {}

export interface ClassDiagramRelation extends ClassDiagramCanvasEdge {
  type: string;
}

export interface ClassDiagramValidationIssue {
  level: 'warning' | 'error';
  message: string;
  target: 'class' | 'relation' | 'document';
  targetId?: string;
}

const DEFAULT_RELATION = '-->';
const DEFAULT_CLASS_WIDTH = 220;
const DEFAULT_CLASS_HEIGHT = 120;

export function createEmptyClassDiagramModel(): ClassDiagramCanvasModel {
  return {
    family: 'classDiagram',
    classes: [
      {
        id: 'class-1',
        name: 'ExampleClass',
        members: ['+id: string', '+render(): void'],
        x: 140,
        y: 120,
        width: DEFAULT_CLASS_WIDTH,
        height: DEFAULT_CLASS_HEIGHT
      },
      {
        id: 'class-2',
        name: 'ViewModel',
        members: ['+load(): Promise<void>', '+save(): Promise<void>'],
        x: 460,
        y: 220,
        width: DEFAULT_CLASS_WIDTH,
        height: DEFAULT_CLASS_HEIGHT
      }
    ],
    relations: [
      {
        id: 'relation-1',
        from: 'class-1',
        to: 'class-2',
        type: '-->',
        label: 'uses'
      }
    ]
  };
}

export function looksLikeClassDiagram(source: string): boolean {
  return /^\s*classDiagram\b/m.test(source);
}

export function parseClassDiagramToModel(source: string): ClassDiagramCanvasModel {
  const model: ClassDiagramCanvasModel = {
    family: 'classDiagram',
    classes: [],
    relations: []
  };

  const classByName = new Map<string, ClassDiagramClass>();
  const lines = source.split(/\r?\n/);
  let relationIndex = 1;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trim();
    if (!line || line.startsWith('%%') || line === 'classDiagram') {
      continue;
    }

    const classBlockMatch = /^class\s+([A-Za-z_][\w.]*)\s*\{$/.exec(line);
    if (classBlockMatch) {
      const className = classBlockMatch[1];
      const members: string[] = [];
      index += 1;
      while (index < lines.length) {
        const memberLine = (lines[index] ?? '').trim();
        if (memberLine === '}') {
          break;
        }
        if (memberLine) {
          members.push(memberLine);
        }
        index += 1;
      }
      upsertClass(model, classByName, className, members);
      continue;
    }

    const classInlineMatch = /^class\s+([A-Za-z_][\w.]*)\b/.exec(line);
    if (classInlineMatch) {
      upsertClass(model, classByName, classInlineMatch[1]);
      continue;
    }

    const relationMatch = /^([A-Za-z_][\w.]*)\s+([<>|*ox.\-]+)\s+([A-Za-z_][\w.]*)(?:\s*:\s*(.+))?$/.exec(line);
    if (relationMatch) {
      const [, fromName, type, toName, label] = relationMatch;
      const fromClass = upsertClass(model, classByName, fromName);
      const toClass = upsertClass(model, classByName, toName);
      model.relations.push({
        id: `relation-${relationIndex++}`,
        from: fromClass.id,
        to: toClass.id,
        type: type || DEFAULT_RELATION,
        label: label?.trim() || undefined
      });
      continue;
    }
  }

  if (!model.classes.length) {
    return createEmptyClassDiagramModel();
  }

  applyDefaultLayout(model);
  return model;
}

export function generateClassDiagramSource(model: ClassDiagramCanvasModel): string {
  const lines: string[] = ['classDiagram'];

  for (const entry of model.classes) {
    const name = sanitizeClassName(entry.name);
    if (entry.members.length) {
      lines.push(`  class ${name} {`);
      for (const member of entry.members) {
        const normalized = member.trim();
        if (normalized) {
          lines.push(`    ${normalized}`);
        }
      }
      lines.push('  }');
    } else {
      lines.push(`  class ${name}`);
    }
  }

  if (model.relations.length) {
    lines.push('');
    for (const relation of model.relations) {
      const fromClass = model.classes.find((entry) => entry.id === relation.from);
      const toClass = model.classes.find((entry) => entry.id === relation.to);
      if (!fromClass || !toClass) {
        continue;
      }
      const fromName = sanitizeClassName(fromClass.name);
      const toName = sanitizeClassName(toClass.name);
      const label = relation.label?.trim();
      lines.push(label
        ? `  ${fromName} ${sanitizeRelationType(relation.type)} ${toName} : ${label}`
        : `  ${fromName} ${sanitizeRelationType(relation.type)} ${toName}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function validateClassDiagramModel(model: ClassDiagramCanvasModel): ClassDiagramValidationIssue[] {
  const issues: ClassDiagramValidationIssue[] = [];
  const names = new Map<string, string[]>();
  const relationKeys = new Set<string>();
  const classIds = new Set(model.classes.map((entry) => entry.id));

  for (const entry of model.classes) {
    const trimmed = entry.name.trim();
    if (!trimmed) {
      issues.push({
        level: 'error',
        message: 'Class name cannot be empty.',
        target: 'class',
        targetId: entry.id
      });
      continue;
    }

    const normalized = trimmed.toLowerCase();
    const bucket = names.get(normalized) ?? [];
    bucket.push(entry.id);
    names.set(normalized, bucket);
  }

  for (const [normalized, ids] of names.entries()) {
    if (ids.length > 1) {
      for (const id of ids) {
        issues.push({
          level: 'error',
          message: `Duplicate class name detected: ${normalized}.`,
          target: 'class',
          targetId: id
        });
      }
    }
  }

  for (const relation of model.relations) {
    if (!classIds.has(relation.from) || !classIds.has(relation.to)) {
      issues.push({
        level: 'error',
        message: 'Relationship points to a missing class.',
        target: 'relation',
        targetId: relation.id
      });
      continue;
    }

    if (relation.from === relation.to) {
      issues.push({
        level: 'warning',
        message: 'Relationship loops back to the same class.',
        target: 'relation',
        targetId: relation.id
      });
    }

    if (!relation.type.trim()) {
      issues.push({
        level: 'error',
        message: 'Relationship type cannot be empty.',
        target: 'relation',
        targetId: relation.id
      });
    }

    const label = relation.label?.trim().toLowerCase() ?? '';
    const dedupeKey = `${relation.from}|${relation.type.trim()}|${relation.to}|${label}`;
    if (relationKeys.has(dedupeKey)) {
      issues.push({
        level: 'warning',
        message: 'Duplicate relationship detected.',
        target: 'relation',
        targetId: relation.id
      });
    }
    relationKeys.add(dedupeKey);
  }

  if (!model.classes.length) {
    issues.push({
      level: 'warning',
      message: 'Diagram has no classes yet.',
      target: 'document'
    });
  }

  return issues;
}

export function normalizeClassDiagramModel(input: unknown): ClassDiagramCanvasModel {
  const fallback = createEmptyClassDiagramModel();
  if (!input || typeof input !== 'object') {
    return fallback;
  }

  const candidate = input as Partial<ClassDiagramCanvasModel>;
  const classes = Array.isArray(candidate.classes)
    ? candidate.classes
      .map((entry, index) => normalizeClassEntry(entry, index))
      .filter((entry): entry is ClassDiagramClass => Boolean(entry))
    : fallback.classes;

  const relations = Array.isArray(candidate.relations)
    ? candidate.relations
      .map((entry, index) => normalizeRelationEntry(entry, index, classes))
      .filter((entry): entry is ClassDiagramRelation => Boolean(entry))
    : [];

  const model: ClassDiagramCanvasModel = {
    family: 'classDiagram',
    classes: classes.length ? classes : fallback.classes,
    relations
  };
  applyDefaultLayout(model);
  return model;
}

function upsertClass(
  model: ClassDiagramCanvasModel,
  classByName: Map<string, ClassDiagramClass>,
  name: string,
  members: string[] = []
): ClassDiagramClass {
  const existing = classByName.get(name);
  if (existing) {
    if (members.length) {
      existing.members = members;
    }
    return existing;
  }

  const index = model.classes.length;
  const entry: ClassDiagramClass = {
    id: `class-${index + 1}`,
    name,
    members: members.slice(),
    x: 120 + (index % 3) * 300,
    y: 120 + Math.floor(index / 3) * 190,
    width: DEFAULT_CLASS_WIDTH,
    height: DEFAULT_CLASS_HEIGHT
  };
  model.classes.push(entry);
  classByName.set(name, entry);
  return entry;
}

function sanitizeClassName(name: string): string {
  const trimmed = name.trim() || 'UnnamedClass';
  const normalized = trimmed.replace(/[^A-Za-z0-9_.]/g, '_');
  const prefixed = /^[A-Za-z_]/.test(normalized) ? normalized : `Class_${normalized}`;
  return prefixed || 'UnnamedClass';
}

function sanitizeRelationType(type: string): string {
  const trimmed = type.trim();
  return trimmed || DEFAULT_RELATION;
}

function normalizeClassEntry(input: unknown, index: number): ClassDiagramClass | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const candidate = input as Partial<ClassDiagramClass>;
  const name = typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : `Class${index + 1}`;
  const members = Array.isArray(candidate.members)
    ? candidate.members.map((entry) => String(entry ?? '').trim()).filter(Boolean)
    : [];

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : `class-${index + 1}`,
    name,
    members,
    x: typeof candidate.x === 'number' && Number.isFinite(candidate.x) ? candidate.x : 120 + (index % 3) * 300,
    y: typeof candidate.y === 'number' && Number.isFinite(candidate.y) ? candidate.y : 120 + Math.floor(index / 3) * 190,
    width: typeof candidate.width === 'number' && Number.isFinite(candidate.width) ? candidate.width : DEFAULT_CLASS_WIDTH,
    height: typeof candidate.height === 'number' && Number.isFinite(candidate.height) ? candidate.height : DEFAULT_CLASS_HEIGHT
  };
}

function normalizeRelationEntry(
  input: unknown,
  index: number,
  classes: ClassDiagramClass[]
): ClassDiagramRelation | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const candidate = input as Partial<ClassDiagramRelation>;
  const classIds = new Set(classes.map((entry) => entry.id));
  if (typeof candidate.from !== 'string' || typeof candidate.to !== 'string') {
    return undefined;
  }
  if (!classIds.has(candidate.from) || !classIds.has(candidate.to)) {
    return undefined;
  }

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : `relation-${index + 1}`,
    from: candidate.from,
    to: candidate.to,
    type: sanitizeRelationType(typeof candidate.type === 'string' ? candidate.type : DEFAULT_RELATION),
    label: typeof candidate.label === 'string' && candidate.label.trim() ? candidate.label.trim() : undefined
  };
}

function applyDefaultLayout(model: ClassDiagramCanvasModel): void {
  model.classes.forEach((entry, index) => {
    if (!Number.isFinite(entry.x)) {
      entry.x = 120 + (index % 3) * 300;
    }
    if (!Number.isFinite(entry.y)) {
      entry.y = 120 + Math.floor(index / 3) * 190;
    }
    if (!Number.isFinite(entry.width ?? NaN)) {
      entry.width = DEFAULT_CLASS_WIDTH;
    }
    if (!Number.isFinite(entry.height ?? NaN)) {
      entry.height = DEFAULT_CLASS_HEIGHT;
    }
  });
}
