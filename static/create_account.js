

function checkFields() {
    const submitButton = document.getElementById("submit");
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (username && password && email) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

function addListeners() {
    document.getElementById('username').addEventListener('input', checkFields);
    document.getElementById('email').addEventListener('input', checkFields);
    document.getElementById('password').addEventListener('input', checkFields);
}

function submit() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/';
        } else {
            alert('Login failed. Please check your credentials and try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
}

window.onload = () => {
    addListeners()
    checkFields();
}