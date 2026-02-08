// validation check to ensure the submit button is only active when all fields are populated
function checkFields() {
    const submitButton = document.getElementById("submit");
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // enabling the button only if all three fields have content
    if (username && password && email) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

// initialising the event listeners to monitor input fields in real-time
function addListeners() {
    document.getElementById('username').addEventListener('input', checkFields);
    document.getElementById('email').addEventListener('input', checkFields);
    document.getElementById('password').addEventListener('input', checkFields);
}

// handling the form submission, validation, and authorisation request
function submit() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // basic client-side check to see if the email format is plausible
    if (!email.includes('@') && !email.includes('.')) {
        alert('please enter a valid email address.');
        return;
    }

    // sending the user data to the server for processing
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => {
        // if the server approves the signup, we redirect to the homepage
        if (response.ok) {
            window.location.href = '/';
        } else {
            alert('signup failed. please check your details and try again.');
        }
    })
    .catch(error => {
        console.error('something went wrong with the request:', error);
        alert('an error occurred. please try again.');
    });
}

// setting up the page once all content is loaded
window.onload = () => {
    addListeners()
    checkFields();
}