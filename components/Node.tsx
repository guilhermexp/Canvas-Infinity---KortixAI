import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NodeType } from '../types';
import { TrashIcon, LinkIcon, YouTubeIcon, CodeIcon, TextIcon, VideoIcon, MicrophoneIcon, ScreenShareIcon, SparklesIcon } from './Icons';

interface NodeProps {
    node: NodeType;
    onDrag: (id: string, x: number, y: number) => void;
    onDelete: (id: string) => void;
    onResize: (id: string, width: number, height: number) => void;
    onContentChange: (id: string, content: any) => void;
    onMention: (node: NodeType) => void;
    onExpand: (nodeId: string) => void;
    scale: number;
    onSelect: (id: string) => void;
    isSelected: boolean;
    isPreview?: boolean;
    registerVideoRef?: (id: string, element: HTMLVideoElement | null) => void;
    onContextMenu: (event: React.MouseEvent, nodeId: string) => void;
    onLinkStart: (nodeId: string, handle: 'right' | 'left', event: React.MouseEvent) => void;
    onLinkEnd: (nodeId: string, handle: 'right' | 'left', event: React.MouseEvent) => void;
}

const NodeHeader: React.FC<{
    node: NodeType;
    onDelete: () => void;
    onMention: () => void;
    onExpand: (nodeId: string) => void;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    isPreview?: boolean;
}> = ({ node, onDelete, onMention, onExpand, onMouseDown, isPreview }) => {
    const getIcon = () => {
        const className = "w-3.5 h-3.5 mr-1.5 dark:text-zinc-500 text-zinc-400";
        switch(node.type) {
            case 'youtube': return <YouTubeIcon className={className} />;
            case 'website': return <LinkIcon className={className} />;
            case 'code': return <CodeIcon className={className} />;
            case 'text': return <TextIcon className={className} />;
            case 'video': return <VideoIcon className={className} />;
            case 'audio': return <MicrophoneIcon className={className} />;
            case 'screen': return <ScreenShareIcon className={className} />;
            default: return null;
        }
    };
    
    return (
        <div 
            onMouseDown={onMouseDown}
            className={`h-8 flex items-center justify-between px-2 border-b dark:border-zinc-700 border-zinc-200 ${!isPreview ? 'cursor-move' : ''}`}
        >
            <div className="flex items-center">
                {getIcon()}
                <span className="text-xs font-medium dark:text-zinc-400 text-zinc-600 truncate capitalize">{node.type}</span>
            </div>
            {!isPreview && (
                <div className="flex items-center gap-1">
                    {node.type === 'text' && (
                         <button onClick={() => onExpand(node.id)} className="p-1 rounded dark:hover:bg-zinc-700 hover:bg-zinc-200 text-zinc-400 hover:text-blue-400" title="Expand with AI">
                            <SparklesIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button onClick={onMention} className="p-1 rounded dark:hover:bg-zinc-700 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-100" title="Reference in Chat">
                        <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onDelete} className="p-1 rounded dark:hover:bg-zinc-700 hover:bg-zinc-200 text-zinc-400 hover:text-red-400" title="Delete Node">
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

const MediaStreamNode: React.FC<{ 
    isPreview?: boolean;
    nodeId: string;
    mediaType: 'camera' | 'screen';
    registerVideoRef?: (id: string, element: HTMLVideoElement | null) => void;
}> = ({ isPreview, nodeId, mediaType, registerVideoRef }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (registerVideoRef && videoRef.current) {
            registerVideoRef(nodeId, videoRef.current);
        }
        return () => {
            if (registerVideoRef) {
                registerVideoRef(nodeId, null);
            }
        };
    }, [nodeId, registerVideoRef]);

    useEffect(() => {
        if (isPreview) return;

        let stream: MediaStream;
        const startStream = async () => {
            try {
                if (mediaType === 'camera') {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } else {
                    stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error(`Error accessing ${mediaType}:`, err);
                setError(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} access denied. Please enable permissions.`);
            }
        };

        startStream();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isPreview, mediaType]);
    
    if (error) {
        return <div className="w-full h-full flex items-center justify-center text-center text-xs text-red-400 p-2">{error}</div>
    }

    return (
        <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover bg-black" 
        />
    );
};

const CodeNodeContent: React.FC<{ node: NodeType; onContentChange: (content: any) => void, isPreview?: boolean }> = ({ node, onContentChange, isPreview }) => {
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

    const stopWheelPropagation = (e: React.WheelEvent) => {
        e.stopPropagation();
    };

    const handleContentUpdate = (value: any) => {
        if (!isPreview) {
            onContentChange(value);
        }
    }

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            <div className="flex-shrink-0 flex items-center border-b dark:border-zinc-700 border-zinc-200">
                <button 
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === 'code' ? 'dark:bg-zinc-700 bg-zinc-200 dark:text-white text-black' : 'dark:text-zinc-400 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100'}`}
                >
                    Code
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === 'preview' ? 'dark:bg-zinc-700 bg-zinc-200 dark:text-white text-black' : 'dark:text-zinc-400 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100'}`}
                >
                    Preview
                </button>
            </div>
            <div className="flex-grow w-full h-full relative overflow-hidden">
                {activeTab === 'code' ? (
                    <textarea
                        onWheel={stopWheelPropagation}
                        value={node.content}
                        onChange={(e) => handleContentUpdate(e.target.value)}
                        className="w-full h-full p-2 bg-transparent resize-none focus:outline-none dark:text-zinc-200 text-zinc-800 font-mono text-xs"
                        placeholder="// Start coding..."
                        readOnly={isPreview}
                        spellCheck={false}
                    />
                ) : (
                    <iframe
                        srcDoc={node.content}
                        className="w-full h-full bg-white"
                        sandbox="allow-scripts allow-same-origin"
                        style={{ pointerEvents: isPreview ? 'none' : 'auto' }}
                        title="Code Preview"
                    />
                )}
            </div>
        </div>
    );
};

const NodeContent: React.FC<{ node: NodeType; onContentChange: (content: any) => void, isPreview?: boolean, registerVideoRef?: (id: string, element: HTMLVideoElement | null) => void; }> = ({ node, onContentChange, isPreview, registerVideoRef }) => {
    const handleContentUpdate = (value: any) => {
        if (!isPreview) {
            onContentChange(value);
        }
    }
    
    // Stop wheel events from propagating to the canvas, so we can scroll inside nodes.
    const stopWheelPropagation = (e: React.WheelEvent) => {
        e.stopPropagation();
    };

    switch (node.type) {
        case 'text':
            return <textarea
                onWheel={stopWheelPropagation}
                value={node.content}
                onChange={(e) => handleContentUpdate(e.target.value)}
                className="w-full h-full p-2 bg-transparent resize-none focus:outline-none dark:text-zinc-200 text-zinc-800 text-sm"
                placeholder="Start typing..."
                readOnly={isPreview}
            />;
        case 'image':
            return <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${node.content.url})` }} />;
        case 'youtube':
            return (
                <div onWheel={stopWheelPropagation} className="w-full h-full flex flex-col dark:bg-zinc-900 bg-zinc-100 overflow-y-auto">
                    <div className="p-3 flex-shrink-0 border-b dark:border-zinc-700 border-zinc-200">
                        <p className="font-semibold truncate dark:text-zinc-100 text-zinc-900 text-sm">{node.content?.title || 'YouTube Video'}</p>
                        <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-1 max-h-10 overflow-hidden">{node.content?.summary}</p>
                    </div>
                    <div className="flex-grow w-full h-full bg-black">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${node.content.videoId}`}
                            title={node.content?.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ pointerEvents: isPreview ? 'none' : 'auto' }}
                        ></iframe>
                    </div>
                </div>
            );
        case 'website':
            return (
                <div onWheel={stopWheelPropagation} className="w-full h-full flex flex-col dark:bg-zinc-900 bg-zinc-100">
                    <div className="p-2 flex-shrink-0 border-b dark:border-zinc-700 border-zinc-200">
                        <p className="font-semibold truncate dark:text-zinc-100 text-zinc-900 text-sm">{node.content?.title || 'Website'}</p>
                        <p className="text-xs text-zinc-500 mt-1">Note: Some sites may not load due to security policies.</p>
                    </div>
                    <div className="flex-grow w-full h-full bg-white">
                        <iframe
                            src={node.content.url}
                            title={node.content?.title}
                            className="w-full h-full"
                            style={{ pointerEvents: isPreview ? 'none' : 'auto' }}
                            sandbox="allow-scripts allow-same-origin allow-forms"
                        ></iframe>
                    </div>
                </div>
            );
        case 'code':
            return <CodeNodeContent node={node} onContentChange={handleContentUpdate} isPreview={isPreview} />;
        case 'video':
            return <MediaStreamNode mediaType="camera" isPreview={isPreview} nodeId={node.id} registerVideoRef={registerVideoRef} />;
        case 'screen':
            return <MediaStreamNode mediaType="screen" isPreview={isPreview} nodeId={node.id} registerVideoRef={registerVideoRef} />;
        case 'audio':
            return <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-sm dark:text-zinc-400 text-zinc-600">
                <MicrophoneIcon className="w-8 h-8"/>
                <p>Audio Node</p>
            </div>;
        case 'loading':
            return <div className="w-full h-full flex items-center justify-center text-sm dark:text-zinc-400 text-zinc-600 animate-pulse">{node.content}</div>;
        default:
            return <div className="p-2 text-sm text-red-500">Unknown node type: {node.type}</div>
    }
};

const NodeComponent: React.FC<NodeProps> = ({ node, onDrag, onDelete, onResize, onContentChange, onMention, onExpand, scale, onSelect, isSelected, isPreview, registerVideoRef, onContextMenu, onLinkStart, onLinkEnd }) => {
    const isDraggableRef = useRef(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const nodeStartPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isPreview || e.button !== 0) return;

        e.stopPropagation();
        isDraggableRef.current = true;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        nodeStartPos.current = { x: node.x, y: node.y };
        onSelect(node.id);
    }, [isPreview, node.x, node.y, onSelect, node.id]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggableRef.current) return;

            const dx = (e.clientX - dragStartPos.current.x) / scale;
            const dy = (e.clientY - dragStartPos.current.y) / scale;
            onDrag(node.id, nodeStartPos.current.x + dx, nodeStartPos.current.y + dy);
        };

        const handleMouseUp = () => {
            isDraggableRef.current = false;
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onDrag, node.id, scale]);
    
    const isResizingRef = useRef(false);
    const resizeStartSize = useRef({ width: 0, height: 0 });
    const resizeStartPos = useRef({ x: 0, y: 0 });

    const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isPreview) return;
        e.stopPropagation();
        isResizingRef.current = true;
        resizeStartSize.current = { width: node.width, height: node.height };
        resizeStartPos.current = { x: e.clientX, y: e.clientY };
    }, [isPreview, node.width, node.height]);
    
    useEffect(() => {
        const handleResizeMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const dx = (e.clientX - resizeStartPos.current.x) / scale;
            const dy = (e.clientY - resizeStartPos.current.y) / scale;
            const newWidth = Math.max(200, resizeStartSize.current.width + dx);
            const newHeight = Math.max(100, resizeStartSize.current.height + dy);
            onResize(node.id, newWidth, newHeight);
        };
        
        const handleResizeMouseUp = () => {
            isResizingRef.current = false;
        };
        
        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
        
        return () => {
            document.removeEventListener('mousemove', handleResizeMouseMove);
            document.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [onResize, node.id, scale]);

    const handleMouseDownOnHandle = (e: React.MouseEvent, handle: 'right' | 'left') => {
        e.stopPropagation();
        onLinkStart(node.id, handle, e);
    }
    
    const handleMouseUpOnHandle = (e: React.MouseEvent, handle: 'right' | 'left') => {
        e.stopPropagation();
        onLinkEnd(node.id, handle, e);
    }

    return (
        <div
            className={`draggable-node absolute dark:bg-[#1A1A1A] bg-white border rounded-lg shadow-lg flex flex-col transition-shadow duration-200 ${isSelected && !isPreview ? 'ring-2 ring-blue-500 z-10' : 'dark:border-zinc-700 border-zinc-300'}`}
            style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
            }}
            onMouseDown={() => !isPreview && onSelect(node.id)}
            onContextMenu={(e) => !isPreview && onContextMenu(e, node.id)}
        >
            {!isPreview && (
                <>
                    {/* Left handle (input) */}
                    <div
                        className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 dark:bg-zinc-600 bg-zinc-300 border-2 dark:border-zinc-800 border-white rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 z-20"
                        onMouseUp={(e) => handleMouseUpOnHandle(e, 'left')}
                    />
                    {/* Right handle (output) */}
                    <div
                        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 dark:bg-zinc-600 bg-zinc-300 border-2 dark:border-zinc-800 border-white rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 z-20"
                        onMouseDown={(e) => handleMouseDownOnHandle(e, 'right')}
                    />
                </>
            )}
            <NodeHeader
                node={node}
                onDelete={() => onDelete(node.id)}
                onMention={() => onMention(node)}
                onExpand={onExpand}
                onMouseDown={handleMouseDown}
                isPreview={isPreview}
            />
            <div className="flex-grow w-full h-full overflow-hidden rounded-b-lg">
                <NodeContent node={node} onContentChange={(content) => onContentChange(node.id, content)} isPreview={isPreview} registerVideoRef={registerVideoRef} />
            </div>
            {!isPreview && (
                <div
                    onMouseDown={handleResizeMouseDown}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
                />
            )}
        </div>
    );
};

export default NodeComponent;