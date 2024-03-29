# mdsvex-pages

Markdown-based documentation/blog generator built with [MDsveX](https://mdsvex.com/). (WIP)
<br>
Built for use with [svelte-spa-router](https://github.com/ItalyPaleAle/svelte-spa-router).
<br>

---
# How it works

Assuming your svelte project tree looks similar to:

```
├─── /src
│   ├─── main.js
│   ├─── App.svelte
│   ├─── mdp.config.json
│   ├─── /docs
│   │   └─── page1.md
│   │   └─── page2.md
│   
├─── rollup.config.js
```

mdsvex-pages will automatically generate [svelte-spa-router](https://github.com/ItalyPaleAle/svelte-spa-router) routes and convert the markdown files into parseable svelte files to be bundled. (using MDsveX's [compile](https://mdsvex.com/docs#use-it) function)

Because mdsvex-pages uses MDsveX, you can write valid Svelte code in the .md files. The program currently uses .md files as the default, as that was what I wanted to parse for my own original usage, but options allow you to change this extension to `.svx` (as used by MDsveX in their docs) or `.anything`, so you can use whatever extension you prefer. 

---
# Setup

To start, clone this repo.

```bash
git clone https://github.com/knightss27/mdsvex-pages
cd mdsvex-pages
npm install
```  

In your `rollup.config.js` you can configure the options. Defaults are those listed below.

```js
export default {
...
plugins: [
  mdsvexPages({
    appName: 'App.svelte' // Path of the central svelte file, should include your Router component. Assumes you are in /src.
    paths: ['docs'] // Path of the .md pages folder. Assumes you are in /src and can take multiple routes.
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

In your App.svelte (or equivalent). Again, this is already set up in this repo.

```svelte
<script>
  import Router from 'svelte-spa-router';
  const routes = new Map();
  // Alternatively: const routes = {};
</script>

<main>
  <h1>Hello world!</h1>
  <Router {routes} />
</main>
```

Once this is set up, feel free to add as many .md pages to their folder as you'd like.
Markdown pages support frontmatter, and take these fields:

```
---
id: page-id     // The route to this page, defaults to the name of the file.
title: README   // Will show as the title of the site when on this page.
---
```

Additionally, you can turn on the (very much experimental) sidebar and/or navbar to your page. These are mostly mobile responsive, and come with varying degrees of customization. Additionally, you can turn off either one of the components and replace them with your own if you'd like, or only show them on specific routes. This is all set through a new `mdp.config.json file`, which can be configured in your src directory. The file can be set up as so:

```js
//mdp.config.json

{
  "sidebar": { // All options for the sidebar are stored in this object.
    "docs": { // This represents the route the sidebar should show up on.
      "Category Name": [ // Category name, text next to the dropdown.
        {"route": "page-id", "label": "My Page"}, // A sidebar item, route for page id relative to the sidebar route.
        {"route": "", "label": "Homepage"} // Allows for a default homepage on the /docs route.
        // **IMPORTANT** if you want a .md file to load on the homepage, please set its front-matter 'id' to .
        // If you instead want your own Svelte component on the homepage, simply add a route in your router for "/docs"
      ],
      "default-open": ["Category Name"] // Allows the sidebar to have these categories open by default.
      // This must use the same string as you did for the category. Always needs to exist, but can be empty array.
    }
  },
  "navbar": { // All options for the navbar are stored in this object.
    "docs": { // This represents the route the navbar should show up on.
      "links": [ // Links to show up on the navbar.
        // route can be relative, or if you include an global attribute set to true, it can link directly to whatever route you specify
        // the global attribute is optional, and is passed directly to the href attribute of the link 
        {"route": "page-id", "label": "My Page", "global": true}
      ],
      "title": "My Title", // Title for your navbar brand.
      "logo": { // Logo for your navbar brand.
        "alt": "Site Logo",
        "src": "img.png" // src is passed to the img src attribute.
      }
      // optional brand-link will override where the navbar title/logo *href* will link to
      // by default, it goes to `/#/docs' (your route for the navbar specified above)
      "brand-link": "https://my-site.com/"
    }
  }
}
```

And in your App.svelte (or equivalent) you can import the wrapper for the components.

```svelte
<script>
  import MDPWrapper from 'rollup-plugin-mdsvex-pages/src/components/MDPWrapper.svelte';
  import Router from 'svelte-spa-router';
  const routes = new Map();
</script>

<MDPWrapper>
  <main>
    <h1>Hello from mdsvex-pages!</h1>
    <Router {routes} />
  </main>
</MDPWrapper>
```

Rollup will also generate a `src/mdp-meta.js` file containing a single exported `pages` list of objects containing the `id`, `title`, `date`, and `subtitle` of each page.
