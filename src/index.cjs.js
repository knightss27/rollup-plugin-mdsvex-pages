'use strict';

const fs = require('fs');
const path = require('path');
const mdsvex = require('mdsvex');
const matter = require('gray-matter');
const gfm = require('remark-gfm');
const config = require(path.resolve('src', 'mdp.config.js'))

function mdsvexPages(options) {
    
    // Make sure options is an empty object if left untouched.
    if ( options === void 0 ) options = {};

    // Default options for the plugin.
    const defaultOptions = {
        appName: 'App.svelte', // Path or filename of your main file with the Router component.
        docPath: 'docs', // Path to the folder where all the .md files are.
        hasSidebar: false, // I think this is pretty explanatory...
        hasNavbar: false,
        colors: { // Options to specify colors used in sidebar...
            text: "black",
            background: "white",
            hover: "gray",
        },
        sidebarOptions: { // Options for width and breakpoint (to come).
            width: "300px",
            breakpoint: "700px"
        },
        mdxvexOptions: { // Extensions you want MDsveX to parse.
            extensions: ['.md'],
            remarkPlugins: [gfm]
        }
    }

    // Check if the object has a property.
    function has(obj, propName) {
        return hasOwnProperty.call(obj, propName)
    }

    // Compare both changed and default options to return one object with what is needed.
    function getOptions(opts) {
        var options = {};
  
        for (var opt in defaultOptions)
            { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]; }

        return options
    }

    return {
        name: 'mdsvex-pages',
        async transform(code, id) {
            // this.addWatchFile(path.resolve('src', 'mdp.config.js'));

            // Establish path and filename for later usage.
            const fileName = path.win32.basename(id);

            // Import changed and default options.
            const actualOpts = getOptions(options);

            // Only edit the main App.svelte file
            if (fileName == actualOpts.appName) {
                
                // Establish imports string and locations of .md files.
                let imports = '';
                const files = fs.readdirSync(path.resolve('src', actualOpts.docPath))

                // Make style id, so you can't anticipate the names / overwrite them with globals.
                const styleID = Date.now().toString().slice(-4);
                const withID = (className) => {return className+'-'+styleID}

                // Create the routes string for adding to svelte-spa-router.
                let routes = '';
                
                // Add imports and routes for all .md files.
                files.forEach(function (file, index) {
                    let name = path.parse(file).name;

                    const metadata = matter(fs.readFileSync(path.resolve('src', actualOpts.docPath, file))).data
                    
                    imports += "import " + name + " from './" + actualOpts.docPath + "/" + file + "'; \n";

                    if (has(metadata, 'id') && metadata.id !== name) {
                        name = metadata.id;
                    }

                    routes += "routes.set('/" + actualOpts.docPath + "/" + name + "', " + path.parse(file).name + ");\n" 
                })

                // Add those imports.
                const newValue = code.replace('<script>', 
                    '<script>\n//--mdLoader-- \n' + imports + '//--mdLoader--'
                );

                // Add those set routes.
                let addRoutes = newValue.replace('</script>', 
                    routes + '</script>'
                );

                // Stuff for adding the sidebar
                if (actualOpts.hasSidebar) { 

                    // Start by parsing the config file.
                    const categories = Object.keys(config.docs);

                    // Arrow SVG for the dropdowns.
                    const arrowSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24"><path fill="rgba(0,0,0,0.5)" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path></svg>'
                    
                    // Define the categories.
                    const categoryRender = categories.map((category) => {
                        
                        const pages = config.docs[category];
                        let dom = '';
                        
                        pages.forEach((page) => {
                            const pageRoute = has(page, 'route') ? page.route : page;
                            const pageName = has(page, 'label') ? page.label : page;
                            dom += '<li class="sidebar-category-item-li-' + styleID + '"><a class:active-' + styleID + '={$location.includes("' + pageRoute + '")} href="/#/docs/' + pageRoute + '" class="sidebar-category-item-'+ styleID + '">' + pageName + '</a></li>\n'
                        })
                        
                        const arrow  = '<span class:rotate-' + styleID + '={categories' + styleID + '["' + category + '"]} class="arrow-' + styleID + '">' + arrowSVG + '</span>'

                        return (
                            '<li on:click={() => {categories' + styleID + '["' + category + '"] = !categories' + styleID + '["' + category + '"]}} class="sidebar-category-' + styleID + '">' + category + arrow + '</li>\n' + 
                            '<ul class="sidebar-category-items-'+ styleID + '" class:rotate-' + styleID + '={categories' + styleID + '["' + category + '"]}>' + dom + '</ul>\n'
                        )
                    })

                    // Define category dropdown control object.
                    let categoryControlObject = {};
                    categories.forEach((category) => {
                        categoryControlObject[category] = false;
                    })
                    
                    // Stick that in the file.
                    addRoutes = addRoutes.replace('</script>', 'let categories' + styleID + ' = ' + JSON.stringify(categoryControlObject) + ';\n' +
                        '$: console.log(categories' + styleID + ');\nimport { location } from "svelte-spa-router";\n</script>'
                    )

                    // Dev stuff.
                    // console.log(JSON.stringify(categoryControlObject));

                    // Let the categories be rendered to HTML in their own wrapper.
                    let rendered = '';
                    categoryRender.forEach((category) => {
                        rendered += '<li class="sidebar-category-li-' + styleID + '"><ul class="sidebar-category-wrapper-' + styleID + '">' + category + '</ul></li>';
                    })
                    
                    let navbarRendered = ''

                    if (actualOpts.hasNavbar) {
                        let navbarLinks = '';
                        config.navbarLinks.forEach((navLink) => {
                            const linkRoute = has(navLink, 'route') ? navLink.route : navLink;
                            const linkName = has(navLink, 'label') ? navLink.label : navLink;
                            navbarLinks += '<a href="/#/docs/' + linkRoute + '" class="' + withID('navbar-link') + '">' + linkName + '</a>'
                        })

                        let navbarBrand = '<h1 class="' + withID('navbar-brand') + '">' + config.navbarBrand + '</h1>'
                        
                        navbarRendered = '<nav style="--bgColor:{"' + actualOpts.colors.background + '"}; --textColor:{"' + actualOpts.colors.text + '"}; --textHoverColor:{"' + actualOpts.colors.hover + '"}; --sidebarWidth:{"' + actualOpts.sidebarOptions.width + '"};" class="' + withID('navbar') + '">' + '<div class="' + withID('navbar-content') + '">' + navbarBrand + navbarLinks + "</div></nav>";
                    }
                    

                    // New file code, adds all of our HTML.
                    const addSidebar = addRoutes.replace('<main',
                        navbarRendered +
                        '<div class="' + withID('sidebar-wrapper') + '" style="--bgColor:{"' + actualOpts.colors.background + '"}; --textColor:{"' + actualOpts.colors.text + '"}; --textHoverColor:{"' + actualOpts.colors.hover + '"}; --sidebarWidth:{"' + actualOpts.sidebarOptions.width + '"};">\n' 
                        + '<div class="' + withID('sidebar') + '">' + '<ul class="' + withID('sidebar-content') + '">' +
                        rendered +
                        '</ul>\n</div>\n<div class="' + withID('content') + '">\n<main'
                    )

                    // Finishes the sidebar. TODO: use much better RegEx
                    const endSidebar = addSidebar.replace('</main>', '</main>\n</div>\n</div>\n')

                    // Styles for the sidebar. Will extract these sometime...
                    const sidebarStyles = {
                        ".sidebar-wrapper": [
                            "width: 100%",
                            "display: flex",
                            "overflow: hidden",
                            "text-rendering: geometricprecision"
                        ],
                        ".sidebar": [
                            "color: var(--textColor)",
                            "width: var(--sidebarWidth)",
                            "height: 100vh",
                            "position: fixed",
                            "top: 0",
                            "left: 0",
                            "background-color: var(--bgColor)",
                            "border-right: 1px solid black"
                        ],
                        ".sidebar-content": [
                            "width: auto",
                            "display: flex",
                            "margin: 8px",
                            "margin-top: 80px",
                            "flex-direction: column",
                            "align-items: flex-start",
                            "list-style-type: none",
                            "padding: 0px"
                        ],
                        ".sidebar-category": [
                            "text-decoration: none",
                            "font-size: 18px",
                            "font-weight: 500",
                            "width: auto",
                            "margin-bottom: 0px",
                            "cursor: pointer",
                            "display: flex",
                            "border-radius: .25rem",
                            "height: 32px",
                            "justify-content: space-between",
                            "align-items: center",
                            "list-style-type: none",
                            "padding: 6px 16px",
                        ],
                        ".sidebar-category:hover": [
                            "background-color: #ebedf0"
                        ],
                        ".sidebar-category-li": [
                            "width: 100%"
                        ],
                        ".sidebar-category-wrapper": [
                            "margin-bottom: 4px",
                            "width: 100%",
                            "list-style-type: none",
                            "padding: 0px",
                        ],
                        ".sidebar-category-items": [
                            "margin-left: 16px",
                            "display: none",
                            "list-style-type: none",
                            "padding: 0px",
                        ],
                        ".sidebar-category-item-li": [
                            "list-style-type: none",
                            "display: block",
                            "width: auto",
                        ],
                        ".sidebar-category-item:hover": [
                            "background-color: #ebedf0"
                        ],
                        ".active": [
                            "background-color: #ebedf0"
                        ],
                        ".sidebar-category-item": [
                            "border-radius: .25rem",
                            "padding: 6px 16px",
                            "color: var(--textColor)",
                            "margin: 0.25rem 0",
                            "font-size: 16px",
                            "text-decoration: none",
                            "display: block"
                        ],
                        ".content": [
                            "flex-grow: 1",
                            "margin-left: calc(var(--sidebarWidth) + 10px)",
                            "overflow: auto",
                            "margin-top: 25px"
                        ],
                        ".arrow": [
                            "float: right",
                            "margin-right: 8px",
                            "width: 32px",
                            "height: 32px",
                            "transform: rotate(90deg)",
                            "transition: transform .2s linear"
                        ],
                        ".rotate": [
                            "transform: rotate(180deg)"
                        ],
                        "ul.rotate": [
                            "display: block",
                            "transform: none"
                        ],
                        ".navbar": [
                            "display: flex",
                            "flex-direction: row",
                            "width: auto",
                            "height: 60px",
                            "padding: 8px 16px",
                            "border-bottom: 1px solid black",
                            "position: sticky",
                            "top: 0",
                            "z-index: 1000",
                            "background: var(--bgColor)"
                        ],
                        ".navbar-brand": [
                            "margin: 0px",
                            "padding: 0px",
                            "margin-right: 1rem"
                        ],
                        ".navbar-content": [
                            "margin: 0px",
                            "padding: 0px",
                            "width: auto",
                            "display: flex",
                            "align-items: center",
                            "flex: 1 1 0"
                        ],
                        ".navbar-link": [
                            "margin: 0px",
                            "padding: 4px 16px",
                            "text-decoration: none",
                            "color: var(--textColor)"
                        ]
                    }

                    // Make all the styles into actual CSS, injected into Svelte, so it handles some locality.
                    const renderedStyle = Object.keys(sidebarStyles).map((key) => {
                        const pseudo = key.split(':').length !== 1 ? ':' + key.split(':')[1] : '';
                        return (
                            key.split(':')[0] + '-' + styleID + pseudo + '{' + sidebarStyles[key].join(';') + '}'
                        )
                    })

                    // Put them all together!
                    addRoutes = endSidebar.replace('</style>',
                        renderedStyle.join('') + '</style>\n'
                    )
                }

                // Tell the user if their App.svelte was edited properly.
                console.log("\u001b[1;32m" + actualOpts.docPath + " routes defined successfully");

                // console.log(addRoutes)

                return {
                    code: addRoutes,
                    map: null
                }
            }
            // Process the file if it is a MDsveX file.
            if (fileName.includes(actualOpts.mdxvexOptions.extensions)) {

                // Parse the frontmatter.
                const metadata = matter(code).data;
                let res = await mdsvex.compile(code, actualOpts.mdxvexOptions);
                let headScript;

                // Give the page a title.
                if (has(metadata, 'title')) {
                    headScript = "    import { onDestroy } from 'svelte';\n    const prevTitle = document.title;\n    document.title = '" + metadata.title + "';\n    onDestroy(() => {document.title = prevTitle;});\n";
                } else {
                    headScript = "    import { onDestroy } from 'svelte';\n    const prevTitle = document.title;\n    document.title = '" + fileName.split('.')[0] + "';\n    onDestroy(() => {document.title = prevTitle;});\n";
                }

                // Regex for making sure we don't override user code with our injections.
                if (res.code.search(/<script(?!.*module).*>/ig) !== -1) {
                    if (res.code.includes("onDestroy(() => {")) {
                        headScript = headScript.replace("    import { onDestroy } from 'svelte';\n    ", '');
                        headScript = headScript.replace("});\n", '');
                        res.code = res.code.replace('onDestroy(() => {', headScript)
                    } else {
                        res.code = res.code.replace(/<script(?!.*module).*>/ig, '<script>\n' + headScript);
                    }
                } else {
                    res.code = '<script>\n' + headScript + '</script>\n' + res.code;
                }
                
                // Tell the user they got their .md files parsed correctly.
                console.log("\u001b[0;32m" + fileName + " parsed successfully");

                return {
                    code: res.code,
                    map: null
                };
            }
            return;
            
        },
        
    }
}

module.exports = mdsvexPages;