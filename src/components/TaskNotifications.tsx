import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { AlertCircle, X } from 'lucide-react';

interface TaskNotificationsProps {
  tasks: Task[];
}

export const TaskNotifications: React.FC<TaskNotificationsProps> = ({ tasks }) => {
  const [notifications, setNotifications] = useState<Task[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const upcomingTasks = tasks.filter(t => {
      if (t.status === 'done' || !t.dueDate) return false;
      if (dismissed.has(t.id)) return false;
      
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      
      // Tasks that are due today, tomorrow, or overdue by at most 3 days
      return daysDiff >= -3 && daysDiff <= 2;
    });

    const sorted = upcomingTasks.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    setNotifications(sorted.slice(0, 3)); // Show max 3 notifications at a time
  }, [tasks, dismissed]);

  const dismiss = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map(task => {
        const dueDate = new Date(task.dueDate!);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        let dateText = '';
        let isOverdue = false;
        
        if (daysDiff === 0) {
          dateText = 'hoje';
        } else if (daysDiff === 1) {
          dateText = 'amanhã';
        } else if (daysDiff < 0) {
          dateText = 'há ' + Math.abs(daysDiff) + ' dia(s)';
          isOverdue = true;
        } else {
          dateText = 'em ' + daysDiff + ' dias';
        }

        return (
          <div key={task.id} className={`bg-white border-l-4 ${isOverdue ? 'border-red-500' : 'border-amber-500'} rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-4`}>
            <AlertCircle className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-amber-500'} shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800">
                {isOverdue ? 'Tarefa Atrasada' : 'Prazo Próximo'}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                A tarefa <strong>{task.title}</strong> {isOverdue ? 'venceu' : 'vence'} {dateText}.
              </p>
            </div>
            <button onClick={() => dismiss(task.id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
