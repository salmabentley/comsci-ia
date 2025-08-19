class Order extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // const orderAttribute = this.getAttribute('order')
        const order = JSON.parse(this.dataset.order)
        const order_id=order.order_id
        console.log(order_id)
        const total = order.total;
        const items = order.items;
        this.innerHTML = `
            <style>
            .order {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                padding: 2% 5%;
                margin: 2% 0;
                background: rgba(116,142,189,0.2);
                border-radius: 20px;
            }

            .completed {
                background: #009E35;
            }

            .completed:hover {
                background: #007427;
            }

            .pending {
                background: #CF0909;
            }

            .pending:hover {
                background: #810606;
            }
                .status {
                    color: white;
                    border: none;
                    padding: 1% 2%;
                    border-radius: 10px;
                    width: 7vw;
                    cursor: pointer;
                    transition: 0.3s;
                }

                .order p {
                    max-width: 4vw;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    overflow: hidden;
                }
            </style>
            <div class='order'>
                <p>${order_id}</p>
                <p>$${total}</p>
                <p>${items}</p>
                <button class='status pending'>Pending</button>
            </div>
        `

    }

}
customElements.define('order-card', Order);