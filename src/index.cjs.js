'use strict';

const fs = require('fs');
const mdsvex = require('mdsvex');

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
            const path = id.split(`\\`);
            const fileName = path[path.length - 1];
            
            // Import changed and default options.
            const actualOpts = getOptions(options);

            // Only edit the main App.svelte file
            if (fileName == actualOpts.appName) {
                
                // Establish imports string and locations of .md files.
                let imports = '';
                const files = fs.readdirSync('./src/' + actualOpts.docPath)
                
                // Add imports for all .md files.
                files.forEach(function (file, index) {
                    const name = file.replace('.md', '');
                    imports += "import " + name + " from './" + actualOpts.docPath + "/" + file + "'; \n "; 
                })

                // Create the routes string for adding to svelte-spa-router.
                let routes = '';

                // Fill the routes string with paths for all .md files.
                files.forEach(function (file, index) {
                    const name = file.replace('.md', '');
                    routes += "routes.set('/" + actualOpts.docPath + "/" + name + "', " + name + ");\n" 
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
            if (fileName.includes(actualOpts.mdxvexOptions.extensions)) {
                const res = await mdsvex.compile(code, actualOpts.mdxvexOptions);
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