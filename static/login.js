// hiding the header element which likely acts as the container for the login popup
function closePopup() {
    document.querySelector("header").style.display = "none";
}

// validation check to ensure the submit button only works when fields aren't empty
function checkFields() {
    const submitButton = document.getElementById("submit");
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // toggling the disabled state based on whether credentials have been entered
    if (username && password) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

// initialising the event listeners to watch for user input in real-time
function addListeners() {
    document.getElementById('username').addEventListener('input', checkFields);
    document.getElementById('password').addEventListener('input', checkFields);
}

// handling the server request and managing the authorisation redirect
function submit() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        // if the server gives us the green light, we send them to the home page
        if (response.ok) {
            window.location.href = '/';
        } else {
            alert('login failed. please check your credentials and try again.');
        }
    })
    .catch(error => {
        console.error('something went wrong with the request:', error);
        alert('an error occurred. please try again later.');
    });
}

// setting everything up once the window has finished loading
window.onload = () => {
    addListeners()
    checkFields();
}