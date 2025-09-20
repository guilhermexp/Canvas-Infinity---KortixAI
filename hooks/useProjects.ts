import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types';
import { generateId } from '../utils';

const STORAGE_KEY = 'infinite-canvas-projects';

const getDefaultProject = (): Project => ({
  id: generateId('proj'),
  name: 'Untitled Project',
  updatedAt: new Date().toISOString(),
  nodes: [],
  chatHistory: [],
  edges: [],
});

export const useProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    
    useEffect(() => {
        try {
            const savedProjects = localStorage.getItem(STORAGE_KEY);
            if (savedProjects && JSON.parse(savedProjects).length > 0) {
                setProjects(JSON.parse(savedProjects));
            } else {
                // Start with one default project if none exist
                setProjects([getDefaultProject()]);
            }
        } catch (error) {
            console.error("Failed to load projects from localStorage", error);
            setProjects([getDefaultProject()]);
        }
    }, []);

    useEffect(() => {
        if (projects.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            } catch (error) {
                console.error("Failed to save projects to localStorage", error);
            }
        }
    }, [projects]);
    
    const addProject = useCallback((): Project => {
        const newProject: Project = {
            id: generateId('proj'),
            name: 'Untitled Project', // Default name
            updatedAt: new Date().toISOString(),
            nodes: [],
            chatHistory: [],
            edges: [],
        };

        const existingNames = new Set(projects.map(p => p.name));
        if (existingNames.has(newProject.name)) {
            let counter = 2;
            let nextName = `${newProject.name} ${counter}`;
            while(existingNames.has(nextName)) {
                counter++;
                nextName = `${newProject.name} ${counter}`;
            }
            newProject.name = nextName;
        }

        setProjects(prev => [...prev, newProject]);
        return newProject;
    }, [projects]);

    const updateProject = useCallback((projectId: string, updater: Partial<Omit<Project, 'id'>> | ((project: Project) => Partial<Omit<Project, 'id'>>)) => {
        setProjects(prevProjects =>
            prevProjects.map(p => {
                if (p.id === projectId) {
                    const updates = typeof updater === 'function' ? updater(p) : updater;
                    return { ...p, ...updates, updatedAt: new Date().toISOString() };
                }
                return p;
            })
        );
    }, []);
    
    return { projects, addProject, updateProject };
};
