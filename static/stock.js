// the main lists and categories we're using to keep things organised
let stock = [];
let filtered_stock = [];
let categories = ['Accessories', 'Shirts', 'Hoodies & Sweaters', 'Pants', 'Miscellaneous'];

// grabbing everything from the database so we have the latest numbers
async function fetch_stock() {
    await fetch('/get-stock')
    .then(response => response.json()) // parse the body to json format
    .then(data => {
        stock = data;
    })
    .catch(error => {
        console.error('oops, something went wrong:', error)
    });
    filtered_stock = stock;
    render_stock();
}

// this clears the screen and redraws the inventory list
function render_stock() {
    const target = document.getElementById('stock');
    target.innerHTML = null;

    // if there's nothing there, just let the user know
    if (filtered_stock.length === 0) {
        const noStock = document.createElement('h3');
        noStock.textContent = 'no stock found';
        target.appendChild(noStock);
        return;
    }

    // reverse it so the newest stuff shows up first
    filtered_stock.reverse().forEach((s) => {
        const stockContainer = document.createElement('div')
        stockContainer.className = 'stock-container'
        stockContainer.onclick = stockRedirect;
        stockContainer.id = s.id;

        const name = document.createElement('h4');
        name.className = 'stock-name';
        name.textContent = s.name;

        const category = document.createElement('h4');
        category.className = 'stock-category';
        category.textContent = s.category;

        const quantity = document.createElement('h4');
        quantity.className = 'stock-quantity';
        quantity.textContent = s.quantity;

        // colour coding the levels so we can see what's running low at a glance
        if (s.quantity >= 50) {
            quantity.style.color = "#009E35"; // looking good
        } else if (s.quantity >= 15) {
            quantity.style.color = "#CF5C09"; // getting a bit low
        } else {
            quantity.style.color = "#CF0909"; // critical level
        }
    
        stockContainer.appendChild(name);
        stockContainer.appendChild(category);
        stockContainer.appendChild(quantity);
        target.appendChild(stockContainer);
    })
}

// sending a brand new product to the server
async function addItem(event) {
    event.preventDefault();

    let name_input = document.getElementById('name').value;
    let category_input = document.getElementById('category').value;
    let price_input = document.getElementById('price').value;
    let quantity_input = document.getElementById('input-value').value;

    // bundle everything up into a form data object (handy for images)
    const fd = new FormData();
    fd.append('name', name_input);
    fd.append('category', category_input);  
    fd.append('price', price_input);  
    fd.append('quantity', quantity_input);
    const image = document.getElementById('image').files[0];
    if (image) {
        fd.append('image', image);
    } else {
        fd.append('image', null);
    }

    await fetch('/stock', {
        method: 'POST',
        body: fd
    }).then(() => {
        console.log('product added successfully');
    }).catch((err) => {
        console.log(err);
    })
    
    // update the local list so we don't have to refresh the whole page
    stock.push({
        name: name_input,
        category: category_input,
        quantity: quantity_input
    })
    popupClose();
    render_stock();

    // clean up the form fields for next time
    document.getElementById('name').value = '';
    document.getElementById('category').value = '';
    document.getElementById('image').files[0] = null;
    document.getElementById('price').value = '';
    document.getElementById('input-value').value = 0;
};

let active = null;

// handling the ui when someone wants to add something
function popupAdd() {
    const overlay = document.getElementById('overlay');
    const buttons = document.getElementById('popupButtons');
    const add = document.getElementById('add');

    active = buttons;
    overlay.style.display = 'block'
    buttons.style.display = 'flex';
    add.textContent = 'cancel -';
    add.style.zIndex = 5;
    add.onclick = popupClose;
    add.id = 'cancel';
}

// tidying up the screen when we close a popup
function popupClose() {
    const overlay = document.getElementById('overlay');
    const cancel = document.getElementById('cancel');
    if (cancel !== null) {
        cancel.textContent = "add +";
        cancel.style.zIndex = 1;
        cancel.onclick = popupAdd;
        cancel.id ='add';
    }

    if (active) active.style.display = 'none';
    overlay.style.display = 'none';
    active = null;
}

// switching the view to the "new item" form
function newItem() {
    var popup = document.getElementById("popup");
    active.style.display = 'none';
    active = popup
    popup.style.display = "block";

    // validation logic to make sure people actually fill in the fields
    const name = document.getElementById('name');
    const category = document.getElementById('category');
    const price = document.getElementById('price')
    const submit = document.getElementById('submit');
    submit.disabled = true;

    let name_status = false;
    let category_status = false;
    let price_status = false;

    name.addEventListener('input', (e) => {
        if (e.target.value.trim() !== '') {
            name.style.border = 'none';
            name_status = true;
        } else {
            name.style.border = '2px solid red'; 
            name_status = false;
        }
        checkInputs();
    });

    category.addEventListener('input', (e) => {
        if (categories.includes(e.target.value.trim())) {
            category.style.border = 'none';
            category_status = true;
        } else {
            category.style.border = '2px solid red'; 
            category_status = false;
        }
        checkInputs();
    });

    price.addEventListener('input', (e) => {
        if (e.target.value.trim() != null) {
            price.style.border = 'none';
            price_status = true;
        } else {
            price.style.border = '2px solid red'; 
            price_status = false;
        }
        checkInputs();
    });
    
    function checkInputs() {
        if (name_status && category_status && price_status) {
            submit.disabled = false;
        } else {
            submit.disabled = true;
        }
    }

    // syncing the slider and the number box for quantities
    const value = document.getElementById("input-value");
    const input = document.getElementById("quantity-input");
    value.value = input.value;
    input.addEventListener("input", (event) => {
        value.value = event.target.value;
    });
    value.addEventListener("input", (event) => {
        input.value = event.target.value;
    });
}

// search functionality to find specific items
function enter() {
    const input = document.getElementById('search');
    let query = input.value.toLowerCase();
    filtered_stock = [];

    stock.forEach((s) => {
        if (s.name.toLowerCase().includes(query)) {filtered_stock.push(s)}
    });

    render_stock();
}

// filtering by category (e.g. only showing shirts)
function filter_category(event) {
    let category = event.target.textContent;
    filtered_stock=[];

    if (category == 'None') {
        filtered_stock = stock
    } else {
        stock.forEach((s) => {
            if (s.category == category) {filtered_stock.push(s)}
        })
    }
    render_stock();
}

// toggling the sort order for stock levels
let toggle_level = false;
function filter_level() {
    const arrow = document.getElementById("stock-arrow");
    toggle_level = !toggle_level;

    if (toggle_level) {
        filtered_stock.sort((a,b) => b.quantity - a.quantity);
        arrow.textContent = "↑";
    } else {
        filtered_stock.sort((a,b) => a.quantity - b.quantity);
        arrow.textContent = "↓";
    }
    render_stock();
}

// alphabetical sorting for item names
let toggle_name = false;
function filter_name() {
    const arrow = document.getElementById("name-arrow");
    toggle_name = !toggle_name;

    if (toggle_name) {
        filtered_stock.sort((a,b) => b.name.localeCompare(a.name));
        arrow.textContent = "↑";
    } else {
        filtered_stock.sort((a,b) => a.name.localeCompare(b.name));
        arrow.textContent = "↓";
    }
    render_stock();
}

// filling the dropdown so users can pick existing items to restock
function add_dropdown_stock() {
    const list = document.getElementById("all-stock");
    stock.forEach((s) => {
        let option = document.createElement("option");
        option.value = s.name;
        list.appendChild(option);
    })
}

// adds an item to the "restock list" in the popup
function push_stock() {
    const input = document.getElementById("popup-search")
    const item = input.value;

    if (!stock.some(s => s.name === item)) {
        input.style.border = "2px solid red";   
        document.getElementById("error-text").textContent = 'please enter a valid item';
        input.value = '';
    } else {
        input.style.border = "none";
        document.getElementById("error-text").textContent = '';

        const container = document.createElement("div");
        container.className = "new-stock";
        const name = document.createElement("h4");
        name.textContent = item;
        const quantity = document.createElement("input");
        quantity.type = 'number';
        quantity.placeholder = 'quantity'
        quantity.min = 1;
        const remove = document.createElement("i");
        remove.className = 'material-icons';
        remove.textContent = 'delete';
        remove.style.color = 'red';
        remove.style.cursor = 'pointer';
        remove.onclick = remove_stock;

        container.appendChild(name);
        container.appendChild(quantity);
        container.appendChild(remove);
        document.getElementById("new-stock-container").appendChild(container);
        input.value = '';
    }
}

// remove an item from the restock list before saving
function remove_stock(event) {
    event.preventDefault();
    const parent = event.target.parentElement;
    parent.remove();
}

// syncing the new stock quantities with the database
async function updateStock() {
    const collections = document.getElementById("new-stock-container").children;
    const unfilled = [];

    const stock_updates = Array.from(collections).map((item) => {
        const name = item.querySelector('h4').textContent;
        const quantity = item.querySelector('input').value;

        item.querySelector('input').style.border="none";

        if (quantity < 0 || quantity == '') {
            unfilled.push(item.querySelector('input'));
        }
        return {name, quantity}
    })

    if (unfilled.length !== 0) {
        unfilled.forEach(input => input.style.border = '2px solid red');
        document.getElementById("error-text").textContent = 'please enter a valid quantity';
        return;
    } else {
        await fetch('/update-stock', {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stock_updates)
        }).then(() => {
            // update the local data so the ui stays in sync
            stock_updates.forEach(update => {
                const item = stock.find(s => s.name == update.name);
                if (item) item.quantity += Number(update.quantity);
            });
            document.getElementById("new-stock-container").innerHTML = '';
            render_stock();
        }).catch((e) => console.log('error: ' + e))
    }
}

// opens the restock popup
function newStock() {
    active.style.display = 'none';
    const popup = document.getElementById("popup-stock")
    popup.style.display = 'block';
    active = popup;
}

// sends the user to a specific item's detailed page
function stockRedirect(event) {
    let element = event.target;
    // bubble up to find the container with the id
    while (element && !element.id) {
        element = element.parentElement;
    }
    if (element) window.location.pathname = `/stock/${element.id}`;
}

// getting everything ready as soon as the page finishes loading
window.onload = async () => {
    await fetch_stock();
    const search = document.getElementById('search');

    search.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enter();
    });

    add_dropdown_stock();
}