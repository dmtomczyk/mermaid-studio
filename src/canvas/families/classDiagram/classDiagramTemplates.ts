import { CanvasTemplate } from '../../types/templates';

export interface ClassDiagramTemplate extends CanvasTemplate {
  defaultName: string;
  members: string[];
}

export const CLASS_DIAGRAM_TEMPLATES: ClassDiagramTemplate[] = [
  {
    id: 'empty',
    label: 'Empty Class',
    description: 'Start from a blank class shell.',
    category: 'class',
    defaultName: 'NewClass',
    members: []
  },
  {
    id: 'entity',
    label: 'Entity / Model',
    description: 'Good starting point for persisted domain objects.',
    category: 'class',
    defaultName: 'User',
    members: ['+id: string', '+createdAt: Date', '+updatedAt: Date']
  },
  {
    id: 'service',
    label: 'Service',
    description: 'Common service-layer methods and return types.',
    category: 'class',
    defaultName: 'UserService',
    members: ['+getById(id: string): User', '+list(): User[]', '+save(user: User): void']
  },
  {
    id: 'repository',
    label: 'Repository',
    description: 'Data-access style methods for fetching and saving.',
    category: 'class',
    defaultName: 'UserRepository',
    members: ['+findById(id: string): User', '+findAll(): User[]', '+save(user: User): void', '+delete(id: string): void']
  },
  {
    id: 'controller',
    label: 'Controller',
    description: 'Endpoint-oriented controller actions.',
    category: 'class',
    defaultName: 'UserController',
    members: ['+index(): void', '+show(id: string): void', '+create(): void', '+update(id: string): void']
  },
  {
    id: 'dto',
    label: 'DTO',
    description: 'Lightweight data-transfer shape.',
    category: 'class',
    defaultName: 'UserDto',
    members: ['+id: string', '+name: string', '+email: string']
  },
  {
    id: 'component',
    label: 'Component',
    description: 'UI-ish component shell with props/state.',
    category: 'class',
    defaultName: 'UserCard',
    members: ['+render(): void', '+props: UserCardProps', '+state: UserCardState']
  }
];
