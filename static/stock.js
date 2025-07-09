let stock = [];
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
    render_stock();
}



function render_stock() {
    const target = document.getElementById('stock');
    target.innerHTML = null;
    stock.reverse().forEach((s) => {

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
