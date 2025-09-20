import React, { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { SparklesIcon, PlusIcon, ArrowUpIcon, CloseIcon, YouTubeIcon, LinkIcon, CodeIcon, ScreenShareIcon } from './Icons';
import type { ChatMessage, NodeType } from '../types';
import { geminiFlashModel } from '../services/ai';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (prompt: string, image?: { data: string; mimeType: string }, reference?: NodeType) => Promise<void>;
    isProcessing: boolean;
    chatHistory: ChatMessage[];
    prompt: string;
    setPrompt: (value: string) => void;
    attachedImage: { data: string; mimeType: string } | null;
    setAttachedImage: (image: { data: string; mimeType: string } | null) => void;
    referencedNode: NodeType | null;
    setReferencedNode: (node: NodeType | null) => void;
    chatModel: string;
}

export interface SidebarHandle {
    focusInput: () => void;
}

const modelNames: { [key: string]: string } = {
    [geminiFlashModel]: 'Gemini 2.5 Flash',
};

const formatModelName = (modelId?: string) => {
    if (!modelId || !modelNames[modelId]) return "Gemini";
    return modelNames[modelId];
};

const getNodeIcon = (type: NodeType['type'], className = "w-4 h-4") => {
    switch(type) {
        case 'youtube': return <YouTubeIcon className={`${className} text-red-500`} />;
        case 'website': return <LinkIcon className={`${className} text-blue-400`} />;
        case 'code': return <CodeIcon className={`${className} text-green-400`} />;
        case 'screen': return <ScreenShareIcon className={`${className} text-cyan-400`} />;
        case 'text': return <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>;
        default: return null;
    }
}

const Sidebar = forwardRef<SidebarHandle, SidebarProps>(({ isOpen, onClose, onSendMessage, isProcessing, chatHistory, prompt, setPrompt, attachedImage, setAttachedImage, referencedNode, setReferencedNode, chatModel }, ref) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            textareaRef.current?.focus();
        }
    }));

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isProcessing]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [prompt, attachedImage, referencedNode]);


    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setReferencedNode(null);
                setAttachedImage({ data: base64String, mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((prompt.trim() || attachedImage || referencedNode) && !isProcessing) {
            onSendMessage(prompt, attachedImage, referencedNode);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const renderMessage = (text: string) => {
        return text.split('**').map((part, index) => 
            index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        );
    };
    
    const getReferenceNodeTitle = (node: NodeType) => {
        if (node.type === 'screen' || node.type === 'video') return 'Live Feed';
        return node.content?.title || (typeof node.content === 'string' && node.content.substring(0, 50) + '...') || 'Referenced Node';
    }
    
    const totalTokens = useMemo(() =>
        chatHistory.reduce((acc, msg) => acc + (msg.tokenCount || 0), 0),
        [chatHistory]
    );

    return (
        <aside className={`absolute top-0 left-0 h-full dark:bg-[#1e1e1e] bg-zinc-50 border-r dark:border-zinc-700 border-zinc-200 z-20 w-full max-w-sm transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b dark:border-zinc-700 border-zinc-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-semibold dark:text-white text-black">Code assistant</h2>
                </div>
                 <div className="flex items-center gap-1.5 text-xs dark:bg-[#2d2d2d] bg-zinc-100 dark:border-zinc-600 border-zinc-300 border rounded-md px-2 py-1 dark:text-zinc-300 text-zinc-700">
                    <span>{formatModelName(chatModel)}</span>
                </div>
            </div>

            <div
                ref={chatContainerRef}
                className="flex-grow p-4 overflow-y-auto space-y-6"
                onWheel={(e) => e.stopPropagation()}
            >
                 {chatHistory.length === 0 && (
                    <div className="text-center text-zinc-500 text-sm mt-4">
                        Make changes, add new features, ask for anything.
                    </div>
                )}
                {chatHistory.map((msg, i) => (
                    <div key={i}>
                        {msg.role === 'user' ? (
                            <div className="space-y-2">
                                <p className="text-sm font-medium dark:text-zinc-400 text-zinc-600">User</p>
                                {msg.image && (
                                    <img src={`data:${msg.image.mimeType};base64,${msg.image.data}`} alt="attachment" className="rounded-md mb-2 max-h-48" />
                                )}
                                {msg.reference && (
                                    <div className="mb-2 p-2 border dark:border-white/20 border-black/10 rounded-md dark:bg-white/10 bg-black/5 flex items-center gap-2">
                                        <div className="flex-shrink-0 dark:text-white text-black">{getNodeIcon(msg.reference.type)}</div>
                                        <div className="flex-grow text-xs truncate">
                                            <span className="font-semibold capitalize">{msg.reference.type} Reference:</span> {getReferenceNodeTitle(msg.reference)}
                                        </div>
                                    </div>
                                )}
                                <p className="dark:text-white text-black text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <p>{formatModelName(msg.model)}</p>
                                    <p>•</p>
                                    <p>Ran for a few seconds{msg.tokenCount && ` • ${msg.tokenCount.toLocaleString()} tokens`}</p>
                                </div>
                                <p className="dark:text-white text-black text-sm whitespace-pre-wrap">{renderMessage(msg.text)}</p>
                            </div>
                        )}
                    </div>
                ))}
                {isProcessing && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <p>{formatModelName(chatModel)}</p>
                            <p>•</p>
                            <p>Running...</p>
                        </div>
                         <div className="border dark:border-zinc-700 border-zinc-200 dark:bg-[#282828] bg-zinc-100 rounded-lg p-3 text-sm text-zinc-500 animate-pulse">
                            Thought for a few seconds
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t dark:border-zinc-700 border-zinc-200 flex-shrink-0">
                <form onSubmit={handleSubmit} className="w-full">
                   {attachedImage && (
                       <div className="mb-2 relative w-24 h-24 p-1 border dark:border-zinc-600 border-zinc-300 rounded-md">
                           <img src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} alt="preview" className="w-full h-full object-cover rounded"/>
                           <button 
                                type="button" 
                                onClick={() => {
                                    setAttachedImage(null);
                                    if(fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 dark:bg-zinc-800 bg-white border dark:border-transparent border-zinc-300 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-500 transition-colors"
                                aria-label="Remove image"
                           >
                               <CloseIcon className="w-4 h-4" />
                           </button>
                       </div>
                   )}
                   {referencedNode && (
                        <div className="mb-2 p-2 border dark:border-zinc-600 border-zinc-300 rounded-lg dark:bg-[#3a3a3a] bg-zinc-200 flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0">{getNodeIcon(referencedNode.type, "w-5 h-5")}</div>
                            <div className="flex-grow dark:text-zinc-300 text-zinc-700 truncate">
                                <span className="font-semibold capitalize dark:text-zinc-100 text-black">{referencedNode.type}:</span> {getReferenceNodeTitle(referencedNode)}
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setReferencedNode(null)}
                                className="flex-shrink-0 w-6 h-6 dark:bg-zinc-700 bg-zinc-300 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-500 transition-colors"
                                aria-label="Remove reference"
                            >
                               <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                   )}
                    <div className="flex items-end gap-2 p-2 dark:bg-[#2d2d2d] bg-zinc-100 rounded-xl border dark:border-zinc-700 border-zinc-300">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 dark:hover:bg-zinc-700 hover:bg-zinc-200 dark:hover:text-white hover:text-black transition-colors"
                            aria-label="Add attachment"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                        <textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={handleInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Make changes, add new features, ask for anything"
                            className="w-full bg-transparent border-none resize-none dark:text-white text-black dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:ring-0 overflow-hidden px-1 max-h-36 text-sm"
                            rows={1}
                            style={{ lineHeight: '1.5rem' }}
                            disabled={isProcessing}
                        />

                        <button
                            type="submit"
                            disabled={isProcessing || (!prompt.trim() && !attachedImage && !referencedNode)}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center dark:bg-[#3a3a3a] bg-zinc-200 rounded-lg disabled:dark:bg-zinc-700 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-600 hover:bg-zinc-300 dark:hover:text-white hover:text-black transition-colors"
                            aria-label="Send message"
                        >
                           <ArrowUpIcon className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
            {totalTokens > 0 && (
                <div className="flex-shrink-0 px-4 pb-2 text-xs text-zinc-500 text-center">
                    Total Context: {totalTokens.toLocaleString()} / 1,000,000 Tokens
                </div>
            )}
        </aside>
    );
});

export default Sidebar;