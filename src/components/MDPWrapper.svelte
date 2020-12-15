<script>
    import MDPNavbar from './MDPNavbar.svelte'
    import MDPSidebar from './MDPSidebar.svelte'
    export let sidebar = true;
    export let navbar = true;

    export let styles = {};
    const defaultStyles = {
        'sidebar-width': '300px',
        'navbar-height': '60px',
        'background-color': 'white',
        'text-color': 'black',
        'sidebar-active': '#ebedf0',
        'sidebar-hover': '#ebedf0',
        'sidebar-border': '1px solid #dadde1',
        'navbar-border': 'none',
        'navbar-box-shadow': '0px 1px #dadde1',
        'sidebar-margin-top': navbar ? '60px' : '0px',
        'sidebar-content-margin-top': '12px',
        'content-sidebar-padding': '15px',
        'sidebar-breakpoint': '900px',
    }

    // Check if the object has a property.
    function has(obj, propName) {
        return Object.prototype.hasOwnProperty.call(obj, propName)
    }

    // Compare both changed and default options to return one object with what is needed.
    function getStyles(opts) {
        var options = {};
  
        for (var opt in defaultStyles)
            { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultStyles[opt]; }

        return options
    }

    let actualStyles = getStyles(styles);

    Object.keys(actualStyles).forEach((style) => {
        document.documentElement.style.setProperty('--mdp-' + style, actualStyles[style]);
    })

    let screenWidth;
    let breakpoint = Number.parseInt(actualStyles['sidebar-breakpoint'].replace(/px/g, ''));
    let sidebarWidth = actualStyles['sidebar-width'].includes('px') ? Number.parseInt(actualStyles['sidebar-width'].replace(/px/g, '')) : null;

</script>

<svelte:window bind:innerWidth={screenWidth}/>

{#if navbar}
<MDPNavbar />
{/if}

<div class="mdp-wrapper" class:condensed={sidebarWidth == null ? false : screenWidth <= breakpoint + sidebarWidth}>
    {#if sidebar}
        <MDPSidebar condensed={sidebarWidth == null ? false : screenWidth <= breakpoint + sidebarWidth} />
    {/if}
    <div class="content" class:condensed={sidebarWidth == null ? false : screenWidth <= breakpoint + sidebarWidth}>
        <slot></slot>
    </div>
</div>

<style>
    .content {
        flex-grow: 1;
        margin-left: calc(var(--mdp-content-sidebar-padding));
        overflow: auto;
        margin-top: 25px;
    }
    .content.condensed {
        max-width: calc(100% - var(--mdp-content-sidebar-padding));
    }
    .mdp-wrapper {
        max-width: 100%;
        display: flex;
        text-rendering: geometricprecision;
    }
    .mdp-wrapper.condensed {
        flex-direction: column;
        align-items: center;
    }
</style>