<script>

    let sidebar = {};
    import { location } from 'svelte-spa-router'
    import { beforeUpdate } from 'svelte';

    Object.keys(sidebar).forEach((route) => {
        Object.keys(sidebar[route]).forEach((category) => {
            if (category !== 'default-open') {
                    sidebar[route][category] = {
                    items: sidebar[route][category],
                    open: sidebar[route]['default-open'].includes(category),
                }
            }
        })
    })

    export let condensed = false;
    let condensedRef = condensed;

    const setAllClosed = () => {
        Object.keys(sidebar).forEach((route) => {
            Object.keys(sidebar[route]).forEach((category) => {
                if (category !== 'default-open') {
                    if(sidebar[route][category].open) {
                        sidebar[route][category].open = false;
                    }
                }
            })
        })
    }

    const setAllDefaults = () => {
        Object.keys(sidebar).forEach((route) => {
            Object.keys(sidebar[route]).forEach((category) => {
                if (category !== 'default-open') {
                    sidebar[route][category].open = sidebar[route]['default-open'].includes(category);
                }
            })
        })
    }

    beforeUpdate(() => {
        if (!condensedRef && condensed) {
            setAllClosed();
        } else if (condensedRef && !condensed) {
            setAllDefaults();
        }
        condensedRef = condensed;
    })

    const routes = Object.keys(sidebar);
    $: current = routes.indexOf($location.split('/')[1]);

</script>

{#if current !== -1}
    <div class="sidebar" class:condensed>
        <ul class="sidebar-content">
            {#each Object.keys(sidebar[routes[current]]) as category}
                {#if category !== 'default-open'}
                <li class="sidebar-category-li">
                    <ul class="sidebar-category-wrapper">
                        <li on:click={() => {sidebar[routes[current]][category].open = !sidebar[routes[current]][category].open}} class="sidebar-category">
                            {category}
                            <span class="arrow" class:rotate={sidebar[routes[current]][category].open}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path></svg>
                            </span>
                        </li>
                        <ul class="sidebar-category-items" class:rotate={sidebar[routes[current]][category].open}>
                        {#each sidebar[routes[current]][category].items as link}
                            <li class="sidebar-category-item-li" on:click={() => {condensed ? sidebar[routes[current]][category].open = !sidebar[routes[current]][category].open : null}}>
                                <a class:active={link.route == "" ? $location.replace(/\//g, '') == routes[current] : $location.includes(link.route)} class="sidebar-category-item" href={'/#/' + routes[current] + '/' + link.route}>{link.label}</a>
                            </li>
                        {/each}
                        </ul>
                    </ul>
                </li>
                {/if}
            {/each}
        </ul>
    </div>
{/if}


<style>
    .sidebar {
        color: var(--mdp-text-color);
        min-width: var(--mdp-sidebar-width);
        height: 100vh;
        position: -webkit-sticky;
        position: sticky;
        top: 0;
        left: 0;
        background-color: var(--mdp-background-color);
        border-right: var(--mdp-sidebar-border);
        margin-right: calc(var(--mdp-content-sidebar-padding));
    }
    .sidebar.condensed {
        min-width: 100%;
        height: auto;
        border-right: none;
        border-bottom: var(--mdp-sidebar-border);
    }
    .sidebar-content {
        width: auto;
        display: flex;
        margin: 8px;
        flex-direction: column;
        align-items: flex-start;
        list-style-type: none;
        padding: 0px;
        margin-top: var(--mdp-sidebar-content-margin-top);
    }
    .sidebar-category {
        text-decoration: none;
        font-size: 18px;
        font-weight: 500;
        width: auto;
        margin-bottom: 0px;
        cursor: pointer;
        display: flex;
        border-radius: .25rem;
        height: 32px;
        justify-content: space-between;
        align-items: center;
        list-style-type: none;
        padding: 6px 16px;
    }
    .sidebar-category:hover {
        background-color: var(--mdp-sidebar-hover);
    }
    .sidebar-category-li {
        width: 100%;
    }
    .sidebar-category-wrapper {
        margin-bottom:4px;
        width:100%;
        list-style-type:none;
        padding:0px;
    }
    .sidebar-category-items {
        margin-left:16px;
        display:none;
        list-style-type:none;
        padding:0px;
    }
    .sidebar-category-item-li {
        list-style-type:none;
        display:block;
        width:auto;
    }
    .sidebar-category-item {
        border-radius: .25rem;
        padding: 6px 16px;
        color: var(--mdp-text-color);
        margin: 0.25rem 0;
        font-size: 16px;
        text-decoration: none;
        display: block;
    }
    .sidebar-category-item:hover {
        background-color: var(--mdp-sidebar-hover);
    }
    .active {
        background-color: var(--mdp-sidebar-active);
    }
    .arrow {
        fill: var(--mdp-text-color);
        float:right;
        margin-right:8px;
        width:32px;
        height:32px;
        transform:rotate(90deg);
        transition:transform .2s linear;
    }
    .rotate {
        transform:rotate(180deg);
    }
    ul.rotate {
        display:block;
        transform:none;
    }
</style>

