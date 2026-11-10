/** Runes everywhere outside node_modules, as in the SvelteKit docs these demos come from. */
export default {
  compilerOptions: {
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
  },
};
