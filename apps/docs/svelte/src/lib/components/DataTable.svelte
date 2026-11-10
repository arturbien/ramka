<script lang="ts" module>
  /** Body cell classes, for rows rendered through the `children` snippet. */
  export const td = 'px-3 py-2 align-top';
  /** First column cell classes. */
  export const tdLabel = `${td} text-neutral-700 dark:text-neutral-300`;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    columns,
    rows = [],
    head,
    cell,
    children,
  }: {
    columns: string[];
    rows?: string[][];
    head?: Snippet<[column: string, index: number]>;
    cell?: Snippet<[value: string, index: number]>;
    children?: Snippet;
  } = $props();
</script>

<div class="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
  <table class="w-full text-left text-sm">
    <thead class="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
      <tr>
        {#each columns as column, i (column)}
          <th class="px-3 py-2 font-medium whitespace-nowrap">
            {#if head}{@render head(column, i)}{:else}{column}{/if}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
      {#each rows as row (row[0])}
        <tr>
          {#each row as value, i (i)}
            <td class={i === 0 ? tdLabel : td}>
              {#if cell}{@render cell(value, i)}{:else}{value}{/if}
            </td>
          {/each}
        </tr>
      {/each}
      {@render children?.()}
    </tbody>
  </table>
</div>
