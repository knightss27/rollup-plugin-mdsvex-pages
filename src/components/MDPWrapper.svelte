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

</script>

{#if navbar}
<MDPNavbar />
{/if}

<div class="mdp-wrapper">
    {#if sidebar}
        <MDPSidebar />
    {/if}
    <div class="content">
        <slot></slot>
    </div>
</div>

<style>
    .content {
        flex-grow: 1;
        margin-left: calc(var(--mdp-sidebar-width) + var(--mdp-content-sidebar-padding));
        overflow: auto;
        margin-top: 25px;
    }
    .mdp-wrapper {
        width: 100%;
        display: flex;
        overflow: hidden;
        text-rendering: geometricprecision;
    }
</style>