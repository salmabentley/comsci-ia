let stock = [];
let filtered_stock = [];
let categories = ['Accessories', 'Shirts', 'Hoodies & Sweaters', 'Pants', 'Miscellaneous'];


async function fetch_stock() {
    await fetch('/get-stock')
    .then(response => response.json()) //parse body to json
    .then(data => {
        stock = data;
    })
    .catch(error => {
        console.error('Error:', error)
    });
    filtered_stock = stock;
    render_stock();
}



function render_stock() {
    const target = document.getElementById('stock');
    target.innerHTML = null;
    filtered_stock.reverse().forEach((s) => {

        const stockContainer = document.createElement('div')
        stockContainer.className = 'stock-container'

        const name = document.createElement('h4');
        name.className = 'stock-name';
        name.textContent = s.name;

        const category = document.createElement('h4');
        category.className = 'stock-category';
        category.textContent = s.category;

        const quantity = document.createElement('h4');
        quantity.className = 'stock-quantity';
        quantity.textContent = s.quantity;
        if (s.quantity >= 50) {
            quantity.style.color = "#009E35";
        } else if (s.quantity >= 15) {
            quantity.style.color = "#CF5C09";
        } else {
            quantity.style.color = "#CF0909";
        }
    
        stockContainer.appendChild(name);
        stockContainer.appendChild(category);
        stockContainer.appendChild(quantity);
        target.appendChild(stockContainer);
    })
    
}

async function addItem(event) {
    event.preventDefault();

    let name_input = document.getElementById('name').value;
    let category_input = document.getElementById('category').value;
    let quantity_input = document.getElementById('input-value').value;

    await fetch('/stock', {
        method: 'POST',
        body: JSON.stringify({
            name: name_input,
            category: category_input,
            quantity: quantity_input
        })
    }).then(() => {
        console.log('success');
    }).catch((err) => {
        console.log(err);
    })
    
    stock.push({
        name: name_input,
        category: category_input,
        quantity: quantity_input
    })
    popupClose();
    render_stock();
};

window.onload = () => {
    fetch_stock();
    const search = document.getElementById('search');

    search.addEventListener('keypress', (e) => {
        e.preventDefault;
        enter();
    })
}

let active = null;

function popupAdd() {
    const overlay = document.getElementById('overlay');
    const buttons = document.getElementById('popupButtons');
    const add = document.getElementById('add');

    active = buttons;
    overlay.style.display = 'block'
    buttons.style.display = 'flex';
    add.textContent = 'Cancel -';
    add.style.zIndex = 5;
    add.onclick = popupClose;
    add.id = 'cancel';
}

function popupClose() {
    const overlay = document.getElementById('overlay');
    const cancel = document.getElementById('cancel');
    if (cancel !== null) {
        cancel.textContent = "Add +";
        cancel.style.zIndex = 1;
        cancel.onclick = popupAdd;
        cancel.id ='add';
    }

    active.style.display = 'none';
    overlay.style.display = 'none';

    active = null;
}

function newItem() {
    var popup = document.getElementById("popup");
    active.style.display = 'none';
    active = popup
    popup.style.display = "block";
    if (cancel !== null) {
        cancel.textContent = "Add +";
        cancel.style.zIndex = 1;
        cancel.onclick = popupAdd;
        cancel.id ='add';
    }
    const name = document.getElementById('name');
    const category = document.getElementById('category');
    const submit = document.getElementById('submit');
    submit.disabled = true;

    let name_status = false;
    let category_status = false;

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

    function checkInputs() {
        if (name_status && category_status) {
            submit.disabled = false;
        } else {
            submit.disabled = true;
        }
    }


    // quantity logic
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

function enter() {
    const input = document.getElementById('search');
    let query = input.value;
    filtered_stock = [];

    stock.forEach((s) => {
        if (s.name.includes(query)) {filtered_stock.push(s)}
    });

    render_stock();
}

function filter_category(event) {
    event.preventDefault;
    let category = event.target.textContent;

    filtered_stock=[];

    if (category == 'None') {filtered_stock = stock}
    else {
        stock.forEach((s) => {
            if (s.category == category) {filtered_stock.push(s)}
        })
    }

    render_stock();
}

// false is descending true is ascending
let toggle_level = false;

function filter_level() {
    toggle_level = !toggle_level;

    if (toggle_level) {
        filtered_stock.sort((a,b) => b.quantity - a.quantity);
    } else {
        filtered_stock.sort((a,b) => a.quantity - b.quantity);
    }
    render_stock();
}

let toggle_name = false;

function filter_name() {
    toggle_name = !toggle_name;

    if (toggle_name) {
        filtered_stock.sort((a,b) => b.name.localeCompare(a.name));
    } else {
        filtered_stock.sort((a,b) => a.name.localeCompare(b.name));
    }
    render_stock();
}

