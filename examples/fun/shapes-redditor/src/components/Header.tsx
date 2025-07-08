
import React from 'react';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-2 px-4 flex items-center">
      <div className="flex items-center space-x-2">
        <div className="text-reddit-orange font-bold text-2xl">reddit</div>
        <span className="text-sm text-reddit-textgray">mock</span>
      </div>
    </header>
  );
};

export default Header;
