import { supabase } from './supabase';
import { Task, Project, ProjectTemplate, Workspace, WorkspaceMember, WorkspaceInvite, Role } from '../types';

// Helper for unique IDs (if Supabase doesn't auto-generate or you want client-side IDs)
// Since Supabase usually uses uuid, we can generate them or just let DB generate if we configure it so.
// Let's assume we let DB generate by omitting ID for inserts, wait, the types have `id: string`.
// If we omit it and let DB return it, the types say `id` is required.
// Actually, `insert()` in Supabase can return the generated row.
// Our types expect `id` to be string, we can use `uuid` in DB.

export const subscribeToProjectTemplates = (workspaceId: string, callback: (templates: ProjectTemplate[]) => void) => {
  const refresh = () => {
    supabase.from('projectTemplates').select('*').eq('workspaceId', workspaceId).then(({data}) => {
      if (data) callback(data as ProjectTemplate[]);
    });
  };
  refresh();
  
  const channel = supabase.channel(`projectTemplates_${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projectTemplates', filter: `workspaceId=eq.${workspaceId}` }, () => {
       refresh();
    }).subscribe();

  const handleLocalChange = () => refresh();
  window.addEventListener('templates_changed', handleLocalChange);

  return () => { 
    supabase.removeChannel(channel); 
    window.removeEventListener('templates_changed', handleLocalChange);
  };
};

export const createProjectTemplate = async (template: Omit<ProjectTemplate, 'id' | 'createdAt'>): Promise<ProjectTemplate> => {
  const { data, error } = await supabase.from('projectTemplates').insert([{...template, createdAt: new Date().toISOString()}]).select().single();
  if (error) throw error;
  window.dispatchEvent(new Event('templates_changed'));
  return data as ProjectTemplate;
};

export const updateProjectTemplate = async (templateId: string, updates: Partial<ProjectTemplate>): Promise<void> => {
  await supabase.from('projectTemplates').update(updates).eq('id', templateId);
  window.dispatchEvent(new Event('templates_changed'));
};

export const deleteProjectTemplate = async (templateId: string): Promise<void> => {
  await supabase.from('projectTemplates').delete().eq('id', templateId);
  window.dispatchEvent(new Event('templates_changed'));
};

export const subscribeToProjects = (workspaceId: string, callback: (projects: Project[]) => void) => {
  const refresh = () => {
    supabase.from('projects').select('*').eq('workspaceId', workspaceId).then(({data}) => {
      if (data) callback(data as Project[]);
    });
  };
  refresh();
  
  const channel = supabase.channel(`projects_${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `workspaceId=eq.${workspaceId}` }, () => {
       refresh();
    }).subscribe();

  const handleLocalChange = () => refresh();
  window.addEventListener('projects_changed', handleLocalChange);

  return () => { 
    supabase.removeChannel(channel);
    window.removeEventListener('projects_changed', handleLocalChange);
  };
};

export const subscribeToTasks = (workspaceId: string, callback: (tasks: Task[]) => void) => {
  const refresh = () => {
    supabase.from('tasks').select('*').eq('workspaceId', workspaceId).then(({data}) => {
      if (data) callback(data as Task[]);
    });
  };
  refresh();
  
  const channel = supabase.channel(`tasks_${workspaceId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `workspaceId=eq.${workspaceId}` }, () => {
       refresh();
    }).subscribe();

  const handleLocalChange = () => refresh();
  window.addEventListener('tasks_changed', handleLocalChange);

  return () => { 
    supabase.removeChannel(channel); 
    window.removeEventListener('tasks_changed', handleLocalChange);
  };
};

export const getProjects = async (workspaceId: string): Promise<Project[]> => {
  const { data } = await supabase.from('projects').select('*').eq('workspaceId', workspaceId);
  return (data || []) as Project[];
};

export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  const { data, error } = await supabase.from('projects').insert([{
    ...project,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }]).select().single();
  if (error) throw error;
  window.dispatchEvent(new Event('projects_changed'));
  return data as Project;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  await supabase.from('projects').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', projectId);
  window.dispatchEvent(new Event('projects_changed'));
};

export const deleteProject = async (projectId: string, workspaceId: string) => {
  await supabase.from('tasks').delete().eq('projectId', projectId);
  await supabase.from('projects').delete().eq('id', projectId);
  window.dispatchEvent(new Event('projects_changed'));
  window.dispatchEvent(new Event('tasks_changed'));
};

export const getTasks = async (workspaceId: string): Promise<Task[]> => {
  const { data } = await supabase.from('tasks').select('*').eq('workspaceId', workspaceId);
  return (data || []) as Task[];
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const { data, error } = await supabase.from('tasks').insert([{
    ...task,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }]).select().single();
  if (error) throw error;
  window.dispatchEvent(new Event('tasks_changed'));
  return data as Task;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  await supabase.from('tasks').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', taskId);
  window.dispatchEvent(new Event('tasks_changed'));
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await supabase.from('tasks').delete().eq('id', taskId);
  window.dispatchEvent(new Event('tasks_changed'));
};

export const createWorkspace = async (name: string, ownerId: string, ownerEmail: string): Promise<Workspace> => {
  const { data: newWorkspace, error: err1 } = await supabase.from('workspaces').insert([{
    name, ownerId, createdAt: new Date().toISOString()
  }]).select().single();
  if (err1) throw err1;
  const { error: err2 } = await supabase.from('workspaceMembers').insert([{
    workspaceId: newWorkspace.id,
    userId: ownerId,
    email: ownerEmail,
    role: 'admin',
    joinedAt: new Date().toISOString()
  }]);
  if (err2) throw err2;
  window.dispatchEvent(new Event('workspaces_changed'));
  return newWorkspace as Workspace;
};

export const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>): Promise<void> => {
  await supabase.from('workspaces').update(updates).eq('id', workspaceId);
  window.dispatchEvent(new Event('workspaces_changed'));
};

export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  await supabase.from('workspaces').delete().eq('id', workspaceId);
  window.dispatchEvent(new Event('workspaces_changed'));
};

export const getWorkspacesForUser = async (userId: string): Promise<Workspace[]> => {
  const { data: memberData } = await supabase.from('workspaceMembers').select('workspaceId').eq('userId', userId);
  if (!memberData || memberData.length === 0) return [];
  
  const workspaceIds = memberData.map(d => d.workspaceId);
  const { data: workspaces } = await supabase.from('workspaces').select('*').in('id', workspaceIds);
  return (workspaces || []) as Workspace[];
};

export const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  const { data } = await supabase.from('workspaceMembers').select('*').eq('workspaceId', workspaceId);
  return (data || []) as WorkspaceMember[];
};

export const getWorkspaceInvites = async (workspaceId: string): Promise<WorkspaceInvite[]> => {
  const { data } = await supabase.from('workspaceInvites').select('*').eq('workspaceId', workspaceId).eq('status', 'pending');
  return (data || []) as WorkspaceInvite[];
};

export const inviteUserToWorkspace = async (workspaceId: string, email: string, role: Role): Promise<void> => {
  await supabase.from('workspaceInvites').insert([{
    workspaceId, email, role, status: 'pending', createdAt: new Date().toISOString()
  }]);
};

export const getPendingInvitesForEmail = async (email: string): Promise<WorkspaceInvite[]> => {
  const { data } = await supabase.from('workspaceInvites').select('*').eq('email', email).eq('status', 'pending');
  return (data || []) as WorkspaceInvite[];
};

export const acceptInvite = async (invite: WorkspaceInvite, userId: string): Promise<void> => {
  await supabase.from('workspaceMembers').insert([{
    workspaceId: invite.workspaceId,
    userId,
    email: invite.email,
    role: invite.role,
    joinedAt: new Date().toISOString()
  }]);
  await supabase.from('workspaceInvites').update({ status: 'accepted' }).eq('id', invite.id);
};

export const removeMember = async (memberId: string): Promise<void> => {
  await supabase.from('workspaceMembers').delete().eq('id', memberId);
};
