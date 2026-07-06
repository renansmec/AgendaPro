const fs = require('fs');
let content = fs.readFileSync('src/components/Templates.tsx', 'utf8');

// Imports
content = content.replace(
  "import { createProjectTemplate, deleteProjectTemplate } from '../lib/api';",
  "import { createProjectTemplate, deleteProjectTemplate, updateProjectTemplate } from '../lib/api';"
);
content = content.replace(
  "import { Trash2, PlusCircle, X } from 'lucide-react';",
  "import { Trash2, PlusCircle, X, Edit2 } from 'lucide-react';"
);

// State
content = content.replace(
  "const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);",
  "const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);\n  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);"
);

// handleCreateTemplate -> handleSaveTemplate
content = content.replace(
  "const handleCreateTemplate = async () => {",
  `const handleSaveTemplate = async () => {
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
          userId
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
  
  // Dummy definition just in case to replace the old handleCreateTemplate block
  const oldHandleCreateTemplate = async () => {`
);

// Remove the old handleCreateTemplate (we just changed the signature to oldHandleCreateTemplate, let's remove it properly)
// Wait, replacing block is better done via regex or splitting. Let's do it cleaner.
