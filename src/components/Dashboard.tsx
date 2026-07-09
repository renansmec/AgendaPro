import React, { useState } from 'react';
import { Task, Project } from '../types';
import { CheckCircle2, Clock, FolderKanban, Cloud } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { exportReportToDrive } from '../lib/workspace';
import { getAccessToken } from '../lib/supabase';
import { Calendar } from './Calendar';
import { WeeklySummary } from './WeeklySummary';

interface DashboardProps {
  workspaceId: string;
  tasks: Task[];
  projects: Project[];
}

export const Dashboard: React.FC<DashboardProps> = ({ workspaceId, tasks, projects }) => {
  const [exporting, setExporting] = useState(false);

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const activeTasks = tasks.filter(t => t.status !== 'done').length;

  const data = [
    { name: 'A Fazer', value: activeTasks, color: '#6366f1' },
    { name: 'Concluídas', value: completedTasks, color: '#10b981' }
  ];

  const handleExportDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      alert("Por favor, faça login com o Google para usar esta funcionalidade.");
      return;
    }

    const confirm = window.confirm('Deseja exportar o relatório de produtividade para o Google Drive?');
    if (!confirm) return;

    setExporting(true);
    try {
      const reportContent = `Relatório de Produtividade - Agenda Pro\n\nData: ${new Date().toLocaleDateString()}\nProjetos Ativos: ${projects.length}\nTarefas Concluídas: ${completedTasks}\nTarefas Pendentes: ${activeTasks}`;
      await exportReportToDrive(reportContent, token);
      alert("Relatório salvo no Google Drive com sucesso!");
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
      alert("Erro ao exportar relatório.");
    } finally {
      setExporting(false);
      }
    };
  
    return (
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
      <div className="flex justify-end mb-2">
        <button
          onClick={handleExportDrive}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
        >
          <Cloud className="w-4 h-4" />
          {exporting ? 'Salvando...' : 'Exportar Relatório'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarefas Concluídas</p>
            <p className="text-2xl font-black text-slate-900">{completedTasks}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarefas Pendentes</p>
            <p className="text-2xl font-black text-slate-900">{activeTasks}</p>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Projetos Ativos</p>
            <p className="text-2xl font-black text-slate-900">{projects.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-4 border border-slate-200 rounded-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Produtividade Geral</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-900 rounded-xl p-4 text-white flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center">
              <span className="text-lg">☁️</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Cloud Sync</span>
              <span className="text-xs font-medium">Suporte Offline Ativo</span>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed opacity-80 mb-6">As alterações feitas offline serão sincronizadas automaticamente assim que a conexão for restabelecida.</p>
          <div className="mt-auto w-full space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold uppercase text-indigo-200">Foco</span>
               <div className="flex gap-0.5">
                 <div className="w-1 h-3 bg-indigo-400"></div>
                 <div className="w-1 h-3 bg-indigo-400"></div>
                 <div className="w-1 h-3 bg-indigo-400"></div>
                 <div className="w-1 h-3 bg-indigo-400"></div>
                 <div className="w-1 h-3 bg-indigo-800"></div>
               </div>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold uppercase text-indigo-200">Eficiência</span>
               <div className="flex gap-0.5">
                 <div className="w-1 h-3 bg-emerald-400"></div>
                 <div className="w-1 h-3 bg-emerald-400"></div>
                 <div className="w-1 h-3 bg-emerald-400"></div>
                 <div className="w-1 h-3 bg-emerald-800"></div>
                 <div className="w-1 h-3 bg-emerald-800"></div>
               </div>
             </div>
           </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <Calendar workspaceId={workspaceId} tasks={tasks} projects={projects} />
        </div>
        <div className="lg:col-span-1">
          <WeeklySummary tasks={tasks} projects={projects} />
        </div>
      </div>
    </div>
  );
};
