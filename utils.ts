export const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "Updated just now";
    if (minutes < 60) return `Updated ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `Updated ${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
};

import type { NodeType } from './types';

export const layoutMindMapChildren = ({
    parentNode,
    grandparent,
    children,
}: {
    parentNode: NodeType;
    grandparent?: NodeType | null;
    children: (NodeType | Omit<NodeType, 'x' | 'y'>)[];
}): { id: string; x: number; y: number }[] => {
    if (children.length === 0) return [];

    const parentCenter = {
        x: parentNode.x + parentNode.width / 2,
        y: parentNode.y + parentNode.height / 2,
    };

    let startAngle = -Math.PI / 2;
    let angleRange = Math.PI * 2;

    if (grandparent) {
        const grandparentCenter = {
            x: grandparent.x + grandparent.width / 2,
            y: grandparent.y + grandparent.height / 2,
        };
        const angleFromGrandparent = Math.atan2(
            parentCenter.y - grandparentCenter.y,
            parentCenter.x - grandparentCenter.x
        );
        startAngle = angleFromGrandparent - Math.PI / 2;
        angleRange = Math.PI;
    }

    const totalChildren = children.length;
    const angleStep = totalChildren > 1 ? angleRange / (angleRange === Math.PI * 2 ? totalChildren : totalChildren - 1) : 0;
    
    const maxChildWidth = children.reduce((max, c) => Math.max(max, c.width), 0);
    const maxChildHeight = children.reduce((max, c) => Math.max(max, c.height), 0);
    const radius = Math.max(parentNode.width, parentNode.height) / 2 + Math.max(maxChildWidth, maxChildHeight) / 2 + 80;

    return children.map((child, i) => {
        const angle = startAngle + i * angleStep;
        const x = parentCenter.x + radius * Math.cos(angle) - child.width / 2;
        const y = parentCenter.y + radius * Math.sin(angle) - child.height / 2;
        return { id: child.id, x, y };
    });
};