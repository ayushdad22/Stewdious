adminSignupForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const adminSecret = document.getElementById('adminSecret').value;

    fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, adminSecret })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
      return response.json();
    })
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = '/Pages/admin.html';
      } else {
        signupMessage.textContent = data.errors ? data.errors.map(error => error.msg).join('\n') : 'An error occurred';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      signupMessage.textContent = error.msg || 'An error occurred';
    });
  });