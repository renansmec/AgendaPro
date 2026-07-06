/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, LogOut, Copy, Menu, X, LayoutDashboard, FolderKanban, ListTodo, CalendarDays, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { initAuth, googleSignIn, logout } from './lib/firebase';
import { subscribeToProjects, subscribeToTasks, subscribeToProjectTemplates, getWorkspacesForUser, createWorkspace, getPendingInvitesForEmail, acceptInvite } from './lib/api';
import { Workspace, WorkspaceInvite } from './types';
import { Workspaces } from './components/Workspaces';
import { User } from 'firebase/auth';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Tasks } from './components/Tasks';
import { Templates } from './components/Templates';
import { TaskNotifications } from './components/TaskNotifications';
import { Task, Project, ProjectTemplate } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'tasks' | 'templates' | 'workspaces'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<WorkspaceInvite[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);


  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        if (!u) setLoading(false);
      },
      () => {
        setUser(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 1. Fetch workspaces and invites first
  useEffect(() => {
    if (!user) return;
    setWorkspaceLoading(true);
    
    const loadWorkspaces = async () => {
      if (user.email) {
        const invites = await getPendingInvitesForEmail(user.email);
        setPendingInvites(invites);
      }
      
      let w = await getWorkspacesForUser(user.uid);
      if (w.length === 0) {
        // Create default workspace
        const defaultW = await createWorkspace("Meu Ambiente", user.uid, user.email || "");
        w = [defaultW];
      }
      setWorkspaces(w);
      if (!currentWorkspaceId || !w.find(wx => wx.id === currentWorkspaceId)) {
        setCurrentWorkspaceId(w[0].id);
      }
      setWorkspaceLoading(false);
    };
    
    loadWorkspaces();
  }, [user]);

  // 2. Fetch data based on current workspace
  useEffect(() => {
    if (!user || !currentWorkspaceId || workspaceLoading) return;
    setDataLoading(true);
    let tasksLoaded = false;
    let projectsLoaded = false;
    let templatesLoaded = false;
    const checkLoading = () => {
      if (tasksLoaded && projectsLoaded && templatesLoaded) {
        setDataLoading(false);
        setLoading(false);
      }
    }
    const unsubTasks = subscribeToTasks(currentWorkspaceId, (t) => {
      setTasks(t);
      tasksLoaded = true;
      checkLoading();
    });
    const unsubProjects = subscribeToProjects(currentWorkspaceId, (p) => {
      setProjects(p);
      projectsLoaded = true;
      checkLoading();
    });
    const unsubTemplates = subscribeToProjectTemplates(currentWorkspaceId, (t) => {
      setTemplates(t);
      templatesLoaded = true;
      checkLoading();
    });
    return () => {
      unsubTasks();
      unsubProjects();
      unsubTemplates();
    };
  }, [currentWorkspaceId, workspaceLoading]);

  const handleAcceptInvite = async (invite: WorkspaceInvite) => {
    if (!user) return;
    await acceptInvite(invite, user.uid);
    setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    const w = await getWorkspacesForUser(user.uid);
    setWorkspaces(w);
    setCurrentWorkspaceId(invite.workspaceId);
  };

  const handleLogin = async () => {
    try {
      await googleSignIn();
    } catch (err) {
      if (err && err.message && (err.message.includes('aborted') || err.message.includes('popup'))) { console.warn('User aborted'); } else { console.error(err); }
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#F1F5F9]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F1F5F9] font-sans">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-sm w-full shadow-sm">
          <div className="w-12 h-12 bg-indigo-500 rounded flex items-center justify-center mx-auto mb-4 shadow-md">
             <div className="w-6 h-6 bg-white rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-2">AGENDA PRO</h1>
          <p className="text-xs text-slate-500 mb-8 leading-relaxed">Faça login para gerenciar seus projetos e tarefas, com sincronização em tempo real e modo offline.</p>
          <button onClick={handleLogin} className="w-full bg-slate-900 border border-slate-800 rounded py-2.5 px-4 hover:bg-slate-800 transition-colors flex items-center justify-center gap-3">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Entrar com Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-slate-800 font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-56' : 'w-20'} bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 shrink-0`}>
        <div className={`p-6 flex items-center ${isSidebarOpen ? 'gap-2' : 'justify-center'} mb-4`}>
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shrink-0 text-white">
            <CalendarDays className="w-5 h-5" />
          </div>
          {isSidebarOpen && <span className="font-bold text-white tracking-tight">AGENDA PRO</span>}
        </div>

        <nav className={`flex-1 ${isSidebarOpen ? 'px-4' : 'px-2'} flex flex-col gap-1`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded text-sm transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 opacity-80'
            }`}
          >
            <LayoutDashboard className={`shrink-0 w-5 h-5 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-500'}`} />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('projects')}
            title="Projetos"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded text-sm transition-colors ${
              activeTab === 'projects' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 opacity-80'
            }`}
          >
            <FolderKanban className={`shrink-0 w-5 h-5 ${activeTab === 'projects' ? 'text-white' : 'text-slate-500'}`} />
            {isSidebarOpen && <span>Projetos</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('tasks')}
            title="Tarefas"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded text-sm transition-colors ${
              activeTab === 'tasks' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 opacity-80'
            }`}
          >
            <ListTodo className={`shrink-0 w-5 h-5 ${activeTab === 'tasks' ? 'text-white' : 'text-slate-500'}`} />
            {isSidebarOpen && <span>Tarefas</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('templates')}
            title="Modelos"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded text-sm transition-colors ${
              activeTab === 'templates' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 opacity-80'
            }`}
          >
            <Copy className={`shrink-0 w-5 h-5 ${activeTab === 'templates' ? 'text-white' : 'text-slate-500'}`} />
            {isSidebarOpen && <span>Modelos</span>}
          </button>
<button
            onClick={() => setActiveTab('workspaces')}
            title="Ambientes"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded text-sm transition-colors ${
              activeTab === 'workspaces' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 opacity-80'
            }`}
          >
            <Users className={`shrink-0 w-5 h-5 ${activeTab === 'workspaces' ? 'text-white' : 'text-slate-500'}`} />
            {isSidebarOpen && <span>Ambientes</span>}
          </button>
        </nav>

        <div className={`mt-auto ${isSidebarOpen ? 'p-4' : 'p-2'} border-t border-slate-800 flex flex-col`}>
          <div className={`flex items-center ${isSidebarOpen ? 'gap-2 px-2' : 'justify-center'} mb-4`}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></div>
            {isSidebarOpen && <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Sincronizado</span>}
          </div>
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3 px-2' : 'justify-center'} mb-4`}>
            <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
            {isSidebarOpen && (
              <div className="overflow-hidden flex flex-col">
                <span className="text-xs font-semibold text-white truncate">{user.displayName}</span>
                <span className="text-[10px] opacity-60 truncate">{user.email}</span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title="Sair"
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded text-sm opacity-80 hover:bg-slate-800 transition-colors`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors -ml-2"
              title={isSidebarOpen ? "Recolher menu" : "Expandir menu"}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="font-bold text-lg text-slate-900 capitalize">
              {activeTab}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Ambiente:</span>
              <select 
                value={currentWorkspaceId || ''} 
                onChange={(e) => setCurrentWorkspaceId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-slate-100 border-none rounded py-1 pl-2 pr-6 focus:ring-1 focus:ring-indigo-500"
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Google Cal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Drive</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 relative">
          {dataLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
                <Dashboard workspaceId={currentWorkspaceId!} tasks={tasks} projects={projects} />
              </div>
              <div className={activeTab === 'projects' ? 'block h-full' : 'hidden'}>
                <Projects workspaceId={currentWorkspaceId!} projects={projects} tasks={tasks} templates={templates} />
              </div>
              <div className={activeTab === 'tasks' ? 'block' : 'hidden'}>
                <Tasks workspaceId={currentWorkspaceId!} tasks={tasks} projects={projects} />
              </div>
              <div className={activeTab === 'templates' ? 'block h-full' : 'hidden'}>
                <Templates workspaceId={currentWorkspaceId!} templates={templates} />
              </div>
            <div className={activeTab === 'workspaces' ? 'block h-full' : 'hidden'}>
                {currentWorkspaceId && <Workspaces currentWorkspaceId={currentWorkspaceId} userEmail={user.email!} onWorkspaceChange={setCurrentWorkspaceId} workspaces={workspaces} refreshWorkspaces={async () => { const w = await getWorkspacesForUser(user.uid); setWorkspaces(w); }} />}
              </div>
            </>
          )}
        </div>
        <TaskNotifications tasks={tasks} />
      
      {pendingInvites.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Convites Pendentes</h3>
            <div className="space-y-4">
              {pendingInvites.map(invite => (
                <div key={invite.id} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-700">Você foi convidado(a) para participar de um ambiente.</span>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setPendingInvites(prev => prev.filter(i => i.id !== invite.id))} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded">Ignorar</button>
                    <button onClick={() => handleAcceptInvite(invite)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors">Aceitar Convite</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
