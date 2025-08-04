let order = []; //stock items in order

function popup() {
    const popup = document.getElementById("popup");
    const overlay = document.getElementById("overlay");
    popup.style.display = "block";
    overlay.style.display = "block";

    
}

function remove_item(event) {
    event.preventDefault();
    event.target.parentElement.remove();
    const id = event.target.parentElement.children[0].textContent;
    order.splice(order.findIndex(item => item.stock_id == id),1);
    console.log(order);
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
            if (i!=0) {
                stocklist.children[stocklist.length-i].children[3].value++;
            } else {

                stocklist.children[0].children[3].value++;
            }
            items.value="";
            console.log(order);
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
    }
}


window.onload = () => {
    const date = document.getElementById("date");
    date.max = new Date().toISOString().split("T")[0]; 
    const checkbox = document.getElementById("check");
    checkbox.addEventListener("change", () => {
        const id = document.getElementById("id");
        if (checkbox.checked) {
            id.disabled = true;
        } else {
            id.disabled = false;
        }
    })
}

