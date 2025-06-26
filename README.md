🛠️ Built a full-stack LinkedIn — focusing on scalable backend logic, secure auth, and dynamic client-side rendering.
This project simulates core LinkedIn functionalities using a Firebase + Node.js + MongoDB stack. Designed to deepen my experience with real-world architecture and production-ready APIs.

🔧 Tech Stack & Architecture:

Frontend:  HTML,CSS,JS
Auth: Firebase Authentication (Gmail login), token-based access
Backend: Node.js + Express with JWT validation via Firebase Admin SDK
Database: MongoDB (Mongoose models for users, posts, messages)
Deployment: Netlify 

📌 Key Features:

🔐 Auth-protected endpoints using Firebase ID tokens

📝 Feed system: Create/Delete posts, like/comment in real-time

🤝 Connection workflow: Send/accept/reject requests with relational updates

👤 Profile management with profile picture upload and work description updates

💬 Messaging system between connected users only (chat-style interface)

🔍 User discovery with live search and connection status tracking

📈 Backend routes optimized for minimal DB calls and authorization checks

🧠 Key Challenges Solved:

Handling user state across frontend/backend using Firebase tokens
Designing DB schemas for 3-way connection states (sent, received, accepted)
Message threading logic between pairs of users
Enforcing access control (e.g., only connections can view each other's profiles/messages)
💬 Would love to connect with fellow devs for feedback, collaboration, or deeper discussions on design patterns and improvements.
