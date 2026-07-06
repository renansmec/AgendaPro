import React, { useState, useEffect } from 'react';
import { Workspace, WorkspaceMember, WorkspaceInvite, Role } from '../types';
import { createWorkspace, getWorkspaceMembers, getWorkspaceInvites, inviteUserToWorkspace, removeMember } from '../lib/api';
import { Users, PlusCircle, Trash2, Mail, Shield, ShieldAlert, X } from 'lucide-react';

interface WorkspacesProps {
  currentWorkspaceId: string;
  userEmail: string;
  workspaces: Workspace[];
  onWorkspaceChange: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

export const Workspaces: React.FC<WorkspacesProps> = ({ currentWorkspaceId, userEmail, workspaces, onWorkspaceChange, refreshWorkspaces }) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  const currentUserMember = members.find(m => m.email === userEmail);
  const isAdmin = currentUserMember?.role === 'admin' || currentWorkspace?.ownerId === currentUserMember?.userId;

  const loadData = async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    const m = await getWorkspaceMembers(currentWorkspaceId);
    setMembers(m);
    if (isAdmin) {
      const i = await getWorkspaceInvites(currentWorkspaceId);
      setInvites(i);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspaceId]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    // user ID is needed... wait, we only have userEmail. Let's get user ID from currentUserMember or pass it.
    // Actually, we don't have userId in props. Let's just pass it or get it from auth.
    // Let's import auth instead
    const { auth } = await import('../lib/firebase');
    const user = auth.currentUser;
    if (!user) return;
    
    await createWorkspace(newWorkspaceName, user.uid, user.email || '');
    await refreshWorkspaces();
    setNewWorkspaceName('');
    setShowCreateModal(false);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await inviteUserToWorkspace(currentWorkspaceId, inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setShowInviteModal(false);
    loadData();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;
    await removeMember(memberId);
    loadData();
  };

  if (!currentWorkspace) return null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto h-full p-2">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Gestão de Ambientes</h3>
        <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Novo Ambiente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-max">
        {/* Workspaces List */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Seus Ambientes</h4>
          <div className="flex flex-col gap-2">
            {workspaces.map(w => (
              <div 
                key={w.id} 
                onClick={() => onWorkspaceChange(w.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors \${w.id === currentWorkspaceId ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}
              >
                <div className="font-semibold text-sm text-slate-800">{w.name}</div>
                <div className="text-[10px] text-slate-500 mt-1">ID: {w.id.substring(0, 8)}...</div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Workspace Details */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{currentWorkspace.name}</h2>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Shield className="w-3 h-3" /> {isAdmin ? 'Você é um Administrador' : 'Você é um Membro'}
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setShowInviteModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" /> Convidar Membro
              </button>
            )}
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Membros do Ambiente</h4>
          
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
                      {m.email.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{m.email} {m.email === userEmail && '(Você)'}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-medium">{m.role === 'admin' ? 'Administrador' : 'Membro'}</div>
                    </div>
                  </div>
                  {isAdmin && m.email !== userEmail && (
                    <button onClick={() => handleRemoveMember(m.id)} className="p-2 text-slate-400 hover:text-red-600 rounded hover:bg-white transition-colors" title="Remover">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {isAdmin && invites.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Convites Pendentes
                  </h4>
                  <div className="flex flex-col gap-2">
                    {invites.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100/50">
                        <div>
                          <div className="text-sm font-medium text-slate-700">{inv.email}</div>
                          <div className="text-[10px] text-amber-600/80 uppercase font-medium">Aguardando aceite • {inv.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Criar Novo Ambiente</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nome do Ambiente</label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  placeholder="Ex: Empresa X, Projeto Pessoal..."
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={!newWorkspaceName.trim()} className="px-6 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Criar Ambiente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Convidar Membro</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">E-mail do Usuário</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Função</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as Role)}
                  className="w-full px-4 py-2 bg-slate-100 border-none rounded focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="member">Membro (Pode editar tarefas e projetos)</option>
                  <option value="admin">Administrador (Pode convidar/remover membros)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={!inviteEmail.trim()} className="px-6 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 disabled:opacity-50">Enviar Convite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
