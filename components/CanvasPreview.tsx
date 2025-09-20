import React from 'react';
import type { Project, NodeType } from '../types';
import { TextIcon, ImageIcon, YouTubeIcon, LinkIcon, CodeIcon, SearchIcon, ScreenShareIcon } from './Icons';

const getNodeColor = (type: NodeType['type']) => {
    switch (type) {
        case 'text': return 'bg-gray-500';
        case 'image': return 'bg-purple-500';
        case 'youtube': return 'bg-red-500';
        case 'website': return 'bg-blue-500';
        case 'code': return 'bg-green-500';
        case 'search_result': return 'bg-yellow-500';
        case 'screen': return 'bg-cyan-500';
        default: return 'bg-zinc-600';
    }
}

const getNodeIcon = (type: NodeType['type']) => {
    const className = "w-1/3 h-1/3 text-white/50";
     switch (type) {
        case 'text': return <TextIcon className={className} />;
        case 'image': return <ImageIcon className={className} />;
        case 'youtube': return <YouTubeIcon className={className} />;
        case 'website': return <LinkIcon className={className} />;
        case 'code': return <CodeIcon className={className} />;
        case 'search_result': return <SearchIcon className={className} />;
        case 'screen': return <ScreenShareIcon className={className} />;
        default: return null;
    }
}

const CanvasPreview: React.FC<{ project: Project }> = ({ project }) => {
    const { nodes } = project;

    if (nodes.length === 0) {
        return (
            <div className="w-full h-full bg-zinc-800 rounded-lg flex items-center justify-center">
                <p className="text-zinc-500 text-sm">Empty Canvas</p>
            </div>
        );
    }
    
    // Calculate bounding box
    const padding = 50;
    const minX = Math.min(...nodes.map(n => n.x)) - padding;
    const minY = Math.min(...nodes.map(n => n.y)) - padding;
    const maxX = Math.max(...nodes.map(n => n.x + n.width)) + padding;
    const maxY = Math.max(...nodes.map(n => n.y + n.height)) + padding;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    return (
        <div className="w-full h-full bg-[#202020] rounded-lg overflow-hidden relative">
            <div
                className="relative w-full h-full"
            >
                {nodes.map(node => (
                    <div
                        key={node.id}
                        className={`absolute rounded-sm flex items-center justify-center ${getNodeColor(node.type)}`}
                        style={{
                            left: `${((node.x - minX) / contentWidth) * 100}%`,
                            top: `${((node.y - minY) / contentHeight) * 100}%`,
                            width: `${(node.width / contentWidth) * 100}%`,
                            height: `${(node.height / contentHeight) * 100}%`,
                        }}
                    >
                        {getNodeIcon(node.type)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CanvasPreview;