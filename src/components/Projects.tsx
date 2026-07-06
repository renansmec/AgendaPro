import React, { useState } from 'react';
import { createProject, deleteProject, updateProject, createTask, updateTask, deleteTask } from '../lib/api';
import { Project, Task, ProjectTemplate } from '../types';
import { getAccessToken, googleSignIn } from '../lib/firebase';
import { syncProjectToCalendar, syncTaskToCalendar, deleteEventFromCalendar } from '../lib/workspace';
import { Trash2, ArrowLeft, Edit2, Check, X, PlusCircle, Lock } from 'lucide-react';

interface ProjectsProps {
  workspaceId: string;
  projects: Project[];
  tasks: Task[];
  templates: ProjectTemplate[];
}

export const Projects: React.FC<ProjectsProps> = ({ workspaceId, projects, tasks, templates }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectSequential, setNewProjectSequential] = useState(false);
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Edit project state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectSequential, setEditProjectSequential] = useState(false);

  // Delete confirmation state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // New task inside project
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const project = await createProject({
        name: newProjectName,
        description: newProjectDesc,
        dueDate: newProjectDueDate ? newProjectDueDate + 'T12:00:00' : null,
        isSequential: newProjectSequential,
        workspaceId
      });

      if (newProjectDueDate) {
        let token = await getAccessToken();
        if (!token) {
          try {
            const res = await googleSignIn();
            token = res?.accessToken || null;
          } catch(e) { console.warn('User aborted sign in or error', e); }
        }
        if (token) {
          try {
            const eventRes = await syncProjectToCalendar(project.name, project.dueDate!, token);
            if (eventRes && eventRes.id) {
              await updateProject(project.id, { calendarEventId: eventRes.id });
            }
          } catch(e) { console.warn('Calendar sync project error:', e); }
        }
      }

      if (selectedTemplateId) {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template && template.tasks && template.tasks.length > 0) {
          console.log(`Creating ${template.tasks.length} tasks for project ${project.id}...`);
          try {
            for (let i = 0; i < template.tasks.length; i++) {
              const task = template.tasks[i];
              await createTask({
                title: task.title,
                description: task.description || '',
                projectId: project.id,
                priority: 'medium',
                status: 'todo',
                dueDate: null,
                workspaceId
              });
              await new Promise(r => setTimeout(r, 10));
            }
            console.log('Template tasks created.');
          } catch (taskErr) {
            console.error('Error creating template tasks:', taskErr);
          }
        } else {
          console.warn('Template not found or has no tasks.');
        }
      }

      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectSequential(false);
      setNewProjectDueDate('');
      setSelectedTemplateId('');
      setShowCreateProjectModal(false);
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEditProject = async (projectId: string) => {
    if (!editProjectName.trim()) return;
    try {
      await updateProject(projectId, { name: editProjectName, description: editProjectDesc, isSequential: editProjectSequential });
      setEditingProjectId(null);
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProjectId) return;
    try {
      const task = await createTask({
        title: newTaskTitle,
        description: '',
        projectId: selectedProjectId,
        priority: 'medium',
        status: 'todo',
        dueDate: newTaskDueDate ? newTaskDueDate + 'T12:00:00' : null,
        workspaceId
      });
      
      if (newTaskDueDate) {
        let token = await getAccessToken();
        if (!token) {
          try {
            const res = await googleSignIn();
            token = res?.accessToken || null;
          } catch(e) { console.warn('User aborted sign in or error', e); }
        }
        if (token) {
          try {
            const eventRes = await syncTaskToCalendar(task.title, task.dueDate!, token);
            if (eventRes && eventRes.id) {
              await updateTask(task.id, { calendarEventId: eventRes.id });
            }
          } catch(e) { console.warn('Calendar sync task error:', e); }
        }
      }

      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (selectedProject) {
    const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
    const sortedProjectTasks = [...projectTasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const todoTasks = sortedProjectTasks.filter(t => t.status !== 'done');
    const doneTasks = sortedProjectTasks.filter(t => t.status === 'done');
    const totalCount = projectTasks.length;
    const progress = totalCount > 0 ? (doneTasks.length / totalCount) * 100 : 0;
    
    const isSequential = selectedProject.isSequential;
    const firstTodoTaskId = todoTasks.length > 0 ? todoTasks[0].id : null;

    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto h-full min-h-[500px]">
        <div className="flex flex-col gap-3 bg-white p-4 border border-slate-200 rounded-xl shrink-0">
          <div className="flex items-start gap-4">
            <button onClick={() => setSelectedProjectId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors mt-1">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="flex-1 flex justify-between items-start group">
              {editingProjectId === selectedProject.id ? (
                <div className="flex-1 mr-4">
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="w-full px-2 py-1 mb-2 bg-white border border-slate-200 rounded text-sm font-bold focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <textarea
                    value={editProjectDesc}
                    onChange={(e) => setEditProjectDesc(e.target.value)}
                    className="w-full px-2 py-1 mb-2 bg-white border border-slate-200 rounded text-[10px] min-h-[40px] focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEditProject(selectedProject.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded bg-white border border-slate-200">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingProjectId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded bg-white border border-slate-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 mr-4">
                  <h2 className="text-sm font-bold text-slate-800">{selectedProject.name}</h2>
                  {selectedProject.description && <p className="text-[10px] text-slate-500 mt-1">{selectedProject.description}</p>}
                </div>
              )}
              
              {!editingProjectId && (
                <button
                  onClick={() => {
                    setEditingProjectId(selectedProject.id);
                    setEditProjectName(selectedProject.name);
                    setEditProjectDesc(selectedProject.description || '');
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="pl-12 w-full">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-400">{progress === 100 ? 'Concluído' : 'Progresso'}</span>
              <span className="text-[10px] font-bold text-slate-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* A Fazer */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">A Fazer ({todoTasks.length})</span>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-3 border-b border-slate-100 flex items-center gap-2 bg-white">
              <PlusCircle className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nova tarefa..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 text-xs bg-transparent border-none focus:outline-none focus:ring-0 min-w-0"
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-[110px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-500"
              />
              <button type="submit" className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider hover:text-indigo-700 shrink-0" disabled={!newTaskTitle.trim()}>Adicionar</button>
            </form>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {todoTasks.length === 0 ? (
                <div className="text-center p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nenhuma tarefa pendente.</div>
              ) : (
                todoTasks.map(t => {
                  const isLocked = isSequential && t.id !== firstTodoTaskId;
                  return (
                  <div key={t.id} className={`p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-3 group relative ${isLocked ? 'opacity-60 bg-slate-50' : ''}`}>
                    {isLocked ? (
                      <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-slate-400" />
                      </div>
                    ) : (
                      <input 
                        type="checkbox" 
                        checked={false} 
                        onChange={() => handleToggleTask(t)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    )}
                    <div className="flex-1">
                      <div className={`text-xs font-semibold ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>{t.title}</div>
                      {t.dueDate && <div className="text-[10px] text-indigo-500 mt-1">Prazo: {new Date(t.dueDate).toLocaleDateString()}</div>}
                    </div>
                    <button
                      onClick={() => setTaskToDelete(t)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )})
              )}
            </div>
          </div>
          
          {/* Concluídas */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Concluídas ({doneTasks.length})</span>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {doneTasks.length === 0 ? (
                <div className="text-center p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nenhuma tarefa concluída.</div>
              ) : (
                doneTasks.map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg shadow-sm opacity-60 flex items-start gap-3 group relative hover:opacity-100 transition-opacity">
                    <input 
                      type="checkbox" 
                      checked={true} 
                      onChange={() => handleToggleTask(t)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-500 line-through">{t.title}</div>
                    </div>
                    <button
                      onClick={() => setTaskToDelete(t)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto h-full">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Meus Projetos</h3>
        <button onClick={() => setShowCreateProjectModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Novo Projeto
        </button>
      </div>

      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Novo Projeto</h3>
              <button onClick={() => setShowCreateProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                <input
                  type="text"
                  placeholder="Nome do projeto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full md:flex-1 px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  disabled={isCreating}
                  required
                />
                <input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full md:flex-1 px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  disabled={isCreating}
                />
                <input
                  type="date"
                  value={newProjectDueDate}
                  onChange={(e) => setNewProjectDueDate(e.target.value)}
                  className="w-full md:w-[140px] px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 text-slate-500 shrink-0"
                  disabled={isCreating}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full mt-2">
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-2 rounded shrink-0 cursor-pointer w-full sm:w-auto justify-center">
                    <input
                      type="checkbox"
                      checked={newProjectSequential}
                      onChange={(e) => setNewProjectSequential(e.target.checked)}
                      className="text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 cursor-pointer disabled:opacity-50"
                      disabled={isCreating}
                    />
                    Sequenciais
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      const template = templates.find(t => t.id === e.target.value);
                      if (template && template.isSequential !== undefined) {
                        setNewProjectSequential(template.isSequential);
                      }
                    }}
                    className="w-full sm:w-[250px] px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-700 disabled:opacity-50"
                    disabled={isCreating || templates.length === 0}
                  >
                    <option value="">Sem modelo (Projeto em branco)</option>
                    {templates.length === 0 && (
                      <option disabled>Nenhum modelo (crie na aba Modelos)</option>
                    )}
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-4 w-full md:w-auto">
                  <button type="button" onClick={() => setShowCreateProjectModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors w-full md:w-auto">Cancelar</button>
                  <button
                    type="submit"
                    disabled={isCreating || !newProjectName.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                  >
                    {isCreating ? 'Criando...' : 'Criar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-max">
          {projects.length === 0 ? (
            <div className="col-span-full p-8 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
              Nenhum projeto encontrado.
            </div>
          ) : projects.map((project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const totalCount = projectTasks.length;
            const doneCount = projectTasks.filter(t => t.status === 'done').length;
            const todoCount = totalCount - doneCount;
            const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
            
            return (
            <div key={project.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/30 group relative hover:shadow-md transition-shadow flex flex-col cursor-pointer" onClick={() => setSelectedProjectId(project.id)}>
              <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {!editingProjectId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProjectId(project.id);
                      setEditProjectName(project.name);
                      setEditProjectDesc(project.description || '');
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-white border border-slate-200"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(project);
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {editingProjectId === project.id ? (
                <div className="flex flex-col gap-2 mb-2 pr-6" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <textarea
                    value={editProjectDesc}
                    onChange={(e) => setEditProjectDesc(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] min-h-[40px] focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleSaveEditProject(project.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded bg-white border border-slate-200">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setEditingProjectId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded bg-white border border-slate-200">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2 pr-12">
                    <span className="text-xs font-bold text-slate-800">{project.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2 line-clamp-2 flex-1">{project.description || 'Sem descrição.'}</p>
                  {project.isSequential && (
                    <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit mb-3">
                      Sequencial
                    </div>
                  )}
                </>
              )}
              
              <div className="mt-auto pt-3 border-t border-slate-200/60 w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-400">{progress === 100 ? 'Concluído' : 'Progresso'}</span>
                  <span className="text-[10px] font-bold text-slate-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                  <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">{new Date(project.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2 text-[10px] font-medium">
                     <span className="text-slate-500">{todoCount} pends.</span>
                     <span className="text-emerald-600">{doneCount} concl.</span>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>

      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Projeto</h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir o projeto "{projectToDelete.name}"? Todas as tarefas associadas também serão excluídas permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const target = projectToDelete;
                  setProjectToDelete(null);
                  if (selectedProjectId === target.id) {
                    setSelectedProjectId(null);
                  }
                  try {
                    let token = await getAccessToken();
                    if (!token && (target.calendarEventId || tasks.some(t => t.projectId === target.id && t.calendarEventId))) {
                      try {
                        const res = await googleSignIn();
                        token = res?.accessToken || null;
                      } catch(e) { console.warn('User aborted sign in or error', e); }
                    }
                    if (token) {
                      if (target.calendarEventId) {
                        await deleteEventFromCalendar(target.calendarEventId, token).catch(e => console.warn('Failed to delete project event from calendar', e));
                      }
                      const projectTasks = tasks.filter(t => t.projectId === target.id && t.calendarEventId);
                      for (const t of projectTasks) {
                        if (t.calendarEventId) {
                          await deleteEventFromCalendar(t.calendarEventId, token).catch(e => console.warn('Failed to delete task event from calendar', e));
                        }
                      }
                    }
                    await deleteProject(target.id, workspaceId);
                  } catch (err: any) {
                    console.error("Erro ao excluir: ", err.message);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Tarefa</h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir a tarefa "{taskToDelete.title}"?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const target = taskToDelete;
                  setTaskToDelete(null);
                  try {
                    if (target.calendarEventId) {
                      let token = await getAccessToken();
                      if (!token) {
                        try {
                          const res = await googleSignIn();
                          token = res?.accessToken || null;
                        } catch(e) { console.warn('User aborted sign in or error', e); }
                      }
                      if (token) {
                        await deleteEventFromCalendar(target.calendarEventId, token).catch(e => console.warn('Failed to delete event from calendar', e));
                      }
                    }
                    await deleteTask(target.id);
                  } catch (err: any) {
                    console.error("Erro ao excluir: ", err.message);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
