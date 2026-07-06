import React, { useState } from 'react';
import { ProjectTemplate, TemplateTask } from '../types';
import { createProjectTemplate, deleteProjectTemplate, updateProjectTemplate } from '../lib/api';
import { Trash2, PlusCircle, X, Edit2 } from 'lucide-react';

interface TemplatesProps {
  workspaceId: string;
  templates: ProjectTemplate[];
}

export const Templates: React.FC<TemplatesProps> = ({ workspaceId, templates }) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateSequential, setNewTemplateSequential] = useState(false);
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTemplateTasks([...templateTasks, { title: newTaskTitle, description: newTaskDesc }]);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = [...templateTasks];
    newTasks.splice(index, 1);
    setTemplateTasks(newTasks);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    try {
      const finalTasks = [...templateTasks];
      if (newTaskTitle.trim()) {
        finalTasks.push({ title: newTaskTitle, description: newTaskDesc });
        setNewTaskTitle('');
        setNewTaskDesc('');
      }
      
      if (editingTemplateId) {
        await updateProjectTemplate(editingTemplateId, {
          name: newTemplateName,
          description: newTemplateDesc,
          isSequential: newTemplateSequential,
          tasks: finalTasks
        });
      } else {
        await createProjectTemplate({
          name: newTemplateName,
          description: newTemplateDesc,
          isSequential: newTemplateSequential,
          tasks: finalTasks,
          workspaceId
        });
      }
      
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateSequential(false);
      setTemplateTasks([]);
      setEditingTemplateId(null);
      setShowCreateTemplateModal(false);
    } catch (err: any) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  const handleEditTemplate = (template: ProjectTemplate) => {
    setEditingTemplateId(template.id);
    setNewTemplateName(template.name);
    setNewTemplateDesc(template.description || '');
    setNewTemplateSequential(template.isSequential || false);
    setTemplateTasks(template.tasks || []);
    setShowCreateTemplateModal(true);
  };
  
  const openNewTemplateModal = () => {
    setEditingTemplateId(null);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateSequential(false);
    setTemplateTasks([]);
    setShowCreateTemplateModal(true);
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto h-full min-h-[500px]">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Modelos de Projeto</h3>
        <button onClick={openNewTemplateModal} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Novo Modelo
        </button>
      </div>
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingTemplateId ? "Editar Modelo" : "Novo Modelo"}</h3>
              <button onClick={() => setShowCreateTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Nome do modelo"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="flex-[2] px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="flex-[3] px-4 py-2 bg-slate-100 border-none rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <label className="flex items-center justify-center gap-2 text-xs font-medium text-slate-700 bg-slate-100 px-3 rounded cursor-pointer w-full md:w-auto">
                  <input
                    type="checkbox"
                    checked={newTemplateSequential}
                    onChange={(e) => setNewTemplateSequential(e.target.checked)}
                    className="text-indigo-600 focus:ring-indigo-500 rounded border-slate-300 cursor-pointer"
                  />
                  Sequenciais
                </label>
              </div>
              
              <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Tarefas Predefinidas</h4>
                
                <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Título da tarefa"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-[2] px-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Descrição (opcional)"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="flex-[3] px-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <PlusCircle className="w-3 h-3" /> Adicionar
                  </button>
                </form>
                
                {templateTasks.length > 0 ? (
                  <ul className="space-y-2">
                    {templateTasks.map((t, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded shadow-sm text-xs group">
                        <div>
                          <div className="font-semibold text-slate-700">{t.title}</div>
                          {t.description && <div className="text-[10px] text-slate-500">{t.description}</div>}
                        </div>
                        <button type="button" onClick={() => handleRemoveTask(idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[10px] text-slate-400 text-center py-2">Nenhuma tarefa adicionada ao modelo.</div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowCreateTemplateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button
                  onClick={() => handleCreateTemplate()}
                  disabled={!newTemplateName.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  Salvar Modelo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 overflow-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Modelos Salvos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full p-8 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
              Nenhum modelo criado.
            </div>
          ) : templates.map(template => (
            <div key={template.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col h-full group relative">
               <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-white border border-slate-200"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteProjectTemplate(template.id).catch(err => { if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); } })}
                  className="p-1 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <h4 className="text-sm font-bold text-slate-800 pr-6">{template.name}</h4>
              {template.description && <p className="text-[10px] text-slate-500 mt-1 mb-2">{template.description}</p>}
              {template.isSequential && (
                <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit mb-3">
                  Sequencial
                </div>
              )}
              <div className="mt-auto pt-3 border-t border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  {template.tasks.length} Tarefa(s)
                </span>
                <div className="space-y-1">
                  {template.tasks.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="text-[10px] text-slate-600 truncate flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full shrink-0" />
                      {t.title}
                    </div>
                  ))}
                  {template.tasks.length > 3 && (
                    <div className="text-[10px] text-slate-400 italic mt-1">
                      + {template.tasks.length - 3} outras tarefas
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
