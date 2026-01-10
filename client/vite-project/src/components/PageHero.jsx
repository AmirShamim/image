import React from 'react';

const PageHero = ({ badge, title, subtitle, right }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <div className="glass-card p-6 sm:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {badge ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
              {badge}
            </div>
          ) : null}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            <span className="text-gradient">{title}</span>
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>

        {right ? (
          <div className="flex items-center gap-3 sm:justify-end">
            {right}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PageHero;

