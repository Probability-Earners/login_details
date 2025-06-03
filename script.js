// === STORE OR REUSE AMOUNT FOR 10 MINUTES ===
function getOrReuseAmount() {
  const stored = localStorage.getItem('storedAmount');
  const storedTime = localStorage.getItem('storedTime');
  const now = Date.now();

  if (stored && storedTime && (now - storedTime) < 10 * 60 * 1000) {
    return stored;
  } else {
    const min = 3;
    const max = 5;
    const amount = (Math.random() * (max - min) + min).toFixed(2);
    localStorage.setItem('storedAmount', amount);
    localStorage.setItem('storedTime', now);
    return amount;
  }
}

// === START 10-MINUTE COUNTDOWN ===
function startCountdown() {
  const countdownEl = document.getElementById('countdown');
  let timeLeft = 10 * 60;

  const interval = setInterval(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    countdownEl.textContent = `⏳ Time left: ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownEl.textContent = '⏰ Time expired! Please refresh the page.';
      localStorage.removeItem('storedAmount');
      localStorage.removeItem('storedTime');
    }

    timeLeft--;
  }, 1000);
}

// === ON PAGE LOAD ===
document.addEventListener('DOMContentLoaded', () => {
  const amount = getOrReuseAmount();
  const paymentString = `upi://pay?pa=probability@slc&am=${amount}`;

  new QRCode(document.getElementById('qrcode'), {
    text: paymentString,
    width: 200,
    height: 200
  });

  startCountdown();
});

// === FORM VALIDATION & SUBMISSION ===
const form = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');

function validateCodename(value) {
  return value.trim().length >= 3;
}
function validateAccountNumber(value) {
  return /^\d{1,18}$/.test(value);
}
function validateIFSC(value) {
  return /^[A-Za-z0-9]{11}$/.test(value);
}
function validateAccountPerson(value) {
  return /^[A-Za-z ]{3,}$/.test(value.trim());
}
function validateFile(input) {
  return input.files.length > 0;
}

function showError(input, message) {
  const small = input.parentElement.querySelector('.error-msg');
  if (message) {
    input.classList.add('error');
    small.textContent = message;
  } else {
    input.classList.remove('error');
    small.textContent = '';
  }
}

function checkFormValidity() {
  return (
    validateCodename(form.codename.value) &&
    validateAccountNumber(form.accountNumber.value) &&
    validateIFSC(form.ifscCode.value) &&
    validateAccountPerson(form.accountPerson.value) &&
    validateFile(form.paymentScreenshot)
  );
}

form.codename.addEventListener('blur', () => {
  showError(form.codename, validateCodename(form.codename.value) ? '' : 'At least 3 characters needed.');
  submitBtn.style.display = checkFormValidity() ? 'block' : 'none';
});
form.accountNumber.addEventListener('blur', () => {
  showError(form.accountNumber, validateAccountNumber(form.accountNumber.value) ? '' : 'Only digits, max 18.');
  submitBtn.style.display = checkFormValidity() ? 'block' : 'none';
});
form.ifscCode.addEventListener('blur', () => {
  showError(form.ifscCode, validateIFSC(form.ifscCode.value) ? '' : 'Exactly 11 alphanumeric.');
  submitBtn.style.display = checkFormValidity() ? 'block' : 'none';
});
form.accountPerson.addEventListener('blur', () => {
  showError(form.accountPerson, validateAccountPerson(form.accountPerson.value) ? '' : 'At least 3 letters.');
  submitBtn.style.display = checkFormValidity() ? 'block' : 'none';
});
form.paymentScreenshot.addEventListener('change', () => {
  showError(form.paymentScreenshot, validateFile(form.paymentScreenshot) ? '' : 'Please upload a file.');
  submitBtn.style.display = checkFormValidity() ? 'block' : 'none';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (checkFormValidity()) {
    handleSubmit();
    form.reset();
    submitBtn.style.display = 'none';
  }
});

function handleSubmit() {
  const codename = form.codename.value.trim();
  const accountNumber = form.accountNumber.value.trim();
  const ifscCode = form.ifscCode.value.trim();
  const accountPerson = form.accountPerson.value.trim();
  const file = form.paymentScreenshot.files[0];
  const url = "https://script.google.com/macros/s/AKfycbz37E_Gt-H-O0d2e5_oqYuBPCy5SYFBtcNg8WjIzUjLiu8npOMbeOJmEY-rAk_3uC8G4w/exec";

  const reader = new FileReader();
  reader.onload = () => {
    const base64String = reader.result;
    const split = base64String.split("base64,")[1];

    const data = {
      code: codename,
      accNum: accountNumber,
      ifsc: ifscCode,
      accName: accountPerson,
      base64: split,
      type: file.type,
      name: file.name
    };

    fetch(url, {
      method: "POST",
      body: JSON.stringify(data)
    })
      .then(r => r.text())
      .then(resp => {
        alert('✅ Done! This page will now close.');
        window.close();
    })
    .catch(err => {
      console.error(err);
      alert('❌ Something went wrong. Please try again.');
    });
  };
  reader.readAsDataURL(file);
}
