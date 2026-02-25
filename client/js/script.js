// Admin: Send notification
async function sendNotification() {
  const token = localStorage.getItem("token");
  const message = document.getElementById("notificationMessage").value.trim();
  const statusDiv = document.getElementById("notificationStatus");
  if (!message) {
    statusDiv.innerText = "Message cannot be empty.";
    statusDiv.style.color = "red";
    return;
  }
  try {
    const res = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    if (res.ok) {
      statusDiv.innerText = "Notification sent!";
      statusDiv.style.color = "green";
      document.getElementById("notificationMessage").value = "";
    } else {
      statusDiv.innerText = data.error || "Failed to send notification.";
      statusDiv.style.color = "red";
    }
  } catch (err) {
    statusDiv.innerText = "Server error.";
    statusDiv.style.color = "red";
  }
}
async function register() {
  const name = document.getElementById("name").value;
  const section = document.getElementById("section").value;
  const email = document.getElementById("email").value;
  const rollNumber = document.getElementById("rollNumber").value;
  const phoneNumber = document.getElementById("phoneNumber").value;
  const needSystem = document.getElementById("needSystem").value === "true";

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, section, email, rollNumber, phoneNumber, needSystem })
  });

  const data = await res.json();
  document.getElementById("message").innerText = data.message;
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } else {
    document.getElementById("message").innerText = data.message;
  }
}

async function loadDashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch("/api/dashboard", {
    headers: {
      "Authorization": token
    }
  });

  const data = await res.json();

  document.getElementById("userData").innerHTML = `
    <p>Name: ${data.name}</p>
    <p>Email: ${data.email}</p>
    <p>Status: ${data.status}</p>
    <p>Need System: ${data.needSystem}</p>
    <p>GitHub: ${data.githubLink || "Not Submitted"}</p>
  `;
}

async function submitGithub() {
  const token = localStorage.getItem("token");
  const githubLink = document.getElementById("githubLink").value;

  const res = await fetch("/api/submit-github", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ githubLink })
  });

  const data = await res.json();
  document.getElementById("message").innerText = data.message;
  loadDashboard();
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

async function loadAdminDashboard() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    window.location.href = "login.html";
    return;
  }

  // Load system count
  const countRes = await fetch("/api/system-count", {
    headers: { Authorization: token }
  });
  const countData = await countRes.json();

  document.getElementById("systemCount").innerText =
    `${countData.used} / ${countData.total}`;

  // Load users
  const res = await fetch("/api/all-users", {
    headers: { Authorization: token }
  });

  const users = await res.json();

  let html = `
    <table id="participantsTable">
      <thead>
        <tr>
          <th>Roll Number</th>
          <th>Name</th>
          <th>Section</th>
          <th>Need System</th>
          <th>Phone Number</th>
          <th>GitHub Link</th>
          <th>Status</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
  `;

  users.forEach(user => {
    html += `
      <tr>
        <td>${user.rollNumber}</td>
        <td>${user.name}</td>
        <td>${user.section}</td>
        <td>${user.needSystem ? "Yes" : "No"}</td>
        <td>${user.phoneNumber}</td>
        <td>
          ${user.githubLink && user.githubLink.trim() !== "" 
            ? `<a href="${user.githubLink}" target="_blank" style="color:blue;">View</a>` 
            : "Not Submitted"}
        </td>
        <td>${user.status === "approved" ? "Approved" : "Pending"}</td>
        <td><button onclick="editUser('${user._id}')" style="color:orange;">Edit</button></td>
        <td><button onclick="deleteUser('${user._id}')" style="color:red;">Delete</button></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;

  document.getElementById("userList").innerHTML = html;
}

// Print table in landscape
function printTable() {
  const style = document.createElement('style');
  style.innerHTML = `@media print { @page { size: A4 landscape; } }`;
  document.head.appendChild(style);
  window.print();
  document.head.removeChild(style);
}

// Edit user (placeholder)
function editUser(id) {
  alert('Edit functionality coming soon for user ID: ' + id);
}

async function deleteUser(id) {
  const token = localStorage.getItem("token");

  const confirmDelete = confirm("Are you sure you want to delete this participant?");
  if (!confirmDelete) return;

  await fetch(`/api/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: token }
  });

  loadAdminDashboard();
}

async function approveUser(id) {
  const token = localStorage.getItem("token");

  await fetch(`/api/approve/${id}`, {
    method: "PUT",
    headers: { "Authorization": token }
  });

  loadAdminDashboard();
}

async function loadAdminDashboard() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    window.location.href = "login.html";
    return;
  }

  // Load system count
  const countRes = await fetch("/api/system-count", {
    headers: { "Authorization": token }
  });

  const countData = await countRes.json();
  document.getElementById("systemCount").innerText =
    `Used: ${countData.used} | Remaining: ${countData.remaining}`;

  // Load all users
  const res = await fetch("/api/all-users", {
    headers: { "Authorization": token }
  });

  const users = await res.json();

  let html = "";

  users.forEach(user => {
    html += `
      <div style="border:1px solid #ddd; padding:10px; margin:10px 0;">
        <p><strong>${user.name}</strong></p>
        <p>Email: ${user.email}</p>
        <p>Roll: ${user.rollNumber}</p>
        <p>Status: ${user.status}</p>
        <p>Need System: ${user.needSystem}</p>
        <p>GitHub: ${user.githubLink || "Not Submitted"}</p>
        ${user.status === "pending"
          ? `<button onclick="approveUser('${user._id}')">Approve</button>`
          : ""}
      </div>
    `;
  });

  document.getElementById("userList").innerHTML = html;
}

async function approveUser(id) {
  const token = localStorage.getItem("token");

  await fetch(`/api/approve/${id}`, {
    method: "PUT",
    headers: { "Authorization": token }
  });

  loadAdminDashboard();
}