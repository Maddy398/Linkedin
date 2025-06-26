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

async function syncUserWithBackend(user, token) {
  await fetch("http://localhost:3000/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: user.displayName || "No Name",
      email: user.email,
      photoURL: user.photoURL || "",
    }),
  });
}

async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const token = await result.user.getIdToken();
    localStorage.setItem("token", token);

    await syncUserWithBackend(result.user, token); 
    window.location.href = "index.html";
  } catch (err) {
    alert("Google login failed: " + err.message);
  }
}

async function signInWithEmail() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // Try to sign in
    const result = await auth.signInWithEmailAndPassword(email, password);
    const token = await result.user.getIdToken();
    localStorage.setItem("token", token);

    // Sync to backend
    await syncUserWithBackend(result.user, token);
    window.location.href = "index.html";

  } catch (err) {
    // If user doesn't exist, register instead
    if (err.code === "auth/user-not-found") {
      try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        const token = await result.user.getIdToken();
        localStorage.setItem("token", token);

        // Use email as name since displayName is null
        const fakeDisplayName = email.split("@")[0];

        await syncUserWithBackend(
          {
            displayName: fakeDisplayName,
            email,
            photoURL: "", // no photo for email/password users
          },
          token
        );

        window.location.href = "index.html";
      } catch (signupErr) {
        alert("Signup failed: " + signupErr.message);
      }
    } else {
      alert("Login failed: " + err.message);
    }
  }
}
