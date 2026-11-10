<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getModel, setStage, type StageContext } from './state.svelte.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    children?: Snippet<[StageContext]>;
  }

  let { children, ...rest }: Props = $props();
  const lb = getModel();

  const context: StageContext = setStage({
    morphRef(node) {
      lb.stageMorph = node;
      return () => {
        if (lb.stageMorph === node) lb.stageMorph = undefined;
      };
    },
  });

  function stage(el: HTMLElement) {
    lb.stageEl = el;
    return () => {
      if (lb.stageEl === el) lb.stageEl = undefined;
    };
  }
</script>

<div data-ramka-stage {...rest} {@attach stage}>
  {@render children?.(context)}
</div>
