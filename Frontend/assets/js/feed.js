document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "http://localhost:3000/api";
  const feedContainer = document.getElementById("feed");
  const postForm = document.getElementById("postForm");
  const postContentInput = document.getElementById("postContent");
  const postFileInput = document.getElementById("postFile");
  const searchInput = document.getElementById("searchInput");

  const userNameEl = document.getElementById("userName");
  const userPhotoEl = document.getElementById("userPhoto");
  const userDescEl = document.getElementById("userDescription");

  let currentUser;
  let allPosts = [];

  // HTML Escape to prevent XSS
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]
    ));
  }

  // Auth check and load feed
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      const token = await user.getIdToken();

      userNameEl.textContent = user.displayName || "User";
      if (user.photoURL) userPhotoEl.src = user.photoURL;

      await syncUserWithBackend(user, token);
      await fetchUserInfo(token);

      loadFeed(token);
      postForm?.addEventListener("submit", (e) => handleCreatePost(e, token));

      // Search handler
      searchInput?.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filtered = allPosts.filter((post) =>
          post.author?.name?.toLowerCase().includes(query)
        );
        renderPosts(filtered, token);
      });
    } else {
      window.location.href = "/pages/login.html";
    }
  });

  async function syncUserWithBackend(user, token) {
    try {
      await fetch(`${apiBase}/auth/verify-sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.displayName || "Unnamed",
          email: user.email || "",
          photoURL: user.photoURL || "",
        }),
      });
    } catch (err) {
      console.error("User sync failed:", err);
    }
  }

  async function fetchUserInfo(token) {
    try {
      const res = await fetch(`${apiBase}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      userDescEl.textContent = data.description || "No description available.";
    } catch (err) {
      userDescEl.textContent = "No description available.";
      console.error("Failed to fetch user info:", err);
    }
  }

  async function handleCreatePost(e, token) {
    e.preventDefault();

    const content = postContentInput.value.trim();
    const file = postFileInput.files[0];
    if (!content && !file) return alert("Please write something or select a file.");

    const formData = new FormData();
    formData.append("content", content);
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${apiBase}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert("Failed to post: " + error.message);
      } else {
        postForm.reset();
        postFileInput.value = null;
        loadFeed(token);
      }
    } catch (err) {
      console.error("Post creation error:", err);
    }
  }

  async function loadFeed(token) {
    if (!feedContainer) {
      console.warn("Feed container not found.");
      return;
    }

    feedContainer.innerHTML = "<p>Loading...</p>";
    try {
      const res = await fetch(`${apiBase}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      allPosts = await res.json();
      renderPosts(allPosts, token);
    } catch (err) {
      console.error("Failed to load posts:", err);
      feedContainer.innerHTML = "<p>Error loading posts.</p>";
    }
  }

  function renderPosts(posts, token) {
    feedContainer.innerHTML = "";

    if (!posts.length) {
      feedContainer.innerHTML = "<p>No posts found.</p>";
      return;
    }

    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    posts.forEach((post) => {
      const postElement = document.createElement("div");
      postElement.className = "post";

      const safeContent = escapeHTML(post.content);
      const safeAuthor = escapeHTML(post.author?.name || "Unknown User");

      postElement.innerHTML = `
        <div class="post-header">
          <strong>${safeAuthor}</strong>
          ${post.author?.description ? `<small>${escapeHTML(post.author.description)}</small>` : ""}
          <span>${new Date(post.createdAt).toLocaleString()}</span>
          ${post.author?.uid === currentUser.uid
            ? `<button class="delete-post" data-id="${post._id}">Delete</button>`
            : ""}
        </div>
        <div class="post-body">
          <p>${safeContent}</p>
          ${
            post.fileUrl
              ? post.fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i)
                ? `<img src="${post.fileUrl}" alt="attachment" style="max-width:100%; margin-top:8px;">`
                : `<a href="${post.fileUrl}" target="_blank" rel="noopener noreferrer">View Attachment</a>`
              : ""
          }
        </div>
        <div class="post-actions">
          <button class="like-btn" data-id="${post._id}">❤️ ${post.likes.length}</button>
        </div>
        <div class="post-comments">
          ${post.comments
            .map((c) => `<p><strong>${escapeHTML(c.name)}:</strong> ${escapeHTML(c.text)}</p>`)
            .join("")}
          <form class="comment-form" data-id="${post._id}">
            <input type="text" placeholder="Add a comment..." required />
            <button type="submit">Comment</button>
          </form>
        </div>
      `;

      feedContainer.appendChild(postElement);
    });

    setupInteractionHandlers(token);
  }

  function setupInteractionHandlers(token) {
    document.querySelectorAll(".like-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const postId = btn.dataset.id;
        try {
          await fetch(`${apiBase}/posts/${postId}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          loadFeed(token);
        } catch (err) {
          console.error("Like error:", err);
        }
      });
    });

    document.querySelectorAll(".comment-form").forEach((form) => {
      const input = form.querySelector("input");

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const postId = form.dataset.id;
        const text = input.value.trim();
        if (!text) return;

        try {
          await fetch(`${apiBase}/posts/${postId}/comment`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          });
          input.value = "";
          loadFeed(token);
        } catch (err) {
          console.error("Comment error:", err);
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          form.querySelector("button").click();
        }
      });
    });

    document.querySelectorAll(".delete-post").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const postId = btn.dataset.id;
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
          await fetch(`${apiBase}/posts/${postId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          loadFeed(token);
        } catch (err) {
          console.error("Delete error:", err);
        }
      });
    });
  }
});
