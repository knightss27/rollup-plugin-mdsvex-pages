<script>
    let sidebar = {};
    let categories = {};
    import { location } from 'svelte-spa-router'

    Object.keys(sidebar).forEach((route) => {
        Object.keys(sidebar[route]).forEach((category) => {
            sidebar[route][category] = {
                items: sidebar[route][category],
                open: false,
            }
        })
    })
</script>

{#each Object.keys(sidebar) as route}
    {#if $location.includes(route)}
        <div class="sidebar">
            <ul class="sidebar-content">
                {#each Object.keys(sidebar[route]) as category}
                    <li class="sidebar-category-li">
                        <ul class="sidebar-category-wrapper">
                            <li on:click={() => {sidebar[route][category].open = !sidebar[route][category].open}} class="sidebar-category">
                                {category}
                                <span class="arrow" class:rotate={sidebar[route][category].open}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24"><path fill="rgba(0,0,0,0.5)" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path></svg>
                                </span>
                            </li>
                            <ul class="sidebar-category-items" class:rotate={sidebar[route][category].open}>
                            {#each sidebar[route][category].items as link}
                                <li class="sidebar-category-item-li">
                                    <a class:active={$location.includes(link.route)} class="sidebar-category-item" href={'/#/' + route + '/' + link.route}>{link.label}</a>
                                </li>
                            {/each}
                            </ul>
                        </ul>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
{/each}


<style>
    .sidebar {
        color: var(--mdp-text-color);
        width: var(--mdp-sidebar-width);
        height: 100vh;
        position: fixed;
        top: var(--mdp-sidebar-margin-top);
        left: 0;
        background-color: var(--mdp-background-color);
        border-right: var(--mdp-sidebar-border);
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

