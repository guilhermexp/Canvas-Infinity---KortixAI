import React, { useState, useCallback } from 'react';
import { useProjects } from './hooks/useProjects';
import ProjectDashboard from './components/ProjectDashboard';
import CanvasView from './components/CanvasView';
import type { Project } from './types';

const App: React.FC = () => {
    const { projects, addProject, updateProject } = useProjects();
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    const handleCreateProject = useCallback(() => {
        const newProject = addProject();
        setActiveProjectId(newProject.id);
    }, [addProject]);

    const handleSelectProject = useCallback((projectId: string) => {
        setActiveProjectId(projectId);
    }, []);

    const handleUpdateProject = useCallback((projectId: string, updates: Partial<Omit<Project, 'id'>> | ((project: Project) => Partial<Omit<Project, 'id'>>)) => {
        updateProject(projectId, updates);
    }, [updateProject]);
    
    const handleGoToDashboard = useCallback(() => {
        setActiveProjectId(null);
    }, []);

    const activeProject = projects.find(p => p.id === activeProjectId);

    const onUpdateActiveProject = useCallback((updates: Partial<Omit<Project, 'id' | 'name'>> | ((project: Project) => Partial<Omit<Project, 'id' | 'name'>>)) => {
        if (activeProject) {
            handleUpdateProject(activeProject.id, updates);
        }
    }, [activeProject, handleUpdateProject]);

    if (!activeProject) {
        return (
            <ProjectDashboard 
                projects={projects}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
            />
        );
    }

    return (
        <CanvasView 
            key={activeProject.id}
            project={activeProject}
            projects={projects}
            onUpdateProject={onUpdateActiveProject}
            onGoBack={handleGoToDashboard}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
        />
    );
};

export default App;
