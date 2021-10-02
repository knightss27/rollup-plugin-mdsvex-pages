'use strict'; // v1.2.19

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
        paths: ['docs'], // Path to the folder(s) where all the .md files are.
        mdsvexOptions: { // Extensions you want MDsveX to parse.
            extensions: ['.md'],
        }
    }

    // Check if the object has a property.
    function has(obj, propName) {
        return Object.prototype.hasOwnProperty.call(obj, propName)
    }

    // Compare both changed and default options to return one object with what is needed.
    // I'm open to any options, even if they're not in my default :).
    function getOptions(opts) {
        var options = {};
  
        for (var opt in defaultOptions)
            { options[opt] = opts 
                && has(opts, opt) ? 
                opts[opt] : 
                defaultOptions[opt]; 
            }

        return options
    }

    // Import changed and default options.
    const actualOpts = getOptions(options);

    // const config = require(path.resolve('src', 'mdp.config.js'));

    // Pages stores a list of pages with id, title, subtitle, and date
    let pages = {};

    return {
        name: 'mdsvex-pages',
        async transform(code, id) {

            // Access the config file, if it actually exists.
            let configFile;
            try {
                configFile = fs.readFileSync(path.resolve('src', 'mdp.config.json'));
                configFile = JSON.parse(configFile);
            } catch (err) {
                if (err == 'ENOENT') {
                    configFile = {};
                } else if (err instanceof SyntaxError) {
                    console.error("\u001b[1;31m" + '<-- Invalid JSON formatting in your mdp.config.json -->');
                    throw err;
                } else {
                    throw err;
                }
                
            }

            const config = configFile;
            this.addWatchFile(path.resolve('src', 'mdp.config.json'));

            // Establish path and filename for later usage.
            const fileName = path.win32.basename(id);

            // Warn you for not setting up the config!
            if (fileName == 'MDPWrapper.svelte' && configFile == '{}') {
                console.warn("If you are using the Wrapper component, please make sure to set up your mdp.config.json!")
            }

            // Pass the navbar config
            if (fileName == 'MDPNavbar.svelte') {
                code = code.replace('let navbar = {};', 
                'let navbar = ' + JSON.stringify(config.navbar) + ';\n'
                )
                return {
                    code,
                    map: null
                }
            }

            // Pass the sidebar config
            if (fileName == 'MDPSidebar.svelte') {           
                code = code.replace('let sidebar = {};', 
                'let sidebar = ' + JSON.stringify(config.sidebar) + ';\n'
                )
                return {
                    code,
                    map: null
                }
            }

            // Only edit the main App.svelte file
            if (fileName == actualOpts.appName) {
                
                let addRoutes = code;
                actualOpts.paths.forEach((docPath) => {
                    // console.log(docPath, 'DOCPATH')
                    
                    // Establish imports string and locations of .md files.
                    let imports = '';
                    
                    const files = fs.readdirSync(path.resolve('src',docPath))

                    // Make style id, so you can't anticipate the names / overwrite them with globals.
                    const styleID = Date.now().toString().slice(-4);
                    // const withID = (className) => {return className+'-'+styleID}

                    // Create the routes string for adding to svelte-spa-router.
                    let routes = '';
                    
                    // Add imports and routes for all .md files.
                    files.forEach(function (file, index) {
                        let name = path.parse(file).name.replace(/-/g, '');
                        let componentName = name + docPath;

                        const metadata = matter(fs.readFileSync(path.resolve('src', docPath, file))).data
                        
                        imports += "import " + componentName + " from './" + docPath + "/" + file + "'; \n";

                        if (has(metadata, 'id') && metadata.id !== name) {
                            name = metadata.id;
                            if (name === ".") {
                                name = "";
                            }
                        }
                        
                        if (code.includes('const routes = {')) {
                            routes += "'/" + docPath + "/" + name + "': " + componentName + ",\n"
                        } else {
                            routes += "routes.set('/" + docPath + "/" + name + "', " + componentName + ");\n" 
                        }
                    })

                    // Add those imports.
                    const newValue = addRoutes.replace(/<script.*(?=>)/g, (match) => {
                        return (
                            `${match}>\n//--mdLoader-- \n` + imports + '//--mdLoader--'
                        )
                    });

                    // Add those set routes.
                    if (code.includes('const routes = {')) {
                        // console.log('USING OLD ROUTER')
                        addRoutes = newValue.replace('const routes = {', 
                            'const routes = {\n' + routes
                        );
                    } else {
                        addRoutes = newValue.replace('</script>', 
                            routes + '</script>'
                        );
                    }

                    // Tell the user if their App.svelte was edited properly.
                    console.log("\u001b[1;32m" + docPath + " routes defined successfully");
                })

                return {
                    code: addRoutes,
                    map: null
                }
            }
            // Process the file if it is a MDsveX file.
            if (fileName.includes(actualOpts.mdsvexOptions.extensions)) {
                
                // Add this file to watch so you can hot-reload your markdown files
                this.addWatchFile(path.resolve(fileName));

                // Parse the frontmatter.
                const metadata = matter(code).data;

                // Add pages entry
                pages[metadata.id] = {
                    id: metadata.id,
                    title: metadata.title,
                    subtitle: metadata.subtitle,
                    date: metadata.date
                }

                let res = await mdsvex.compile(code, actualOpts.mdsvexOptions);
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

            // Write pages to file
            fs.writeFile("src/mdp-meta.js", `// This file is autogenerated by rollup-plugin-mdsvex-pages and should not be edited manually.\nexport let pages = ${JSON.stringify(pages)};`, err => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        },
    }
}

module.exports = mdsvexPages;
