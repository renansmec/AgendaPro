import React, { useState, useEffect } from 'react';
import { createTask, updateTask, deleteTask } from '../lib/api';
import { Task, Project } from '../types';
import { Trash2, Edit2, Check, X, Lock, PlusCircle } from 'lucide-react';
import { syncTaskToCalendar, deleteEventFromCalendar } from '../lib/workspace';
import { getAccessToken, googleSignIn } from '../lib/supabase';

interface TasksProps {
  workspaceId: string;
  tasks: Task[];
  projects: Project[];
}

export const Tasks: React.FC<TasksProps> = ({ workspaceId, tasks, projects }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [syncing, setSyncing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      const task = await createTask({
        title: newTaskTitle,
        description: '',
        projectId: selectedProjectId || null,
        priority,
        status: 'todo',
        dueDate: dueDate ? dueDate + 'T12:00:00' : null,
        workspaceId
      });
      
      if (dueDate) {
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
      setDueDate('');
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  const handleSaveEditTask = async (task: Task) => {
    if (!editTaskTitle.trim()) return;
    try {
      await updateTask(task.id, { title: editTaskTitle });
      setEditingTaskId(null);
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  const handleSyncToCalendar = async (task: Task) => {
    if (!task.dueDate) return;
    
    const token = await getAccessToken();
    if (!token) {
      alert("Por favor, faça login com o Google para usar esta funcionalidade.");
      return;
    }

    const confirm = window.confirm(`Deseja adicionar a tarefa "${task.title}" ao seu Google Agenda?`);
    if (!confirm) return;

    setSyncing(true);
    try {
      const eventRes = await syncTaskToCalendar(task.title, task.dueDate, token);
      if (eventRes && eventRes.id) {
        await updateTask(task.id, { calendarEventId: eventRes.id });
      }
      alert("Tarefa sincronizada com sucesso!");
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
      alert("Erro ao sincronizar tarefa.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto h-full min-h-[500px]">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Tarefas</h3>
        <button onClick={() => setShowCreateTaskModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Nova Tarefa</h3>
              <button onClick={() => setShowCreateTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { handleCreateTask(e).then(() => setShowCreateTaskModal(false)); }} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="O que precisa ser feito?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                required
              />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Nenhum projeto (Opcional)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="flex gap-4">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="flex-1 px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden flex-1">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lista de Tarefas ({tasks.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-1">
          <div className="flex flex-col">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Nenhuma tarefa encontrada.</div>
            ) : tasks.map((task) => {
              const project = projects.find(p => p.id === task.projectId);
              let isLocked = false;
              if (project?.isSequential && task.status !== 'done') {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const sortedProjectTasks = [...projectTasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                const todoTasks = sortedProjectTasks.filter(t => t.status !== 'done');
                if (todoTasks.length > 0 && todoTasks[0].id !== task.id) {
                  isLocked = true;
                }
              }
              return (
                <div key={task.id} className={`p-3 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 group ${task.status === 'done' || isLocked ? 'opacity-60 bg-slate-50' : ''}`}>
                  {isLocked ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                  ) : (
                    <input 
                      type="checkbox" 
                      checked={task.status === 'done'}
                      onChange={() => handleToggleStatus(task)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                    />
                  )}
                  <div className="flex-1">
                    {editingTaskId === task.id && !isLocked ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditTask(task);
                            if (e.key === 'Escape') setEditingTaskId(null);
                          }}
                        />
                        <button onClick={() => handleSaveEditTask(task)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingTaskId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                            {task.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            task.priority === 'high' ? 'bg-red-100 text-red-600' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {project && (
                            <span className="text-[10px] text-slate-400">Projeto: {project.name}</span>
                          )}
                          {project && task.dueDate && <span className="text-[10px] text-slate-400">•</span>}
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.dueDate && !editingTaskId && (
                      <button
                        onClick={() => handleSyncToCalendar(task)}
                        disabled={syncing}
                        className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors"
                        title="Adicionar ao Google Agenda"
                      >
                        GCal Sync
                      </button>
                    )}
                    {!editingTaskId && (
                      <button
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditTaskTitle(task.title);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-white border border-slate-200 transition-colors"
                        title="Editar tarefa"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
