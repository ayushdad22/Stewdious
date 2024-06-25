document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.getElementById('signupForm');
  const adminSignupForm = document.getElementById('adminSignupForm');
  const hobbySelect = document.getElementById('hobbies');
  const selectedHobbies = document.getElementById('selectedHobbies');
  const signupMessage = document.getElementById('signupMessage');
  let hobbies = [];

  function updateHobbies() {
    selectedHobbies.innerHTML = '';
    hobbies.forEach(hobby => {
      const hobbyItem = document.createElement('span');
      hobbyItem.className = 'hobby';
      hobbyItem.textContent = hobby;
      hobbyItem.addEventListener('click', () => {
        hobbies = hobbies.filter(h => h !== hobby);
        updateHobbies();
      });
      selectedHobbies.appendChild(hobbyItem);
    });
  }

  hobbySelect.addEventListener('change', function() {
    const hobby = hobbySelect.value;
    if (hobby && !hobbies.includes(hobby)) {
      hobbies.push(hobby);
      updateHobbies();
    }
  });

  signupForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, hobbies })
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
        window.location.href = '/Pages/dashboard.html';
      } else {
        signupMessage.textContent = data.errors ? data.errors.map(error => error.msg).join('\n') : 'An error occurred';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      signupMessage.textContent = error.msg || 'An error occurred';
    });
  });
});
