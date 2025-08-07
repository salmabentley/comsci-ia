let order = []; //stock items in order
let idFlag = false;
let dateFlag = false;
let total = 0;
let quantityTemp = 1;
let completedOrders = [];
let pendingOrders = []

function popup() {
    const popup = document.getElementById("popup");
    const overlay = document.getElementById("overlay");
    popup.style.display = "block";
    overlay.style.display = "block";

    
}

function checkComplete() {
    const submit = document.getElementById('submit')
    if (idFlag && dateFlag && order.length >0) {
        submit.disabled = false;
        return true;
    } else {
        submit.disabled = true;
        return false;
    }
}

function addItem() {

    const items = document.getElementById("items");
    const item = stock.find(item => item.name === items.value)
    const p = document.getElementById("error");
    const stocklist = document.getElementById("stock-list");
    if (!item) {
        p.textContent="Please select a valid item";
        items.style.border = "2px solid red";
        
    } else {
        let i = order.findIndex(i => i.stock_id == item.stock_id)
        if (i != -1) {
            order[i].quantity++;
            stocklist.children[i].children[3].value++;
            items.value="";
            console.log(order);
            total += item.price*order[i].quantity;
            updateTotal();
            return;
        }
        p.textContent="";
        items.style.border = "none";
        items.value="";
        order.push({
            stock_id: item.stock_id,
            name: item.name,
            price: item.price,
            quantity: 1 // default
        });

        const submit = document.getElementById('submit')
        if (order.length > 0) {
            submit.disabled = false;
        } else {
            submit.disabled = true;
        }


        console.log(order);
        const container = document.createElement("div");
        container.className = "stock";
        const id = document.createElement("p");
        id.textContent = item.stock_id;
        const name = document.createElement("p");
        name.textContent = item.name;
        const price = document.createElement("p");
        price.textContent = `$${item.price}`;
        const quantity = document.createElement("input");
        quantity.id = "quantity";
        quantity.type = "number";
        quantity.min = 1;
        quantity.value = 1;
        quantity.onfocus = () => {
            quantityTemp = parseInt(quantity.value)
        }
        quantity.onchange = () => {
            let idx = order.findIndex(i => i.stock_id == item.stock_id);
            order[idx].quantity = parseInt(quantity.value);
            updateTotal();
        }
        function updateTotal() {
            total = 0;
            for (const item of order) {
                total += item.price * item.quantity;
            }
            const totalElement = document.getElementById("total");
            totalElement.textContent = `$${total.toFixed(2)}`;
        }

        function remove_item(event) {
            event.preventDefault();
            event.target.parentElement.remove();
            const id = event.target.parentElement.children[0].textContent;
            order.splice(order.findIndex(item => item.stock_id == id),1);
            console.log(order);
            checkComplete();
            updateTotal();

        }

        const bin = document.createElement("i");
        bin.className = "material-icons";
        bin.textContent = "delete";
        bin.onclick = remove_item;
        bin.style.cursor = "pointer";    
        bin.style.color = "red";    

        container.appendChild(id);
        container.appendChild(name);
        container.appendChild(price);
        container.appendChild(quantity)
        container.appendChild(bin);
        stocklist.appendChild(container)
        updateTotal();
    }
    checkComplete();
}

async function submit() {
    checkComplete();
    // const checkbox = document.getElementById("check");
    const date = document.getElementById("date").value;
    const id = document.getElementById("id").value;
    if (checkComplete()) {
        await fetch('/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                date: date,
                total: total,
                order: order
            })
        }).then(response => {
            if (response.ok) {
                window.location.href = '/orders';
            } else {
                alert("Error submitting order. Please try again.");
            }
        }).catch(error => {
            console.error('Error:', error);
            alert("Error submitting order. Please try again.");
        });
    }

}



async function getOrders() {
    await fetch('/get-orders').then(res => res.json())
    .then(data => {
        data.forEach(order => {
            if (order.status === false) {
                pendingOrders.push(order);
            } else {
                completedOrders.push(order);
            }
        })
        renderOrders();
        console.log('pending', pendingOrders);
        console.log('completed', completedOrders)
    })
    .catch(err => console.log(err))
}

function renderOrders() {
    const pendingList = document.getElementById('pending-order-container');
    const completedList = document.getElementById('order-history-container');

    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    function orderFrontend(order, completed) {
        const div = document.createElement('div');
        div.className = 'order';
        const id = document.createElement('p');
        id.textContent = order.order_id;
        const total = document.createElement('p');
        total.textContent = `$${order.total}`;
        const items = document.createElement('p');
        items.textContent = order.order_items.length;
        const statusButton = document.createElement('button');
        completed ? statusButton.textContent = 'Completed' : statusButton.textContent = 'Pending';
        completed ? statusButton.className = 'status completed' : statusButton.className = 'status pending';

        statusButton.onclick = (e) => {
            e.preventDefault();
            console.log(e)
        }
        div.appendChild(id);
        div.appendChild(total);
        div.appendChild(items);
        div.appendChild(statusButton);
        completed ? completedList.appendChild(div) : pendingList.appendChild(div);
    }

    if (pendingOrders.length == 0) {
        pendingList.innerHTML = '<p>No orders found</p>';
    } else {
        pendingOrders.forEach(order => {
            orderFrontend(order, completed = false)
        })
    }

    if (completedOrders.length == 0 ) {
        completedList.innerHTML = '<p>No orders found</p>';
    } else {
        completedOrders.forEach(order => {
            orderFrontend(order, completed = true)
        })
    }
}



// WINDOW FUNCTION

window.onload = () => {
    getOrders()
    const date = document.getElementById("date");
    date.max = new Date().toISOString().split("T")[0]; 
    date.addEventListener("input", () => {
        if (date.value.trim() !== "") {
            dateFlag = true;
        } else {
            dateFlag = false;
        }
        checkComplete();
    });
    const checkbox = document.getElementById("check");
    checkbox.addEventListener("change", () => {
        const id = document.getElementById("id");
        if (checkbox.checked) {
            id.disabled = true;
            id.required = false;
            id.value = '';
            id.removeEventListener("input", () => {
                if (id.value.trim() !== "") {
                    idFlag = true;
                } else {
                    idFlag = false;
                }
                checkComplete();
            });
            idFlag = true;
            checkComplete();

        } else {
            id.disabled = false;
            id.required = true;
            idFlag = false;
            id.addEventListener("input", () => {
                if (id.value.trim() !== "") {
                    idFlag = true;
                } else {
                    idFlag = false;
                }
                checkComplete();
            });
            checkComplete();

        }
    })
}