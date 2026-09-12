import React from 'react';
import { AuditLogEntry } from '../types';
import { FileText, CheckSquare, Clock, ClipboardList, Trash2 } from 'lucide-react';

interface AuditLogProps {
  auditLogs: AuditLogEntry[];
}

export const AuditLog: React.FC<AuditLogProps> = ({ auditLogs }) => {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto h-full p-2">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Registro de Auditoria
        </h3>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl p-6 overflow-y-auto">
        {auditLogs.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center max-w-md mx-auto">
            <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
            <h4 className="font-bold text-slate-700 mb-2">Nenhum registro encontrado</h4>
            <p className="text-sm text-slate-500 mb-4">
              O histórico de atividades está vazio. Crie, edite ou exclua um projeto ou tarefa para começar a registrar as ações.
            </p>
            <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg text-left w-full border border-amber-200 mb-2">
              <strong>Atenção (Atualização da Tabela):</strong> Para que os detalhes das alterações sejam salvos corretamente, você precisa adicionar a coluna `details` à tabela `auditLogs` já existente. Execute o comando SQL:
              <br /><code className="block mt-2 bg-amber-100 p-2 rounded">ALTER TABLE "auditLogs" ADD COLUMN details TEXT;</code>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`p-2 rounded-full ${
                  log.entityType === 'project' 
                    ? log.action === 'deleted' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                    : log.action === 'deleted' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {log.action === 'deleted' ? <Trash2 className="w-5 h-5" /> : log.entityType === 'project' ? <FileText className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">
                      {log.entityType === 'project' ? 'Projeto' : 'Tarefa'} {log.action === 'created' ? 'criado(a)' : log.action === 'updated' ? 'atualizado(a)' : 'deletado(a)'}
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
                  {log.details && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                      <strong className="text-slate-600 block mb-1">Alterações:</strong>
                      <ul className="list-disc pl-4">
                        {log.details.split('; ').map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
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
