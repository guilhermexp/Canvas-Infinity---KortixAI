import React, { useEffect, useRef } from 'react';

export interface ContextMenuAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isDestructive?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    actions: ContextMenuAction[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

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

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-48 dark:bg-[#1e1e1e] bg-white border dark:border-zinc-700 border-zinc-200 rounded-lg shadow-2xl p-1.5 text-sm animate-fade-in-fast"
            style={{ top: y, left: x }}
        >
            <ul>
                {actions.map((action, index) => (
                    <li key={index}>
                        <button
                            onClick={() => {
                                action.onClick();
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 text-left p-2 rounded-md transition-colors duration-150 ${
                                action.isDestructive
                                    ? 'dark:text-red-400 text-red-500 dark:hover:bg-red-500/10 hover:bg-red-500/10'
                                    : 'dark:text-zinc-300 text-zinc-800 dark:hover:bg-zinc-700 hover:bg-zinc-100'
                            }`}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                        </button>
                        {index === 1 && <hr className="my-1 dark:border-zinc-700 border-zinc-200" />}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ContextMenu;