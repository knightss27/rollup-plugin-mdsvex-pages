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
        appName: 'App.svelte',
        docPath: 'docs',
        hasSidebar: false,
        mdxvexOptions: {
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


                if (actualOpts.hasSidebar) { 
                    const styleID = Date.now();
                    const sidebarJSON = JSON.parse(fs.readFileSync(path.resolve('src', 'sidebars.json')).toString());
                    const categories = Object.keys(sidebarJSON.docs);
                    const categoryRender = categories.map((category) => {
                        
                        const pages = sidebarJSON.docs[category];
                        let dom = '';
                        
                        pages.forEach((page) => {
                            dom += '<div>' + page + '</div>\n'
                        })

                        return (
                            '<div>' + category + '</div>\n' + dom
                        )
                    })

                    let rendered = '';
                    categoryRender.forEach((category) => {
                        rendered += category;
                    })

                    const addSidebar = addRoutes.replace('<main', 
                        '<div class="sidebar-wrapper-' + styleID + '" style="--bgColor:{\'black\'}; --textColor:{\'white\'}; --sidebarWidth:{\'300px\'};">\n' 
                        + '<div class="sidebar-' + styleID + '">' +
                        rendered +
                        '</div>\n<div class="content-' + styleID + '">\n<main'
                    )

                    const endSidebar = addSidebar.replace('</main>', '</main>\n</div>\n</div>\n')

                    addRoutes = endSidebar.replace('</style>',
                        '.sidebar-wrapper-' + styleID + ' {width: 100%; display: flex; overflow: hidden;}\n' +
                        '.sidebar-' + styleID + ' {color: var(--textColor); width: 300px; height: 100vh; position: fixed; top: 0; left: 0; background-color: var(--bgColor);}\n' +
                        '.content-' + styleID + ' {flex-grow: 1; margin-left: calc(var(--sidebarWidth) + 10px); overflow: auto;}\n' +
                        '</style>'
                    )
                }

                // console.log(addRoutes);

                return {
                    code: addRoutes,
                    map: null
                }
            }
            // Process the file if it is a MDsveX file.
            if (fileName.includes(actualOpts.mdxvexOptions.extensions)) {
                const metadata = matter(code).data;
                let res = await mdsvex.compile(code, actualOpts.mdxvexOptions);
                let headScript;

                // Give the page a title.
                if (has(metadata, 'title')) {
                    headScript = "    import { onDestroy } from 'svelte';\n    const prevTitle = document.title;\n    document.title = '" + metadata.title + "';\n    onDestroy(() => {document.title = prevTitle;});\n";
                } else {
                    headScript = "    import { onDestroy } from 'svelte';\n    const prevTitle = document.title;\n    document.title = '" + fileName.split('.')[0] + "';\n    onDestroy(() => {document.title = prevTitle;});\n";
                }

                if (res.code.includes('<script>')) {
                    if (res.code.includes("onDestroy(() => {")) {
                        headScript = headScript.replace("    import { onDestroy } from 'svelte';\n    ", '');
                        headScript = headScript.replace("});\n", '');
                        res.code = res.code.replace('onDestroy(() => {', headScript)
                    } else {
                        res.code = res.code.replace('<script>', '<script>\n' + headScript);
                    }
                } else {
                    res.code = '<script>\n' + headScript + '</script>\n' + res.code;
                }
                
                // console.log(res.code);

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