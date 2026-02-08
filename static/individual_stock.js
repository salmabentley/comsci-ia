let toggle = false;
let stock_needed = 0;

// getting rid of the stock item entirely and heading back to the main list
async function deleteStock() {
    await fetch(window.location.href, {
        method: 'DELETE'
    }).then(() => window.location.href = '/stock')
    .catch((e) => console.log('delete failed:', e))
}

// working out how many items we need to fulfil pending orders
function calculateNeeded() {
    let needed = 0; 

    document.querySelectorAll('.order').forEach(orderEl => {
        const quantity = Number(orderEl.querySelector('p:nth-child(2)')?.textContent.trim()) || 0;
        const status = orderEl.querySelector('p:nth-child(3)')?.textContent.trim().toLowerCase();

        // we only care about orders that haven't been sent out yet
        if (status === 'pending') {
            needed += quantity;
        }
    });

    let stock_level = document.getElementById('stock_level').textContent;
    let target = document.getElementById('stock_needed')
    target.textContent = needed;

    // colour coding the "needed" text based on whether we have enough stock
    if (Number(stock_level) > needed) {
        target.style.color = '#009E35'; // all clear
    } else {
        target.style.color = '#CF0909'; // time to restock
    }

    // dynamic colour feedback for the current stock level
    if (stock_level >= 50) {
        document.getElementById('stock_level').style.color = "#009E35";
    } else if (stock_level >= 15) {
        document.getElementById('stock_level').style.color = "#CF5C09";
    } else {
        document.getElementById('stock_level').style.color = "#CF0909";
    }
}

// managing the popup logic for updating stock levels
function popup() {
    const input = document.getElementById("quantity");
    
    // toggling the visibility of the input field
    if (input.hidden) {
        input.hidden = false;
        toggle = true;
    } else {
        input.hidden = true;
        toggle = false;
    }

    // showing or hiding the dim background overlay
    const overlay = document.getElementById("overlay");
    overlay.style.display = toggle ? "block" : "none";

    const add = document.getElementById("add");
    if (toggle) {
        // switching the "add" button to a "submit" button while the popup is active
        add.id = 'submit';
        add.textContent = "Submit";
        add.onclick = async () => {
            if (!input.value) {
                input.style.border = "2px solid red";
            } else {
                // sending the partial update to the server
                await fetch('/update-stock', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: document.getElementById("name").textContent,
                        quantity: input.value
                    })
                }).then(res => {
                    if (res.ok) {
                        popupClose();
                        console.log("stock updated successfully");
                        window.location.reload();
                    }
                }).catch(err => console.log('update failed:', err))
            }
        }
    }
}

// resets the ui elements when closing the update window
function popupClose() {
    const input = document.getElementById("quantity");
    input.hidden = true;
    toggle = false;
    
    const add = document.getElementById("submit") || document.getElementById("add");
    add.id = "add";
    add.textContent = "Add";
    add.onclick = popup;

    const overlay = document.getElementById("overlay");
    overlay.style.display = "none";
}

// initialising the calculations once the page is fully visualised
window.onload = () => {
    calculateNeeded();
}