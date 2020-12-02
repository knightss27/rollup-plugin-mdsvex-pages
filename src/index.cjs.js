'use strict';

const fs = require('fs');
const path = require('path');
const mdsvex = require('mdsvex');
const matter = require('gray-matter');

function mdsvexPages(options) {
    
    // Make sure options is an empty object if left untouched.
    if ( options === void 0 ) options = {};

    // Default options for the plugin.
    const defaultOptions = {
        appName: 'App.svelte', // Path or filename of your main file with the Router component.
        docPath: 'docs', // Path to the folder where all the .md files are.
        hasSidebar: false, // I think this is pretty explanatory...
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
            extensions: ['.md']
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

                    // Start by parsing the sidebars.json file.
                    const sidebarJSON = JSON.parse(fs.readFileSync(path.resolve('src', 'sidebars.json')).toString());
                    const categories = Object.keys(sidebarJSON.docs);

                    // Arrow SVG for the dropdowns.
                    const arrowSVG = '<svg shape-rendering="geometricPrecision" width="24" height="24" viewBox="0 0 25 25"><path fill="' + actualOpts.colors.text + '" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>'
                    
                    // Define the categories.
                    const categoryRender = categories.map((category) => {
                        
                        const pages = sidebarJSON.docs[category];
                        let dom = '';
                        
                        pages.forEach((page) => {
                            const pageRoute = has(page, 'route') ? page.route : page;
                            const pageName = has(page, 'label') ? page.label : page;
                            dom += '<a href="/#/docs/' + pageRoute + '" class="sidebar-category-item-'+ styleID + '">' + pageName + '</a>\n'
                        })
                        
                        const arrow  = '<span class:rotate-' + styleID + '={categories' + styleID + '["' + category + '"]} class="arrow-' + styleID + '">' + arrowSVG + '</span>'

                        return (
                            '<div on:click={() => {categories' + styleID + '["' + category + '"] = !categories' + styleID + '["' + category + '"]}} class="sidebar-category-' + styleID + '">' + category + arrow + '</div>\n' + 
                            '<div class="sidebar-category-items-'+ styleID + '" class:rotate-' + styleID + '={categories' + styleID + '["' + category + '"]}>' + dom + '</div>\n'
                        )
                    })

                    // Define category dropdown control object.
                    let categoryControlObject = {};
                    categories.forEach((category) => {
                        categoryControlObject[category] = false;
                    })
                    
                    // Stick that in the file.
                    addRoutes = addRoutes.replace('</script>', 'let categories' + styleID + ' = ' + JSON.stringify(categoryControlObject) + ';\n' +
                        '$: console.log(categories' + styleID + ');\n</script>'
                    )

                    // Dev stuff.
                    // console.log(JSON.stringify(categoryControlObject));

                    // Let the categories be rendered to HTML in their own wrapper.
                    let rendered = '';
                    categoryRender.forEach((category) => {
                        rendered += '<div class="sidebar-category-wrapper-' + styleID + '">' + category + '</div>';
                    })

                    // New file code, adds all of our HTML.
                    const addSidebar = addRoutes.replace('<main', 
                        '<div class="sidebar-wrapper-' + styleID + '" style="--bgColor:{"' + actualOpts.colors.background + '"}; --textColor:{"' + actualOpts.colors.text + '"}; --sidebarWidth:{"' + actualOpts.sidebarOptions.width + '"};">\n' 
                        + '<div class="sidebar-' + styleID + '">' + '<div class="sidebar-content-' + styleID + '">' +
                        rendered +
                        '</div>\n</div>\n<div class="content-' + styleID + '">\n<main'
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
                            "background-color: var(--bgColor)"
                        ],
                        ".sidebar-content": [
                            "width: auto",
                            "display: flex",
                            "margin: 30px",
                            "margin-top: 80px",
                            "margin-left: 20px",
                            "flex-direction: column",
                            "align-items: flex-start",
                            "padding-top: 20px",
                            "padding-left: 10px",
                            "border-top: 1px solid gray"
                        ],
                        ".sidebar-category": [
                            "text-decoration: none",
                            "font-size: 18px",
                            "line-height: 1.2rem",
                            "font-weight: 500",
                            "width: 240px",
                            "margin-bottom: 8px",
                            "cursor: pointer"
                        ],
                        ".sidebar-category-wrapper": [
                            "margin-bottom: 16px",
                        ],
                        ".sidebar-category-items": [
                            "margin-left: 15px",
                            "flex-direction: column",
                            "display: none"
                        ],
                        ".sidebar-category-item": [
                            "padding: 4px 0px",
                            "text-decoration: none",
                            "color: var(--textColor)",

                        ],
                        ".content": [
                            "flex-grow: 1",
                            "margin-left: calc(var(--sidebarWidth) + 10px)",
                            "overflow: auto"
                        ],
                        ".arrow": [
                            "float: right",
                            "margin-right: 8px",
                            "margin-top: -2px",
                            "transform: rotate(90deg)",
                            "transition: transform .2s linear"
                        ],
                        ".rotate": [
                            "transform: rotate(180deg)"
                        ],
                        "div.rotate": [
                            "display: flex",
                            "transform: none"
                        ]
                    }

                    // Make all the styles into actual CSS, injected into Svelte, so it handles some locality.
                    const renderedStyle = Object.keys(sidebarStyles).map((key) => {
                        return (
                            key + '-' + styleID + '{' + sidebarStyles[key].join(';') + '}'
                        )
                    })

                    // Put them all together!
                    addRoutes = endSidebar.replace('</style>',
                        renderedStyle.join('') + '</style>\n'
                    )
                }

                // Tell the user if their App.svelte was edited properly.
                console.log("\u001b[1;32m" + actualOpts.docPath + " routes defined successfully");

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