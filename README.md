# rollup-plugin-mdsvex-pages

A plugin to generate svelte files from markdown using MDsveX, and to write the routes for the docs using svelte-spa-router or sapper (coming soon).

> Known bug: routes will not be re-calculated unless you re-run `npm run dev` or `npm run build` in your svelte project.

---
# Setup

Assuming you already have a Svelte project, install the package.

`npm install --save-dev rollup-plugin-mdsvex-pages`

In your `rollup.config.js` you can configure the options. Defaults are those listed below.

```js
export default {
...
plugins: [
  mdsvexPages({
    appName: 'App.svelte' // Path of the central svelte file, should include your Router component. Assumes you are in /src.
    docPath: 'docs' // Path of the .md pages folder. Assumes you are in /src.
    mdsvexOptions: { //You can configure any of the mdsvexOptions, and they will be passed to mdsvex.
      extensions: ['.md'] 
    }
  }),

  svelte({
  // Required for mdsvex-pages to work. Is already set in this repo. 
  extensions: [".svelte", ".md"],
  })
]};
```

In your App.svelte (or equivalent). This is already set up in the template repo.

```svelte
<script>
  import Router from 'svelte-spa-router'
  const routes = new Map();
</script>

<main>
  <h1>Hello world!</h1>
  <Router {routes} />
</main>
```
> ### NOTE: 
> You must be using the Map() version of svelte-spa-router, and it needs to be named `routes`.

Once this is set up, feel free to add as many .md pages to their folder as you'd like.
