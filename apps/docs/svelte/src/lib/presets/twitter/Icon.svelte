<script lang="ts">
  let {
    name,
  }: {
    name: 'x' | 'chevron-left' | 'chevron-right' | 'verified' | 'reply' | 'repost' | 'like' | 'views' | 'share';
  } = $props();
</script>

{#if name === 'verified'}
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="xlb-verified">
    <path
      d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-.99-1-2.5-1.27-3.9-.82C14.6 2.9 13.3 2 12 2s-2.6.9-3.06 2.13c-1.4-.45-2.91-.18-3.9.82-1.01 1.01-1.27 2.52-.81 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91 1 .99 2.5 1.27 3.9.82.46 1.23 1.76 2.13 3.06 2.13s2.6-.9 3.06-2.13c1.4.45 2.91.18 3.9-.82 1.01-1.01 1.27-2.52.81-3.91 1.31-.67 2.19-1.91 2.19-3.34Zm-6.01-3.77 1.72 1.72-6.01 6.01-3.54-3.54 1.72-1.72 1.82 1.82 4.29-4.29Z"
    />
  </svg>
{:else if name === 'x' || name === 'chevron-left' || name === 'chevron-right'}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
    <path
      d={name === 'x' ? 'M18 6 6 18M6 6l12 12' : name === 'chevron-left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
    {#if name === 'reply'}
      <path
        d="M19.5 10.5c0 4.142-3.358 7.5-7.5 7.5-1.38 0-2.67-.37-3.78-1.02L3 19.5V15.3c.65-1.11 1.02-2.4 1.02-3.78 0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5Z"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {:else if name === 'repost'}
      <path
        d="M4.5 9.5 9 5l4.5 4.5M9 5v11.5M19.5 14.5 15 19l-4.5-4.5M15 19V7.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {:else if name === 'like'}
      <path
        d="M12 20.25c-.19 0-.38-.07-.53-.2-5.47-4.06-8.97-6.74-8.97-11.1 0-2.98 2.4-5.4 5.36-5.4 1.64 0 3.14.79 4.14 2.02 1-1.23 2.5-2.02 4.14-2.02 2.96 0 5.36 2.42 5.36 5.4 0 4.36-3.5 7.04-8.97 11.1-.15.13-.34.2-.53.2Z"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {:else if name === 'views'}
      <path d="M4 18V10M10 18V6M16 18v-5M20 18V8" stroke-linecap="round" stroke-linejoin="round" />
    {:else}
      <path
        d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14M12 4v11M8.5 7.5 12 4l3.5 3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/if}
  </svg>
{/if}
