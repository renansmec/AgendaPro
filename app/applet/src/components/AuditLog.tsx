import React, { useMemo } from 'react';
import { Project, Task } from '../types';
import { Activity, FileText, CheckSquare, Clock, ClipboardList } from 'lucide-react';

interface AuditLogProps {
  projects: Project[];
  tasks: Task[];
}

interface LogEntry {
  id: string;
  type: 'project' | 'task';
  action: 'created' | 'updated';
  title: string;
  date: Date;
  projectName?: string;
}

export const AuditLog: React.FC<AuditLogProps> = ({ projects, tasks }) => {
  const logs = useMemo(() => {
    const entries: LogEntry[] = [];
    
    projects.forEach(p => {
      entries.push({
        id: `p-create-${p.id}`,
        type: 'project',
        action: 'created',
        title: p.name,
        date: new Date(p.createdAt)
      });
      // Allow a small margin of error (e.g. 1 second) for createdAt vs updatedAt equality
      const isUpdated = p.updatedAt && (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime() > 1000);
      if (isUpdated) {
        entries.push({
          id: `p-update-${p.id}`,
          type: 'project',
          action: 'updated',
          title: p.name,
          date: new Date(p.updatedAt)
        });
      }
    });

    tasks.forEach(t => {
      const project = projects.find(p => p.id === t.projectId);
      const projectName = project ? project.name : undefined;

      entries.push({
        id: `t-create-${t.id}`,
        type: 'task',
        action: 'created',
        title: t.title,
        date: new Date(t.createdAt),
        projectName
      });
      const isUpdated = t.updatedAt && (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime() > 1000);
      if (isUpdated) {
        entries.push({
          id: `t-update-${t.id}`,
          type: 'task',
          action: 'updated',
          title: t.title,
          date: new Date(t.updatedAt),
          projectName
        });
      }
    });

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [projects, tasks]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto h-full p-2">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Registro de Auditoria
        </h3>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Nenhuma interação registrada ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`p-2 rounded-full ${log.type === 'project' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {log.type === 'project' ? <FileText className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">
                      {log.type === 'project' ? 'Projeto' : 'Tarefa'} {log.action === 'created' ? 'criado(a)' : 'atualizado(a)'}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-sm text-slate-600">{log.title}</span>
                    {log.projectName && (
                      <>
                        <span className="text-xs text-slate-500">no projeto</span>
                        <span className="text-[10px] text-indigo-600 font-bold tracking-wider uppercase bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{log.projectName}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {log.date.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
