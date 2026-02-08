let order = []; // tracking the specific items currently in the order
let idFlag = false;
let dateFlag = false;
let total = 0;
let quantityTemp = 1;
let completedOrders = [];
let pendingOrders = []
let changedOrders = [];

// showing the order creation popup
function popup() {
    const popup = document.getElementById("popup");
    const overlay = document.getElementById("overlay");
    popup.style.display = "block";
    overlay.style.display = "block";
}

// hiding the popup and clearing the overlay
function popupClose() {
    const popup = document.getElementById("popup");
    const overlay = document.getElementById("overlay");
    popup.style.display = "none";
    overlay.style.display = "none";
}

// simple validation check to see if we're ready to submit
function checkComplete() {
    const submit = document.getElementById('submit')
    if (idFlag && dateFlag && order.length > 0) {
        submit.disabled = false;
        return true;
    } else {
        submit.disabled = true;
        return false;
    }
}

// logic for adding an item to our list and updating the interface
function addItem() {
    const items = document.getElementById("items");
    const item = stock.find(item => item.name === items.value)
    const p = document.getElementById("error");
    const stocklist = document.getElementById("stock-list");

    if (!item) {
        p.textContent = "please select a valid item";
        items.style.border = "2px solid red";
    } else {
        // if it's already there, just bump the quantity instead of adding a new row
        let i = order.findIndex(i => i.stock_id == item.stock_id)
        if (i != -1) {
            order[i].quantity++;
            stocklist.children[i].children[3].value++;
            items.value = "";
            total += item.price * order[i].quantity;
            updateTotal();
            return;
        }

        p.textContent = "";
        items.style.border = "none";
        items.value = "";
        
        // adding the new item to our order array
        order.push({
            stock_id: item.stock_id,
            name: item.name,
            price: item.price,
            quantity: 1 // starting with one by default
        });

        const submit = document.getElementById('submit')
        submit.disabled = order.length <= 0;

        // creating the visual elements for the new item row
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

        // keeping track of the value before the user changes it
        quantity.onfocus = () => {
            quantityTemp = parseInt(quantity.value)
        }

        // synchronising the array whenever the quantity changes on screen
        quantity.onchange = () => {
            let idx = order.findIndex(i => i.stock_id == item.stock_id);
            order[idx].quantity = parseInt(quantity.value);
            updateTotal();
        }

        // recalculating the total cost whenever something changes
        function updateTotal() {
            total = 0;
            for (const item of order) {
                total += item.price * item.quantity;
            }
            const totalElement = document.getElementById("total");
            totalElement.textContent = `$${total.toFixed(2)}`;
        }

        // removing an item from the list and updating the cost
        function remove_item(event) {
            event.preventDefault();
            event.target.parentElement.remove();
            const id = event.target.parentElement.children[0].textContent;
            order.splice(order.findIndex(item => item.stock_id == id), 1);
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

// finalising the order and sending it to the server
async function submit() {
    checkComplete();
    const date = document.getElementById("date").value;
    const id = document.getElementById("id").value;

    if (checkComplete()) {
        await fetch('/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
                alert("error submitting order. please try again.");
            }
        }).catch(error => {
            console.error('oops:', error);
            alert("error submitting order. please try again.");
        });
    }
}

// fetching all orders and categorising them into pending or completed
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
    })
    .catch(err => console.log(err))
}

// handling the toggle button for order status changes
function handleClick(button, e, completed) {
    e.preventDefault();
    e.stopPropagation();
    const id = e.target.parentElement.children[0].textContent;

    // tracking which orders have been modified so we can save them later
    if (changedOrders.includes(id)) {
        let i = changedOrders.findIndex(order_id => order_id === id);
        changedOrders.splice(i, 1);
    } else {
        changedOrders.push(id);
    }

    let newStatus = !completed;
    if (newStatus) {
        button.className = "status completed";
        let i = pendingOrders.findIndex(order => order.order_id === id);
        const target = pendingOrders[i];
        completedOrders.push(target);
        pendingOrders.splice(i, 1);
    } else {
        button.className = "status pending"
        let i = completedOrders.findIndex(order => order.order_id === id);
        const target = completedOrders[i];
        pendingOrders.push(target);
        completedOrders.splice(i, 1);
    }
    renderOrders();
    checkChanges();
}

// checking if there are unsaved changes to alert the user
function checkChanges() {
    const save = document.getElementById('save');
    const warning = document.getElementById('warning');
    if (changedOrders.length === 0) {
        save.disabled = true;
        warning.style.display = 'none';
    } else {
        save.disabled = false;
        warning.style.display = 'block';
    }
}

// sending the updated statuses back to the database
async function save() {
    await fetch('/update-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: changedOrders })
    }).then(response => {
        if (response.ok) {
            window.location.href = '/orders';
        } else {
            alert("error updating orders. please try again.");
        }
    }).catch(error => {
        console.error('oops:', error);
        alert("error updating orders. please try again.");
    });
}

// drawing the orders onto the page after categorising them
function renderOrders() {
    const pendingList = document.getElementById('pending-order-container');
    const completedList = document.getElementById('order-history-container');

    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    // helper to create the frontend row for each order
    function orderFrontend(order, completed) {
        const div = document.createElement('div');
        div.className = 'order';
        div.onclick = () => {
            window.location.href = `/order/${order.order_id}`;
        }
        const id = document.createElement('p');
        id.textContent = order.order_id;
        const totalValue = document.createElement('p');
        totalValue.textContent = `$${order.total}`;
        const itemsCount = document.createElement('p');
        itemsCount.textContent = order.order_items.length;
        
        const statusButton = document.createElement('button');
        statusButton.textContent = completed ? 'completed' : 'pending';
        statusButton.className = completed ? 'status completed' : 'status pending';

        statusButton.onclick = (e) => {
            handleClick(statusButton, e, completed);
        }
        div.appendChild(id);
        div.appendChild(totalValue);
        div.appendChild(itemsCount);
        div.appendChild(statusButton);
        completed ? completedList.appendChild(div) : pendingList.appendChild(div);
    }

    if (pendingOrders.length == 0) {
        pendingList.innerHTML = '<p>no orders found</p>';
    } else {
        pendingOrders.forEach(order => orderFrontend(order, false))
    }

    if (completedOrders.length == 0 ) {
        completedList.innerHTML = '<p>no orders found</p>';
    } else {
        completedOrders.forEach(order => orderFrontend(order, true))
    }
}

// initialising the page and setup listeners
window.onload = () => {
    getOrders()
    const date = document.getElementById("date");
    // preventing users from selecting future dates
    date.max = new Date().toISOString().split("T")[0]; 
    
    date.addEventListener("input", () => {
        dateFlag = date.value.trim() !== "";
        checkComplete();
    });

    const checkbox = document.getElementById("check");
    checkbox.addEventListener("change", () => {
        const id = document.getElementById("id");
        if (checkbox.checked) {
            id.disabled = true;
            id.required = false;
            id.value = '';
            idFlag = true;
        } else {
            id.disabled = false;
            id.required = true;
            idFlag = id.value.trim() !== "";
            id.addEventListener("input", () => {
                idFlag = id.value.trim() !== "";
                checkComplete();
            });
        }
        checkComplete();
    })
}