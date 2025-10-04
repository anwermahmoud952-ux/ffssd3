import React from 'react';

interface HeaderProps {
  round: number;
  maxRounds: number;
}

const Header: React.FC<HeaderProps> = ({ round, maxRounds }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700">
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-green-400 tracking-wider">
          اتحضر للأخضر
        </h1>
        <div className="text-lg font-semibold bg-gray-700 px-4 py-2 rounded-lg text-gray-300">
          الجولة: <span className="text-white font-bold">{round}</span> / {maxRounds}
        </div>
      </div>
    </header>
  );
};

export default Header;