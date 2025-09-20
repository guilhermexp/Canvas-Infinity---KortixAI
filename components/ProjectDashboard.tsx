import React, { useState } from 'react';
import type { Project } from '../types';
import CanvasPreview from './CanvasPreview';
import { formatTimeAgo } from '../utils';

interface ProjectDashboardProps {
    projects: Project[];
    onSelectProject: (projectId: string) => void;
    onCreateProject: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projects, onSelectProject, onCreateProject }) => {
    const sortedProjects = projects.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    const [previewProject, setPreviewProject] = useState<Project | null>(sortedProjects.length > 0 ? sortedProjects[0] : null);

    const handleProjectClick = (project: Project) => {
        if (previewProject?.id === project.id) {
            onSelectProject(project.id);
        } else {
            setPreviewProject(project);
        }
    };
    
    return (
        <div className="dark:bg-black bg-zinc-50 h-screen dark:text-white text-black font-sans flex">
            <aside className="w-full max-w-xs h-full dark:bg-[#1e1e1e] bg-white border-r dark:border-zinc-800 border-zinc-200 flex flex-col p-4">
                <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold">Welcome to Tersa!</h1>
                    <p className="dark:text-zinc-400 text-zinc-600 mt-2 text-sm">
                        Tersa is a platform for creating and sharing AI-powered projects. Let's get started by creating a flow, together.
                    </p>
                </div>

                <div className="flex-grow my-6 overflow-y-auto pr-2 space-y-2">
                    {sortedProjects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => handleProjectClick(project)}
                            className={`p-3 rounded-lg cursor-pointer border transition-colors ${previewProject?.id === project.id ? 'bg-green-500/10 border-green-500' : 'dark:bg-zinc-800/50 bg-zinc-100 dark:border-zinc-700 border-zinc-200 dark:hover:border-zinc-500 hover:border-zinc-400'}`}
                        >
                            <h2 className="font-semibold truncate">{project.name}</h2>
                            <p className="text-sm dark:text-zinc-400 text-zinc-500">{formatTimeAgo(project.updatedAt)}</p>
                        </div>
                    ))}
                </div>
                
                <div className="flex-shrink-0 space-y-2">
                    <button
                        onClick={onCreateProject}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition-colors text-center"
                    >
                        Create new project
                    </button>
                     <button
                        className="w-full dark:bg-[#2d2d2d] bg-zinc-200 dark:hover:bg-[#3a3a3a] hover:bg-zinc-300 dark:text-zinc-300 text-zinc-800 font-semibold py-2 rounded-lg border dark:border-zinc-700 border-zinc-300 transition-colors text-center"
                    >
                        Settings
                    </button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col p-6">
                <div className="flex-shrink-0 mb-4">
                    <h2 className="text-xl font-bold">Canvas Preview</h2>
                    <p className="dark:text-zinc-400 text-zinc-600 text-sm">Experiment with the default flow and add new nodes when you're ready.</p>
                </div>

                <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex-grow dark:bg-[#111] bg-zinc-100 border border-dashed dark:border-zinc-800 border-zinc-300 rounded-xl overflow-hidden relative min-h-0">
                        {previewProject ? (
                            <CanvasPreview
                                key={previewProject.id}
                                project={previewProject}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-zinc-500">Create a project to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProjectDashboard;