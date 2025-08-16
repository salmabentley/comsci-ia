class Stock extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const name = this.getAttribute("name") || "";
        const category = this.getAttribute("category") || "";
        const quantity = this.getAttribute("quantity") || "";
        const color = this.getAttribute("color") || "#000";
        this.innerHTML = `
                <style>
                    .stock-container {
                        text-align: left;
                        border-radius: 10px;
                        background-color: #D9D9D9;
                        margin: 2% 0;
                        display: flex;
                        align-items: center;
                        color: black;
                        cursor: pointer;
                        transition: 0.2s;
                    }

                    .stock-container:hover {
                        background-color: #acaaaa;
                    }

                    .stock-container:hover h4 {
                        border-right: 2px solid #D9D9D9
                    }

                    /* LABELS  */

                    .stock-name {
                        width: 45%;
                    }

                    .stock-category {
                        width: 45%;
                    }

                    .stock-container h4{
                        border-right: 2px solid #B1ADAD;
                        margin: 1%;
                        padding: 1%;
                    }
                    .stock-quantity {
                        width: 15%;
                        border-right: none !important;
                        text-align: center !important;
                    }
                </style>
                <div class="stock-container">
                    <h4 class="stock-name">${name}</h4>
                    <h4 class="stock-category">${category}</h4>
                    <h4 class="stock-quantity" style="color:${color}">${quantity}</h4>
                </div>

        `


}
}
customElements.define('stock-card', Stock);