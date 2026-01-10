import React from 'react';
import Header from './Header';
import Footer from './Footer';

/**
 * PageShell
 * - Provides consistent dark + glass background treatment
 * - Handles header spacing (pt-16) so pages start at top
 */
const PageShell = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-[#09090b] ${className}`}>
      {/* background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 gradient-bg" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-[#00d4aa]/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[26rem] h-[26rem] bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      <Header />
      <main className="relative z-10 pt-24 pb-20">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageShell;

