import { collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Task, Project, ProjectTemplate, Workspace, WorkspaceMember, WorkspaceInvite, Role } from '../types';

export const subscribeToProjectTemplates = (workspaceId: string, callback: (templates: ProjectTemplate[]) => void) => {
  const q = query(collection(db, 'projectTemplates'), where('workspaceId', '==', workspaceId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectTemplate)));
  }, (error) => console.warn('Error in subscribeToProjectTemplates:', error));
};

export const createProjectTemplate = async (template: Omit<ProjectTemplate, 'id' | 'createdAt'>): Promise<ProjectTemplate> => {
  const newRef = doc(collection(db, 'projectTemplates'));
  const newTemplate = {
    ...template,
    id: newRef.id,
    createdAt: new Date().toISOString()
  };
  setDoc(newRef, newTemplate).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
  return newTemplate as ProjectTemplate;
};

export const updateProjectTemplate = async (templateId: string, updates: Partial<ProjectTemplate>): Promise<void> => {
  updateDoc(doc(db, 'projectTemplates', templateId), updates).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
};

export const deleteProjectTemplate = async (templateId: string): Promise<void> => {
  deleteDoc(doc(db, 'projectTemplates', templateId)).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
};

export const subscribeToProjects = (workspaceId: string, callback: (projects: Project[]) => void) => {
  const q = query(collection(db, 'projects'), where('workspaceId', '==', workspaceId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
  }, (error) => console.warn('Error in subscribeToProjects:', error));
};

export const subscribeToTasks = (workspaceId: string, callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, 'tasks'), where('workspaceId', '==', workspaceId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
  }, (error) => console.warn('Error in subscribeToTasks:', error));
};

export const getProjects = async (workspaceId: string): Promise<Project[]> => {
  const q = query(collection(db, 'projects'), where('workspaceId', '==', workspaceId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  const newRef = doc(collection(db, 'projects'));
  const newProject = {
    ...project,
    id: newRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  setDoc(newRef, newProject).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
  return newProject as Project;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);
  updateDoc(projectRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  }).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
};

export const deleteProject = async (projectId: string, workspaceId: string) => {
  const tasksQuery = query(collection(db, 'tasks'), where('workspaceId', '==', workspaceId));
  const tasksSnapshot = await getDocs(tasksQuery);
  const deletePromises = tasksSnapshot.docs
    .filter(doc => doc.data().projectId === projectId)
    .map(doc => deleteDoc(doc.ref));
  Promise.all([...deletePromises, deleteDoc(doc(db, 'projects', projectId))]).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
};

export const getTasks = async (workspaceId: string): Promise<Task[]> => {
  const q = query(collection(db, 'tasks'), where('workspaceId', '==', workspaceId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const newRef = doc(collection(db, 'tasks'));
  const newTask = {
    ...task,
    id: newRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  setDoc(newRef, newTask).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
  return newTask as Task;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = doc(db, 'tasks', taskId);
  updateDoc(taskRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  }).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  deleteDoc(doc(db, 'tasks', taskId)).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } });
};



export const createWorkspace = async (name: string, ownerId: string, ownerEmail: string): Promise<Workspace> => {
  const newRef = doc(collection(db, 'workspaces'));
  const newWorkspace: Workspace = {
    id: newRef.id,
    name,
    ownerId,
    createdAt: new Date().toISOString()
  };
  await setDoc(newRef, newWorkspace);
  
  const memberRef = doc(db, 'workspaceMembers', `${newWorkspace.id}_${ownerId}`);
  const newMember: WorkspaceMember = {
    id: memberRef.id,
    workspaceId: newWorkspace.id,
    userId: ownerId,
    email: ownerEmail,
    role: 'admin',
    joinedAt: new Date().toISOString()
  };
  await setDoc(memberRef, newMember);
  return newWorkspace;
};

export const getWorkspacesForUser = async (userId: string): Promise<Workspace[]> => {
  const memberQuery = query(collection(db, 'workspaceMembers'), where('userId', '==', userId));
  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) return [];
  
  const workspaceIds = memberSnapshot.docs.map(doc => doc.data().workspaceId);
  // Get all those workspaces (in chunks if > 10 in reality, but this is fine for now)
  const workspaces: Workspace[] = [];
  for (const wid of workspaceIds) {
    const wDoc = await getDocs(query(collection(db, 'workspaces'), where('id', '==', wid)));
    if (!wDoc.empty) {
      workspaces.push(wDoc.docs[0].data() as Workspace);
    }
  }
  return workspaces;
};

export const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  const q = query(collection(db, 'workspaceMembers'), where('workspaceId', '==', workspaceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as WorkspaceMember);
};

export const getWorkspaceInvites = async (workspaceId: string): Promise<WorkspaceInvite[]> => {
  const q = query(collection(db, 'workspaceInvites'), where('workspaceId', '==', workspaceId), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as WorkspaceInvite);
};

export const inviteUserToWorkspace = async (workspaceId: string, email: string, role: Role): Promise<void> => {
  const newRef = doc(collection(db, 'workspaceInvites'));
  await setDoc(newRef, {
    id: newRef.id,
    workspaceId,
    email,
    role,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
};

export const getPendingInvitesForEmail = async (email: string): Promise<WorkspaceInvite[]> => {
  const q = query(collection(db, 'workspaceInvites'), where('email', '==', email), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as WorkspaceInvite);
};

export const acceptInvite = async (invite: WorkspaceInvite, userId: string): Promise<void> => {
  const memberRef = doc(db, 'workspaceMembers', `${invite.workspaceId}_${userId}`);
  const newMember: WorkspaceMember = {
    id: memberRef.id,
    workspaceId: invite.workspaceId,
    userId,
    email: invite.email,
    role: invite.role,
    joinedAt: new Date().toISOString()
  };
  await setDoc(memberRef, newMember);
  await updateDoc(doc(db, 'workspaceInvites', invite.id), { status: 'accepted' });
};

export const removeMember = async (memberId: string): Promise<void> => {
  await deleteDoc(doc(db, 'workspaceMembers', memberId));
};
