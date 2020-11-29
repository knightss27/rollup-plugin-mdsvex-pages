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
                const addRoutes = newValue.replace('</script>', 
                    routes + '</script>'
                );

                return {
                    code: addRoutes,
                    map: null
                }
            }
            // Process the file if it is a MDsveX file.
            if (fileName.includes(actualOpts.mdxvexOptions.extensions)) {
                const metadata = matter(code).data;
                let res = await mdsvex.compile(code, actualOpts.mdxvexOptions);

                // Give the page a title.
                if (has(metadata, 'title')) {
                    res.code = "<svelte:head><title>" + metadata.title + "</title></svelte:head> \n" + res.code;
                } else {
                    res.code = "<svelte:head><title>" + fileName.split('.')[0] + "</title></svelte:head> \n" + res.code;
                }

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