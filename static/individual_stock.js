let toggle = false;
let needed = 0;

async function deleteStock() {
    await fetch(window.location.href, {
        method: 'DELETE'
    }).then(()=> window.location.href = '/stock')
    .catch((e) => console.log(e))
}

function calculateNeeded() {

    document.querySelectorAll('.order').forEach(orderEl => {
    const quantity = Number(orderEl.querySelector('p:nth-child(2)')?.textContent.trim()) || 0;
    const status = orderEl.querySelector('p:nth-child(3)')?.textContent.trim().toLowerCase();

    if (status === 'pending') {
        needed += quantity;
    }
    });

    let stock_level = document.getElementById('stock_level').textContent;
    let target = document.getElementById('stock_needed')
    target.textContent = needed;
    if (Number(stock_level) > needed) {
        target.style.color = '#009E35';
    } else {
        target.style.color = '#CF0909';
    }

    if (stock_level >= 50) {
        document.getElementById('stock_level').style.color = "#009E35";
    } else if (stock_level >= 15) {
        document.getElementById('stock_level').style.color = "#CF5C09";
    } else {
        document.getElementById('stock_level').style.color = "#CF0909";
    }
}

function popup() {
    const input = document.getElementById("quantity");
    if (input.hidden) {
        input.hidden = false;
        toggle = true;
    }
    else {
        input.hidden = true;
        toggle = false;
    }

    const overlay = document.getElementById("overlay");
    if (toggle) {
        overlay.style.display = "block";
    } else {
        overlay.style.display = "none";
    }


    const add = document.getElementById("add");
    if (toggle) {
        add.id = 'submit';
        add.textContent = "Submit";
        add.onclick = async () => {
            if (!input.value) {
                input.style.border = "2px solid red";
            } else {
                await fetch('/update-stock', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: document.getElementById("name").textContent,
                        quantity: input.value
                    })
                }).then(
                    res => {
                        if(res.ok) {
                            popupClose();
                            console.log("success");
                            window.location.reload();
                        }
                    }
                ).catch(err => console.log(err))
            }
        }
    }
}

function popupClose() {
    const input = document.getElementById("quantity");
    input.hidden = true;
    toggle = false;
    const add = document.getElementById("submit");
    add.id = "add";
    add.textContent = "Add";
    add.onclick = popup;

    const overlay = document.getElementById("overlay");
    overlay.style.display = "none";
}

window.onload=()=> {
    calculateNeeded();
}