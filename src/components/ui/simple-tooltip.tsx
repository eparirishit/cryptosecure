import React, { ReactNode } from 'react';

export const SimpleTooltip = ({ children, content }: { children: ReactNode; content: ReactNode }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center w-max max-w-xs left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="bg-neutral-900 text-white text-xs rounded-lg py-3 px-4 shadow-xl text-left leading-relaxed border border-neutral-800">
          {content}
        </div>
        <div className="w-2 h-2 bg-neutral-900 rotate-45 -mt-1 border-r border-b border-neutral-800"></div>
      </div>
    </div>
  );
};
