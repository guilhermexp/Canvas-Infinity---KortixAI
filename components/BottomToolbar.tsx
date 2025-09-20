import React from 'react';
import IconButton from './IconButton';
import { MenuIcon, ImageIcon, MicrophoneIcon, VideoIcon, CodeIcon, CloseIcon, YouTubeIcon, LinkIcon, TextIcon, ScreenShareIcon } from './Icons';

interface BottomToolbarProps {
  onAddUrl: () => void;
  onAddImage: () => void;
  onAddAudio: () => void;
  onAddVideo: () => void;
  onAddCode: () => void;
  onAddText: () => void;
  onToggleSidebar: () => void;
  onClearCanvas: () => void;
  onAddScreenShare: () => void;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({ 
  onAddUrl,
  onAddImage,
  onAddAudio,
  onAddVideo,
  onAddCode,
  onAddText,
  onToggleSidebar,
  onClearCanvas,
  onAddScreenShare
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 dark:bg-[#1A1A1A] bg-white/80 backdrop-blur-sm border dark:border-zinc-700 border-zinc-200 rounded-full p-2 shadow-lg">
      <IconButton onClick={onToggleSidebar} aria-label="Toggle Sidebar">
        <MenuIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onAddText} aria-label="Add Text Note">
        <TextIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onAddImage} aria-label="Add Image">
        <ImageIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onAddAudio} aria-label="Record Audio">
        <MicrophoneIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onAddVideo} aria-label="Show Camera">
        <VideoIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onAddScreenShare} aria-label="Share Screen">
        <ScreenShareIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onAddCode} aria-label="Add Code Snippet">
        <CodeIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onAddUrl} aria-label="Add YouTube Video or Website URL">
        <LinkIcon className="w-5 h-5" />
      </IconButton>
      <IconButton onClick={onClearCanvas} aria-label="Clear Canvas">
        <CloseIcon className="w-5 h-5" />
      </IconButton>
    </div>
  );
};

export default BottomToolbar;