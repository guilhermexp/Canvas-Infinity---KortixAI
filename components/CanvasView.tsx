import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Project, NodeType, ChatMessage, Edge } from '../types';
import { useInfiniteCanvas } from '../hooks/useInfiniteCanvas';
import { generateId, layoutMindMapChildren } from '../utils';
import { ai, geminiFlashModel, systemInstruction, tools, generateHtmlComponent } from '../services/ai';
import { processYouTubeUrl, processWebsiteUrl } from '../services/tools';
import type { GenerateContentResponse, Content, Part, FunctionCall, FunctionResponse } from '@google/genai';
import { useTheme } from '../hooks/useTheme';

import Header from './Header';
import Sidebar, { SidebarHandle } from './Sidebar';
import BottomToolbar from './BottomToolbar';
import ZoomControls from './ZoomControls';
import NodeComponent from './Node';
import UrlInputModal from './Toolbar';
import ContextMenu, { ContextMenuAction } from './ContextMenu';
import CommandMenu from './CommandMenu';
import { TrashIcon, LinkIcon, CopyIcon } from './Icons';


interface CanvasViewProps {
    project: Project;
    projects: Project[];
    onUpdateProject: (updates: Partial<Omit<Project, 'id' | 'name'>> | ((project: Project) => Partial<Omit<Project, 'id' | 'name'>>)) => void;
    onGoBack: () => void;
    onSelectProject: (projectId: string) => void;
    onCreateProject: () => void;
}

const chatHistoryToContents = (history: ChatMessage[]): Content[] => {
    return history.flatMap((message): Content[] => {
        if (message.role === 'user') {
            const parts: Part[] = [];
            if (message.text) parts.push({ text: message.text });
            if (message.image) parts.push({ inlineData: { mimeType: message.image.mimeType, data: message.image.data } });
            if (message.reference) {
                const refText = `The user is referencing a "${message.reference.type}" node on the canvas. Node content summary: ${JSON.stringify(message.reference.content).substring(0, 200)}`;
                parts.push({ text: refText });
            }
            if (parts.length === 0) return [];
            return [{ role: 'user', parts }];
        }
        if (message.role === 'model') {
            // NOTE: The current `ChatMessage` type only stores the text part of a model's response.
            // This is sufficient for text responses but doesn't capture function calls for history reconstruction.
            // The current logic handles this by building the `contents` array manually during the multi-turn function call flow.
            return [{ role: 'model', parts: [{ text: message.text }] }];
        }
        return [];
    });
};

const CanvasView: React.FC<CanvasViewProps> = ({
    project,
    projects,
    onUpdateProject,
    onGoBack,
    onSelectProject,
    onCreateProject,
}) => {
    const { viewState, containerRef, handleWheel, handleCanvasMouseDown, handleCanvasMouseMove: handleCanvasPanMove, handleCanvasMouseUp: handleCanvasPanUp, zoomIn, zoomOut, setViewState } = useInfiniteCanvas();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string } | null>(null);
    const [referencedNode, setReferencedNode] = useState<NodeType | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isSpacePanning, setIsSpacePanning] = useState(false);
    const sidebarRef = useRef<SidebarHandle>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
    const [commandMenu, setCommandMenu] = useState<{ x: number, y: number } | null>(null);
    const [linkingState, setLinkingState] = useState<{ fromNode: string; fromHandle: 'right' | 'left'; tempEndPoint: { x: number; y: number } } | null>(null);
    const { theme } = useTheme();

    const { nodes, edges, chatHistory } = project;

    const updateNodes = (updater: (nodes: NodeType[]) => NodeType[]) => {
        onUpdateProject(p => ({ nodes: updater(p.nodes) }));
    };

    const updateEdges = (updater: (edges: Edge[]) => Edge[]) => {
        onUpdateProject(p => ({ edges: updater(p.edges) }));
    };

    const addNode = useCallback((newNode: Omit<NodeType, 'id'>, parentNodeId?: string): NodeType => {
        const id = generateId('node');
        let finalNode: NodeType = { ...newNode, id };

        if (parentNodeId) {
            const parentNode = nodes.find(n => n.id === parentNodeId);
            if (parentNode) {
                const newEdge: Edge = { id: generateId('edge'), from: parentNode.id, to: finalNode.id };
                updateEdges(currentEdges => [...currentEdges, newEdge]);
                const children = [...edges.filter(e => e.from === parentNode.id).map(e => nodes.find(n => n.id === e.to)).filter(Boolean) as NodeType[], finalNode];
                const grandparent = edges.find(e => e.to === parentNodeId)?.from;
                const grandparentNode = grandparent ? nodes.find(n => n.id === grandparent) : null;
                
                const newPositions = layoutMindMapChildren({ parentNode, grandparent: grandparentNode, children });
                newPositions.forEach(p => {
                    if (p.id === finalNode.id) {
                        finalNode.x = p.x;
                        finalNode.y = p.y;
                    } else {
                        updateNodes(currentNodes => currentNodes.map(n => n.id === p.id ? { ...n, x: p.x, y: p.y } : n));
                    }
                });
            }
        } else {
             if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                finalNode.x = (rect.width / 2 - finalNode.width / 2 - viewState.x) / viewState.scale;
                finalNode.y = (rect.height / 2 - finalNode.height / 2 - viewState.y) / viewState.scale;
            }
        }

        updateNodes(currentNodes => [...currentNodes, finalNode]);
        return finalNode;
    }, [nodes, edges, viewState, onUpdateProject, updateEdges]);
    
    const handleAddNode = (type: NodeType['type'], content: any = '', size = { width: 300, height: 200 }) => {
        const defaults: { [key in NodeType['type']]?: Partial<NodeType> } = {
            'text': { width: 250, height: 120 },
            'code': { width: 450, height: 300, content: '// Start coding...' },
            'youtube': { width: 320, height: 350 },
            'website': { width: 400, height: 300 },
            'video': { width: 320, height: 240 },
            'screen': { width: 480, height: 270 },
        };
        const nodeProps = { ...size, ...defaults[type], type, content, x:0, y:0 };
        const newNode = addNode(nodeProps);
        setSelectedNodeId(newNode.id);
    }
    
    const handleNodeDrag = useCallback((id: string, x: number, y: number) => {
        updateNodes(nodes => nodes.map(n => n.id === id ? { ...n, x, y } : n));
    }, [onUpdateProject]);

    const handleNodeDelete = useCallback((id: string) => {
        updateNodes(nodes => nodes.filter(n => n.id !== id));
        updateEdges(edges => edges.filter(e => e.from !== id && e.to !== id));
    }, [onUpdateProject]);

    const handleNodeResize = useCallback((id: string, width: number, height: number) => {
        updateNodes(nodes => nodes.map(n => n.id === id ? { ...n, width, height } : n));
    }, [onUpdateProject]);

    const handleContentChange = useCallback((id: string, content: any) => {
        updateNodes(nodes => nodes.map(n => n.id === id ? { ...n, content } : n));
    }, [onUpdateProject]);

    const handleNodeMention = useCallback((node: NodeType) => {
        setReferencedNode(node);
        setIsSidebarOpen(true);
        sidebarRef.current?.focusInput();
    }, []);
    
    const processModelResponse = async (response: GenerateContentResponse, currentContents: Content[], initialParentNodeId?: string) => {
        let modelResponseText = '';
        const functionCalls: FunctionCall[] = [];
        let parentId = initialParentNodeId;

        response.candidates?.[0]?.content?.parts?.forEach(part => {
            if (part.text) {
                modelResponseText += part.text;
            } else if (part.functionCall) {
                functionCalls.push(part.functionCall);
            }
        });

        if (functionCalls.length > 0) {
            const functionResponses: FunctionResponse[] = [];
            
            for (const call of functionCalls) {
                const { name, args } = call;
                let functionResult: any = { error: 'Unknown function' };

                if (name === 'createNode') {
                    const { content, parentNodeId, nodeType } = args as { content: string, parentNodeId?: string, nodeType?: 'text' | 'code' };
                    const node = addNode({
                        type: nodeType || 'text',
                        content,
                        x: 0, y: 0,
                        width: 250, height: 100,
                    }, parentNodeId || parentId);
                    
                    if (!parentId) parentId = node.id;
                    functionResult = { nodeId: node.id };
                } else if (name === 'createCodeComponentNode') {
                    const { prompt, parentNodeId } = args as { prompt: string, parentNodeId?: string };
                    const loadingNode = addNode({
                        type: 'loading',
                        content: 'Generating component...',
                        x: 0, y: 0, width: 300, height: 200
                    }, parentNodeId || parentId);
                    if(!parentId) parentId = loadingNode.id;

                    const html = await generateHtmlComponent(prompt);
                    updateNodes(n => n.map(node => node.id === loadingNode.id ? {...node, type: 'code', content: html, width: 450, height: 300} : node));
                    functionResult = { nodeId: loadingNode.id, status: 'completed' };
                }
                
                functionResponses.push({
                    name,
                    response: functionResult
                });
            }
            
            const modelTurn: Content = { role: 'model', parts: response.candidates![0].content.parts };
            const functionTurn: Content = { role: 'function', parts: functionResponses.map(fr => ({ functionResponse: fr })) };

            const nextContents = [
                ...currentContents,
                modelTurn,
                functionTurn,
            ];

            const toolResponseResult = await ai.models.generateContent({
                model: geminiFlashModel,
                contents: nextContents,
                config: {
                    systemInstruction,
                    tools,
                },
            });
            await processModelResponse(toolResponseResult, nextContents, initialParentNodeId);
        } else if (modelResponseText.trim()) {
            const tokenCount = response.usageMetadata?.totalTokenCount;
             onUpdateProject(p => ({
                chatHistory: [...p.chatHistory, { 
                    role: 'model', 
                    text: modelResponseText, 
                    model: geminiFlashModel,
                    tokenCount: tokenCount 
                }]
            }));
        }
    }

    const handleNodeExpand = useCallback(async (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.type !== 'text' || !node.content) return;
        
        setIsProcessing(true);
        const prompt = `Based on the following text, create a mind map with a few related concepts. The root node should be the original text.\n\nOriginal text: "${node.content}"`;
        
        const expandUserMessage: ChatMessage = { role: 'user', text: `(Expanding node) ${prompt}` };
        onUpdateProject(p => ({
            chatHistory: [...p.chatHistory, expandUserMessage]
        }));
        
        const fullHistoryForApi = [...project.chatHistory, expandUserMessage];
        const contents = chatHistoryToContents(fullHistoryForApi);

        try {
            const result = await ai.models.generateContent({
                model: geminiFlashModel,
                contents: contents,
                config: {
                    systemInstruction,
                    tools,
                },
            });
            await processModelResponse(result, contents, nodeId);
        } catch (error) {
            console.error("Error expanding node:", error);
            onUpdateProject(p => ({
                chatHistory: [...p.chatHistory, { role: 'model', text: 'Sorry, I encountered an error while trying to expand on that.'}]
            }));
        } finally {
            setIsProcessing(false);
        }
    }, [nodes, onUpdateProject, addNode, project.chatHistory]);

    const handleSendMessage = useCallback(async (userPrompt: string, image?: { data: string; mimeType: string }, reference?: NodeType) => {
        setIsProcessing(true);
        setPrompt('');
        setAttachedImage(null);
        setReferencedNode(null);

        const newUserMessage: ChatMessage = { role: 'user', text: userPrompt, image, reference };
        onUpdateProject(p => ({
            chatHistory: [...p.chatHistory, newUserMessage]
        }));

        const fullHistoryForApi = [...project.chatHistory, newUserMessage];
        const contents = chatHistoryToContents(fullHistoryForApi);

        try {
            const response = await ai.models.generateContent({
                model: geminiFlashModel,
                contents: contents,
                config: {
                    systemInstruction: systemInstruction,
                    tools: tools,
                }
            });
            await processModelResponse(response, contents);
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            onUpdateProject(p => ({
                chatHistory: [...p.chatHistory, { role: 'model', text: 'Sorry, I encountered an error.' }]
            }));
        } finally {
            setIsProcessing(false);
        }
    }, [project.chatHistory, onUpdateProject, addNode]);
    
    const handleUrlSubmit = async (url: string) => {
        setIsUrlModalOpen(false);
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (youtubeRegex.test(url)) {
            const videoData = await processYouTubeUrl(url);
            if (videoData) handleAddNode('youtube', videoData);
        } else {
            const siteData = await processWebsiteUrl(url);
            if (siteData) handleAddNode('website', siteData);
        }
    };
    
    const handleSelectNode = (id: string) => setSelectedNodeId(id);

    const handleClearCanvas = () => {
        onUpdateProject({ nodes: [], edges: [] });
    };

    const handleContextMenu = (event: React.MouseEvent, nodeId: string) => {
        event.preventDefault();
        setSelectedNodeId(nodeId);
        setContextMenu({ x: event.clientX, y: event.clientY, nodeId });
    };

    const handleCloseContextMenu = () => setContextMenu(null);

    const contextMenuActions: ContextMenuAction[] = useMemo(() => {
        if (!contextMenu) return [];
        const node = nodes.find(n => n.id === contextMenu.nodeId);
        return [
            { label: 'Reference in Chat', icon: <LinkIcon className="w-4 h-4" />, onClick: () => node && handleNodeMention(node) },
            { label: 'Copy Node', icon: <CopyIcon className="w-4 h-4" />, onClick: () => console.log('Copy') },
            { label: 'Delete Node', icon: <TrashIcon className="w-4 h-4" />, onClick: () => handleNodeDelete(contextMenu.nodeId), isDestructive: true },
        ];
    }, [contextMenu, nodes, handleNodeMention, handleNodeDelete]);

    const handleLinkStart = (nodeId: string, handle: 'right' | 'left', event: React.MouseEvent) => {
        event.preventDefault();
        const rect = containerRef.current!.getBoundingClientRect();
        setLinkingState({
            fromNode: nodeId,
            fromHandle: handle,
            tempEndPoint: {
                x: (event.clientX - rect.left - viewState.x) / viewState.scale,
                y: (event.clientY - rect.top - viewState.y) / viewState.scale,
            }
        });
    };

    const handleLinkEnd = (nodeId: string, handle: 'right' | 'left') => {
        if (linkingState) {
            if (linkingState.fromNode !== nodeId) {
                const newEdge: Edge = {
                    id: generateId('edge'),
                    from: linkingState.fromNode,
                    to: nodeId,
                };
                updateEdges(edges => [...edges.filter(e => e.from !== newEdge.from || e.to !== newEdge.to), newEdge]);
            }
            setLinkingState(null);
        }
    };
    
    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        handleCanvasPanMove(e);
        if (linkingState) {
            const rect = containerRef.current!.getBoundingClientRect();
            setLinkingState(prev => prev ? {
                ...prev,
                tempEndPoint: {
                    x: (e.clientX - rect.left - viewState.x) / viewState.scale,
                    y: (e.clientY - rect.top - viewState.y) / viewState.scale,
                }
            } : null);
        }
    };
    
    const handleCanvasMouseUp = () => {
        handleCanvasPanUp();
        setLinkingState(null);
    };

    const videoStreams = useRef<Map<string, MediaStream>>(new Map());
    
    const registerVideoRef = useCallback((id: string, element: HTMLVideoElement | null) => {
        if (element && !videoStreams.current.has(id)) {
            const node = nodes.find(n => n.id === id);
            if(!node || (node.type !== 'video' && node.type !== 'screen')) return;

            const constraints = node.type === 'video' ? { video: true } : { video: { mediaSource: 'screen' } as any };
            (node.type === 'video' ? navigator.mediaDevices.getUserMedia(constraints) : navigator.mediaDevices.getDisplayMedia(constraints))
                .then(stream => {
                    element.srcObject = stream;
                    videoStreams.current.set(id, stream);
                })
                .catch(err => console.error(`Error starting stream for node ${id}:`, err));
        } else if (!element && videoStreams.current.has(id)) {
            videoStreams.current.get(id)?.getTracks().forEach(track => track.stop());
            videoStreams.current.delete(id);
        }
    }, [nodes]);

    useEffect(() => {
        return () => {
            videoStreams.current.forEach(stream => stream.getTracks().forEach(track => track.stop()));
        };
    }, []);

    const resetView = () => {
        setViewState({ x: 0, y: 0, scale: 1 });
    };

    const autoLayout = () => {
        if (nodes.length === 0) return;
        
        const padding = 100;
        const minX = Math.min(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxX = Math.max(...nodes.map(n => n.x + n.width));
        const maxY = Math.max(...nodes.map(n => n.y + n.height));

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        if (contentWidth === 0 || contentHeight === 0) {
            resetView();
            return;
        }

        const container = containerRef.current?.getBoundingClientRect();
        if (!container) return;

        const scaleX = container.width / (contentWidth + padding * 2);
        const scaleY = container.height / (contentHeight + padding * 2);
        const scale = Math.min(scaleX, scaleY, 1);

        const newX = (container.width - contentWidth * scale) / 2 - (minX * scale);
        const newY = (container.height - contentHeight * scale) / 2 - (minY * scale);
        
        setViewState({ x: newX, y: newY, scale });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' && !isSpacePanning) {
                setIsSpacePanning(true);
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodeId) {
                    handleNodeDelete(selectedNodeId);
                    setSelectedNodeId(null);
                }
            }
            if (e.key === 'Escape') {
                setSelectedNodeId(null);
                setContextMenu(null);
                setCommandMenu(null);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                setIsSpacePanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacePanning, selectedNodeId, handleNodeDelete]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.draggable-node')) return;
        setCommandMenu({ x: e.clientX, y: e.clientY });
    };

    const svgRenderData = useMemo(() => {
        if (nodes.length === 0 || edges.length === 0) {
            return null;
        }

        const padding = 200;
        const minX = Math.min(...nodes.map(n => n.x));
        const minY = Math.min(...nodes.map(n => n.y));
        const maxX = Math.max(...nodes.map(n => n.x + n.width));
        const maxY = Math.max(...nodes.map(n => n.y + n.height));

        const svgX = minX - padding;
        const svgY = minY - padding;
        const svgWidth = maxX - minX + padding * 2;
        const svgHeight = maxY - minY + padding * 2;

        const edgePaths = edges.map(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) return null;

            const startX = fromNode.x + fromNode.width - svgX;
            const startY = fromNode.y + fromNode.height / 2 - svgY;
            const endX = toNode.x - svgX;
            const endY = toNode.y + toNode.height / 2 - svgY;

            const controlPointOffset = Math.max(50, Math.abs(endX - startX) * 0.4);

            return `M ${startX},${startY} C ${startX + controlPointOffset},${startY} ${endX - controlPointOffset},${endY} ${endX},${endY}`;
        }).filter(Boolean);

        return {
            x: svgX,
            y: svgY,
            width: svgWidth,
            height: svgHeight,
            paths: edgePaths as string[],
        };
    }, [nodes, edges]);

    return (
        <div className="w-screen h-screen dark:bg-black bg-zinc-100 dark:text-white text-black overflow-hidden flex font-sans">
            <Sidebar
                ref={sidebarRef}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                chatHistory={project.chatHistory}
                prompt={prompt}
                setPrompt={setPrompt}
                attachedImage={attachedImage}
                setAttachedImage={setAttachedImage}
                referencedNode={referencedNode}
                setReferencedNode={setReferencedNode}
                chatModel={geminiFlashModel}
            />
            <main className="flex-1 relative">
                <Header
                    projectName={project.name}
                    projects={projects}
                    activeProjectId={project.id}
                    onGoBack={onGoBack}
                    onSelectProject={onSelectProject}
                    onCreateProject={onCreateProject}
                />
                <div
                    ref={containerRef}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    style={{ cursor: isSpacePanning ? 'grabbing' : 'grab' }}
                    onWheel={handleWheel}
                    onMouseDown={(e) => handleCanvasMouseDown(e, isSpacePanning)}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onDoubleClick={handleDoubleClick}
                >
                    <div
                        className="transform-container"
                        style={{ transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`, transformOrigin: 'top left' }}
                    >
                        {svgRenderData && (
                            <svg
                                style={{
                                    position: 'absolute',
                                    left: svgRenderData.x,
                                    top: svgRenderData.y,
                                    width: svgRenderData.width,
                                    height: svgRenderData.height,
                                    pointerEvents: 'none',
                                }}
                            >
                                {svgRenderData.paths.map((path, index) => (
                                    <path
                                        key={index}
                                        d={path}
                                        stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                ))}
                            </svg>
                        )}
                         {linkingState && (() => {
                            const fromNode = nodes.find(n => n.id === linkingState.fromNode);
                            if (!fromNode) return null;
                            const startX = fromNode.x + fromNode.width;
                            const startY = fromNode.y + fromNode.height / 2;
                            const endX = linkingState.tempEndPoint.x;
                            const endY = linkingState.tempEndPoint.y;
                            const controlPointOffset = Math.max(50, Math.abs(endX - startX) * 0.4);
                            const path = `M ${startX},${startY} C ${startX + controlPointOffset},${startY} ${endX - controlPointOffset},${endY} ${endX},${endY}`;
                            return (
                                <svg className="absolute top-0 left-0 w-full h-full" style={{ width: '100vw', height: '100vh', pointerEvents: 'none', transform: 'translate(0,0)' }}>
                                    <path d={path} stroke={theme === 'dark' ? '#3b82f6' : '#2563eb'} strokeWidth="2" fill="none" />
                                </svg>
                            );
                        })()}

                        {nodes.map(node => (
                            <NodeComponent
                                key={node.id}
                                node={node}
                                onDrag={handleNodeDrag}
                                onDelete={handleNodeDelete}
                                onResize={handleNodeResize}
                                onContentChange={handleContentChange}
                                onMention={handleNodeMention}
                                onExpand={handleNodeExpand}
                                scale={viewState.scale}
                                onSelect={handleSelectNode}
                                isSelected={node.id === selectedNodeId}
                                registerVideoRef={registerVideoRef}
                                onContextMenu={handleContextMenu}
                                onLinkStart={handleLinkStart}
                                onLinkEnd={handleLinkEnd}
                            />
                        ))}
                    </div>
                </div>

                <BottomToolbar
                    onAddText={() => handleAddNode('text')}
                    onAddImage={() => alert('Image upload not implemented')}
                    onAddAudio={() => handleAddNode('audio')}
                    onAddVideo={() => handleAddNode('video')}
                    onAddScreenShare={() => handleAddNode('screen')}
                    onAddCode={() => handleAddNode('code')}
                    onAddUrl={() => setIsUrlModalOpen(true)}
                    onToggleSidebar={() => setIsSidebarOpen(p => !p)}
                    onClearCanvas={handleClearCanvas}
                />
                <ZoomControls
                    scale={viewState.scale}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onReset={resetView}
                    onAutoLayout={autoLayout}
                />
                <UrlInputModal
                    isOpen={isUrlModalOpen}
                    onClose={() => setIsUrlModalOpen(false)}
                    onSubmit={handleUrlSubmit}
                />
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        actions={contextMenuActions}
                        onClose={handleCloseContextMenu}
                    />
                )}
                {commandMenu && (
                    <CommandMenu
                        x={commandMenu.x}
                        y={commandMenu.y}
                        onClose={() => setCommandMenu(null)}
                        onSelect={(type) => handleAddNode(type as any)}
                    />

                )}
            </main>
        </div>
    );
};

export default CanvasView;