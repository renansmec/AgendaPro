export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  calendarEventId?: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  dueDate?: string | null;
  calendarEventId?: string | null;
  isSequential?: boolean;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
}

export interface TemplateTask {
  title: string;
  description: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  isSequential?: boolean;
  tasks: TemplateTask[];
  workspaceId: string;
  createdAt: string;
}

export interface UserStats {
  completedTasks: number;
  activeProjects: number;
}

export type Role = 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  role: Role;
  joinedAt: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: Role;
  status: 'pending' | 'accepted';
  createdAt: string;
}
