import React, { useMemo } from 'react';
import { Task, Project } from '../types';
import { CalendarDays, AlertTriangle, CheckCircle } from 'lucide-react';

interface WeeklySummaryProps {
  tasks: Task[];
  projects: Project[];
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ tasks, projects }) => {
  const { pendingTasksThisWeek, urgentProject } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Filter pending tasks that have due date within the next 7 days (or overdue)
    const pendingTasksThisWeek = tasks.filter(t => {
      if (t.status === 'done' || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.getTime() <= nextWeek.getTime();
    }).length;

    // Find the project with the earliest due date that is not completed (let's assume projects don't have a status, just check the earliest one)
    const activeProjects = projects.filter(p => p.dueDate);
    let urgentProject = null;
    if (activeProjects.length > 0) {
      urgentProject = activeProjects.reduce((prev, current) => {
        if (!prev.dueDate) return current;
        if (!current.dueDate) return prev;
        return new Date(prev.dueDate).getTime() < new Date(current.dueDate).getTime() ? prev : current;
      });
    }

    return { pendingTasksThisWeek, urgentProject };
  }, [tasks, projects]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Resumo da Semana
        </h3>
        
        <div className="mb-6">
          <div className="flex items-end gap-3 mb-1">
            <span className="text-3xl font-black text-indigo-600 leading-none">{pendingTasksThisWeek}</span>
            <span className="text-sm font-semibold text-slate-600 mb-1">tarefas pendentes</span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">para os próximos 7 dias</p>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Projeto Mais Urgente</h4>
          {urgentProject ? (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-amber-900 truncate pr-2">{urgentProject.name}</span>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
              <div className="text-xs text-amber-700 font-medium">
                Prazo: {new Date(urgentProject.dueDate!).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-slate-600">Nenhum projeto com prazo definido.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
