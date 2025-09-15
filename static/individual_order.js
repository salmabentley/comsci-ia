async function deleteOrder() {
    let userConfirmed = confirm("Are you sure you would like to delete this orer? This action cannot be reversed.");
    if (userConfirmed) {
        await fetch(window.location.href, {
            method: 'DELETE'
        }).then(()=> window.location.href = '/orders')
        .catch((e) => console.log(e))
    }
}

window.onload = () => {
    const level = document.getElementById("level");
    if (level.textContent >= 50) {
        level.style.color = '#009E35';
    } else if (level.textContent > 15) {
        level.style.color = 'CF5C09';
    } else {
        level.style.color = '#CF0909';
    }
}