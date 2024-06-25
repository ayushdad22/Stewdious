document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const data = { email, password };

    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
      return response.json();
    })
    .then(data => {
      const messageElement = document.getElementById('loginMessage');
      if (data.errors) {
        messageElement.textContent = data.errors[0].msg;
        messageElement.style.color = 'red';
      } else {
        localStorage.setItem('token', data.token);
        if (data.role === 'admin') {
          window.location.href = '/Pages/admin.html'; // Redirect admin users to admin page
        } else {
          window.location.href = '/Pages/dashboard.html'; // Redirect non-admin users to dashboard
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('loginMessage').textContent = error.msg || 'An error occurred';
    });
  });
});
