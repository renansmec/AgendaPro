import { getAccessToken, googleSignIn } from '../lib/supabase';
import { syncProjectToCalendar, syncTaskToCalendar } from '../lib/workspace';
import React, { useState } from 'react';
import { Task, Project } from '../types';
import { ChevronLeft, ChevronRight, PlusCircle, X } from 'lucide-react';
import { createTask, createProject, updateTask, updateProject } from '../lib/api';

interface CalendarProps {
  workspaceId: string;
  tasks: Task[];
  projects: Project[];
}

export const Calendar: React.FC<CalendarProps> = ({ workspaceId, tasks, projects }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newItemType, setNewItemType] = useState<'task' | 'project'>('task');
  const [newItemTitle, setNewItemTitle] = useState('');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getItemsForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
    const dayProjects = projects.filter(p => p.dueDate && p.dueDate.startsWith(dateStr));
    return { dayTasks, dayProjects };
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !selectedDate) return;
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const isoDateStr = dateStr + 'T12:00:00';

    try {
      let token = await getAccessToken();
      if (!token) {
        try {
          const res = await googleSignIn();
          token = res?.accessToken || null;
        } catch(e) { console.warn('User aborted sign in or error', e); }
      }
      if (newItemType === 'task') {
        const task = await createTask({
          workspaceId,
          title: newItemTitle,
          description: '',
          projectId: null,
          priority: 'medium',
          status: 'todo',
          dueDate: isoDateStr,
        });
        if (token) {
          try {
            const eventRes = await syncTaskToCalendar(task.title, task.dueDate!, token);
            if (eventRes && eventRes.id) {
              await updateTask(task.id, { calendarEventId: eventRes.id });
            }
          } catch(e) { console.warn('Calendar sync task error:', e); }
        }
      } else {
        const project = await createProject({
          workspaceId,
          name: newItemTitle,
          description: '',
          dueDate: isoDateStr,
        });
        if (token) {
          try {
            const eventRes = await syncProjectToCalendar(project.name, project.dueDate!, token);
            if (eventRes && eventRes.id) {
              await updateProject(project.id, { calendarEventId: eventRes.id });
            }
          } catch(e) { console.warn('Calendar sync project error:', e); }
        }
      }
      setNewItemTitle('');
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar item.');
    }
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Calendário</h3>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-slate-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-lg overflow-hidden">
        {weekDays.map(day => (
          <div key={day} className="bg-slate-50 text-center py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[80px]" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const { dayTasks, dayProjects } = getItemsForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div 
              key={day}
              onClick={() => handleDayClick(day)}
              className={`bg-white min-h-[80px] p-1.5 cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100 group relative ${isToday ? 'bg-indigo-50/30' : ''}`}
            >
              <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>
                {day}
              </div>
              
              <div className="flex flex-col gap-1 overflow-hidden h-14">
                {dayProjects.map(p => (
                  <div key={p.id} className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded truncate font-medium">
                    {p.name}
                  </div>
                ))}
                {dayTasks.map(t => (
                  <div key={t.id} className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded truncate font-medium">
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Compromissos para {selectedDate.toLocaleDateString()}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 space-y-2 max-h-48 overflow-y-auto pr-2">
              {getItemsForDate(selectedDate).dayProjects.length === 0 && getItemsForDate(selectedDate).dayTasks.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Nenhum compromisso para este dia.</p>
              )}
              {getItemsForDate(selectedDate).dayProjects.map(p => (
                <div key={p.id} className="p-2 border border-emerald-200 bg-emerald-50 rounded flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-900">{p.name}</span>
                  <span className="text-[10px] text-emerald-600 ml-auto uppercase tracking-wider font-bold">Projeto</span>
                </div>
              ))}
              {getItemsForDate(selectedDate).dayTasks.map(t => (
                <div key={t.id} className="p-2 border border-indigo-200 bg-indigo-50 rounded flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-sm font-medium text-indigo-900">{t.title}</span>
                  <span className="text-[10px] text-indigo-600 ml-auto uppercase tracking-wider font-bold">Tarefa</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreate} className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Adicionar Novo</h4>
              <div className="flex gap-2 mb-3">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={newItemType === 'task'} onChange={() => setNewItemType('task')} className="text-indigo-600" />
                  Tarefa
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" checked={newItemType === 'project'} onChange={() => setNewItemType('project')} className="text-emerald-600" />
                  Projeto
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Nome do novo ${newItemType === 'task' ? 'tarefa' : 'projeto'}`}
                  className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={!newItemTitle.trim()} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
