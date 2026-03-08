import React from 'react';

const PageHero = ({ badge, title, subtitle, right }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 mt-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-800 pb-6">
        <div>
          {badge ? (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 text-[11px] font-semibold tracking-wide uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {badge}
            </div>
          ) : null}
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
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

