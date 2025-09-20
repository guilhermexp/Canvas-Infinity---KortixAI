import React from 'react';

interface IconButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  'aria-label'?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ children, className = '', onClick, active = false, ...props }) => {
  const activeClasses = active 
    ? 'dark:text-white text-black' 
    : 'dark:text-zinc-400 text-zinc-500 dark:hover:text-white hover:text-black';
  
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors duration-200 ${activeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
