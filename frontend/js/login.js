async function loginSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value;
  const password = form.password.value;
  const rememberMe = form.rememberMe.checked;
  const errors = {};
  const emailErr = CRMValidators.validateEmail(email);
  if (emailErr) errors.email = emailErr;
  if (!password) errors.password = 'Password is required.';
  CRMValidators.applyErrors(form, errors);
  const alertBox = document.getElementById('loginAlert');
  alertBox.classList.add('d-none');
  if (Object.keys(errors).length) return;

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Signing in...';
  try {
    const res = await Api.post('/api/auth/login', { email, password, rememberMe });
    sessionStorage.setItem('csrfToken', res.data.csrfToken);
    window.location.href = '/';
  } catch (err) {
    alertBox.textContent = err.payload?.message || err.message;
    alertBox.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

document.getElementById('loginForm')?.addEventListener('submit', loginSubmit);
