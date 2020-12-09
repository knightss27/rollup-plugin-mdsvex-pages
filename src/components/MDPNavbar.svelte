<script>
    let navbar = {};
    import { location } from 'svelte-spa-router'

</script>

{#each Object.keys(navbar) as route}
    {#if $location.includes(route)}
        <nav class="navbar">
            <div class="navbar-content">
                <div class="navbar-brand">
                    {#if Object.keys(navbar[route]).includes('logo')}
                    <img class="navbar-logo" alt={navbar[route].logo.alt} src={navbar[route].logo.src}/>
                    {/if}
                    {navbar[route].title}
                </div>
                {#each navbar[route].navbarLinks as link}
                    <a href={'/#/' + route + '/' + link.route} class="navbar-link">{link.label}</a>
                {/each}
            </div>
        </nav>
    {/if}
{/each}


<style>
    .navbar {
        display: flex;
        flex-direction: row;
        width: auto;
        min-height: var(--mdp-navbar-height);
        padding: 8px 16px;
        border-bottom: var(--mdp-navbar-border);
        box-shadow: var(--mdp-navbar-box-shadow);
        position: sticky;
        top: 0;
        background: var(--mdp-background-color);
        z-index: 1000;
    }
    .navbar-brand {
        margin: 0px;
        padding: 0px;
        margin-right: 1rem;
        font-size: 2rem;
        font-weight: bold;
        font-size: x-large;
        display: flex;
        align-items: center;
        height: 2rem;
    }
    .navbar-logo {
        display: block;
        margin-right: .5rem;
        height: 100%;
    }
    .navbar-content {
        margin: 0px;
        padding: 0px;
        width: auto;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        flex: 1 1 0;
    }
    .navbar-link { 
        margin: 0px;
        padding: 4px 12px;
        text-decoration: none;
        color: var(--mdp-text-color);
    }
</style>

