import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, TextIcon, ImageIcon, MicrophoneIcon, VideoIcon, CodeIcon } from './Icons';

type NodeCreatorType = 'text' | 'image' | 'audio' | 'video' | 'code';

interface CommandMenuProps {
    x: number;
    y: number;
    onSelect: (type: NodeCreatorType) => void;
    onClose: () => void;
}

const nodeOptions: { type: NodeCreatorType; label: string; icon: React.ReactNode }[] = [
    { type: 'text', label: 'Text', icon: <TextIcon className="w-5 h-5" /> },
    { type: 'image', label: 'Image', icon: <ImageIcon className="w-5 h-5" /> },
    { type: 'audio', label: 'Audio', icon: <MicrophoneIcon className="w-5 h-5" /> },
    { type: 'video', label: 'Video', icon: <VideoIcon className="w-5 h-5" /> },
    { type: 'code', label: 'Code', icon: <CodeIcon className="w-5 h-5" /> },
];

const CommandMenu: React.FC<CommandMenuProps> = ({ x, y, onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const filteredOptions = nodeOptions.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div
            ref={menuRef}
            className="fixed z-30 w-72 dark:bg-[#1e1e1e] bg-white border dark:border-zinc-700 border-zinc-200 rounded-lg shadow-2xl flex flex-col animate-fade-in-fast"
            style={{ top: y, left: x }}
        >
            <div className="p-2 border-b dark:border-zinc-700 border-zinc-200">
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full dark:bg-[#2d2d2d] bg-zinc-100 dark:border-zinc-600 border-zinc-300 border rounded-md py-1.5 pl-8 pr-2 dark:text-white text-black dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>
            <div className="p-2">
                <p className="text-xs dark:text-zinc-500 text-zinc-400 font-semibold px-2 mb-1">Add node</p>
                <ul>
                    {filteredOptions.length > 0 ? filteredOptions.map(option => (
                        <li key={option.type}>
                            <button
                                onClick={() => {
                                    onSelect(option.type);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 p-2 rounded-md dark:hover:bg-zinc-700 hover:bg-zinc-100 text-sm dark:text-zinc-200 text-zinc-800"
                            >
                                {option.icon}
                                <span>{option.label}</span>
                            </button>
                        </li>
                    )) : (
                        <p className="text-center text-xs dark:text-zinc-500 text-zinc-400 p-2">No matching nodes</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CommandMenu;
