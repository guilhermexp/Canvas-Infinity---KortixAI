import React from 'react';
import IconButton from './IconButton';
import { PlusIcon, MinusIcon, FitToScreenIcon } from './Icons';
import { useTheme } from '../hooks/useTheme';

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onAutoLayout: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut, onReset, onAutoLayout }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="absolute bottom-6 right-6 flex items-center dark:bg-[#1A1A1A] bg-white/80 backdrop-blur-sm border dark:border-zinc-700 border-zinc-200 rounded-lg p-0.5 text-sm font-medium">
            <IconButton onClick={onZoomOut} className="!p-1.5" aria-label="Zoom out">
                <MinusIcon className="w-5 h-5" />
            </IconButton>
            <button onClick={onReset} className="px-3 dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-black transition-colors w-16">
                {Math.round(scale * 100)}%
            </button>
            <IconButton onClick={onZoomIn} className="!p-1.5" aria-label="Zoom in">
                <PlusIcon className="w-5 h-5" />
            </IconButton>
            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-0.5"></div>
            <IconButton onClick={onAutoLayout} className="!p-1.5" aria-label="Auto-layout canvas">
                <FitToScreenIcon className="w-5 h-5" />
            </IconButton>
        </div>
    );
};

export default ZoomControls;