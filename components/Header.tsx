import React, { useState, useRef, useEffect } from 'react';
import IconButton from './IconButton';
import { ArrowLeftIcon, ChevronUpDownIcon, SearchIcon, CheckIcon, PlusIcon, SunIcon, MoonIcon } from './Icons';
import type { Project } from '../types';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
    projectName: string;
    projects: Project[];
    activeProjectId: string;
    onGoBack?: () => void;
    onSelectProject: (projectId: string) => void;
    onCreateProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ projectName, projects, activeProjectId, onGoBack, onSelectProject, onCreateProject }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const handleCreateProject = () => {
        onCreateProject();
        setIsDropdownOpen(false);
    }

    const handleSelectProject = (id: string) => {
        onSelectProject(id);
        setIsDropdownOpen(false);
    }

    return (
        <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
                {onGoBack && (
                    <IconButton onClick={onGoBack} aria-label="Go back to projects">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </IconButton>
                )}
            </div>
            
            <div className="flex items-center gap-2 pointer-events-auto">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        className="flex items-center gap-2 dark:bg-[#2d2d2d] bg-white dark:border-zinc-700 border-zinc-300 border rounded-lg px-3 py-1.5 text-sm font-medium dark:text-zinc-200 text-zinc-800 dark:hover:bg-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                        <span className="max-w-48 truncate">{projectName}</span>
                        <ChevronUpDownIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 dark:bg-[#1e1e1e] bg-white dark:border-zinc-700 border-zinc-200 border rounded-lg shadow-2xl z-20 text-sm dark:text-zinc-300 text-zinc-800">
                            <div className="p-2">
                                <div className="relative">
                                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Search project..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full dark:bg-[#2d2d2d] bg-zinc-100 dark:border-zinc-600 border-zinc-300 border rounded-md py-1.5 pl-8 pr-2 dark:text-white text-black dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="px-2 pb-1">
                                <p className="text-xs dark:text-zinc-500 text-zinc-400 font-semibold px-2 mb-1">My Projects</p>
                                <ul className="max-h-48 overflow-y-auto">
                                    {filteredProjects.map(project => (
                                        <li key={project.id}>
                                            <button
                                                onClick={() => handleSelectProject(project.id)}
                                                className="w-full text-left flex items-center justify-between p-2 rounded-md dark:hover:bg-zinc-700 hover:bg-zinc-100"
                                            >
                                                <span className="truncate">{project.name}</span>
                                                {project.id === activeProjectId && <CheckIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="border-t dark:border-zinc-700 border-zinc-200 p-2">
                                <button
                                    onClick={handleCreateProject}
                                    className="w-full text-left flex items-center gap-2 p-2 rounded-md dark:hover:bg-zinc-700 hover:bg-zinc-100"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>Create new project</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <IconButton onClick={toggleTheme} aria-label="Toggle theme">
                    {theme === 'dark' ? (
                        <SunIcon className="w-5 h-5" />
                    ) : (
                        <MoonIcon className="w-5 h-5" />
                    )}
                </IconButton>
            </div>
        </header>
    );
};

export default Header;
