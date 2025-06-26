// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBYIYW8u_UnyY2jjdTdqMVm-2psFpRUrr8",
  authDomain: "linkedin-clone-5a671.firebaseapp.com",
  projectId: "linkedin-clone-5a671",
  storageBucket: "linkedin-clone-5a671.appspot.com",
  messagingSenderId: "1026594878915",
  appId: "1:1026594878915:web:1ecebeed6093d5b802b976",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// 🔐 Sign in with Google
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const token = await result.user.getIdToken();
    localStorage.setItem("token", token);
    await ensureUserInBackend(token);
    window.location.href = "index.html";
  } catch (err) {
    alert("Google login failed: " + err.message);
  }
}

// 📧 Sign in with Email & Password
async function signInWithEmail() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const token = await result.user.getIdToken();
    localStorage.setItem("token", token);
    await ensureUserInBackend(token);
    window.location.href = "index.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
}

// 📝 Register new user with Email & Password
async function registerWithEmail() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName: name });
    const token = await result.user.getIdToken();
    localStorage.setItem("token", token);
    await ensureUserInBackend(token);
    window.location.href = "index.html";
  } catch (err) {
    alert("Registration failed: " + err.message);
  }
}

// 🧠 Sync user with backend
async function ensureUserInBackend(token) {
  try {
    await fetch("http://localhost:3000/api/auth/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error("Backend sync failed:", err);
  }
}

// 🚪 Logout
function logout() {
  auth.signOut().then(() => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}
