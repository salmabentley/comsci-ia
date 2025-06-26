let stock = [];

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
    stock.forEach((s) => {

        const stockContainer = document.createElement('div')
        stockContainer.className = 'stock-container'
        const name = document.createElement('h4');
        name.textContent = s.name;
        const category = document.createElement('h4');
        category.textContent = s.category;
        const quantity = document.createElement('h4');
        quantity.textContent = s.quantity;
    
        stockContainer.appendChild(name);
        stockContainer.appendChild(category);
        stockContainer.appendChild(quantity);
        target.appendChild(stockContainer);
    })
    
}

async function addItem(event) {
    event.preventDefault();

    let name_input = document.getElementById('name').value;
    console.log(name_input);
    let category_input = document.getElementById('category').value;
    let quantity_input = document.getElementById('quantity').value;

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
    render_stock();
};

window.onload = () => {
    fetch_stock();

}
