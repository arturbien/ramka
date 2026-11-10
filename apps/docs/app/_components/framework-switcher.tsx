'use client';

import { usePathname, useRouter } from 'next/navigation';

import { counterpartHref, frameworkFromPath, frameworks } from '../_content/frameworks';
import { cn } from '@/lib/utils';

/** Segmented React/Svelte control that jumps to the same page in the other framework. */
export function FrameworkSwitcher({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const current = frameworkFromPath(pathname);

  return (
    <div
      role="group"
      aria-label="Framework"
      className={cn(
        'grid grid-cols-2 gap-0.5 rounded-lg bg-black/[0.05] p-0.5 text-[13px] dark:bg-white/[0.06]',
        className,
      )}
    >
      {frameworks.map((framework) => {
        const active = framework.id === current;
        return (
          <button
            key={framework.id}
            type="button"
            aria-pressed={active}
            data-framework={framework.id}
            onClick={() => {
              if (active) return;
              onNavigate?.();
              router.push(counterpartHref(pathname, window.location.hash, framework.id));
            }}
            className={cn(
              'rounded-md px-2.5 py-1 leading-5 transition-colors',
              active
                ? 'bg-white font-medium text-neutral-900 shadow-[0_0.5px_1px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)] dark:bg-neutral-800 dark:text-neutral-50 dark:shadow-[0_0.5px_1px_rgba(0,0,0,0.4),inset_0_0.5px_0_rgba(255,255,255,0.08)]'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
            )}
          >
            {framework.label}
          </button>
        );
      })}
    </div>
  );
}

/** Tagline under the wordmark, naming the framework of the current page. */
export function FrameworkTagline() {
  const current = frameworkFromPath(usePathname());
  return <>{frameworks.find((framework) => framework.id === current)!.tagline}</>;
}
