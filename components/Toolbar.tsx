import React, { useState } from 'react';

// This file contains the UrlInputModal component.

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

const UrlInputModal: React.FC<UrlInputModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url);
      setUrl('');
    }
  };
  
  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="dark:bg-[#1A1A1A] bg-white border dark:border-zinc-700 border-zinc-200 rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold dark:text-white text-black mb-4">Add from URL</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a YouTube or website URL"
            className="w-full dark:bg-[#2d2d2d] bg-zinc-100 border dark:border-zinc-600 border-zinc-300 rounded-md p-2 dark:text-white text-black dark:placeholder-zinc-500 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-4 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-md dark:bg-zinc-700 bg-zinc-200 dark:text-zinc-200 text-zinc-800 dark:hover:bg-zinc-600 hover:bg-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!isValidUrl(url)}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:bg-zinc-600 disabled:text-zinc-400 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UrlInputModal;