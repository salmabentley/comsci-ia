class Nav extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
                <style>
                    nav {
                        width: 100%;
                        height: 1vh;
                        background-color: black;
                        position: fixed;
                        top: 0;
                        padding: 2%;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        color: white;
                        text-align: center;
                    }

                    nav h1{
                        margin: 0;
                        cursor: pointer;
                    }

                    nav div {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        float: right;
                        width: 40%;
                    }
                    nav div a {
                        text-decoration: none;
                        margin: 0 3%;
                        color: white;
                        transition: 0.2s;
                    }
                    nav div a:hover, nav .active {
                        font-weight: bold;
                        text-shadow: 1px 1px 20px white;
                    }

                </style>
                <nav>
                    <h1>LOST IDLES</h1>
                    <div id="links">
                        <a href="/">Dashboard</a>
                        <a href="/stock">Stock</a>
                        <a href="/orders">Orders</a>
                        <a href="/analytics">Analytics</a>
                        <a href='/predict-sales'>Predictions</a>
                        <a href="/logout">Logout</a>
                    </div>
                </nav>
        `
        document.addEventListener('DOMContentLoaded', () => {
            const nav = document.getElementById('links');
            const links = nav.getElementsByTagName('a');

            for (var link of links) {
                if (link.href == window.location.href) {
                    link.className = 'active';
                }
            }
        })
    }
}

customElements.define('nav-bar', Nav);