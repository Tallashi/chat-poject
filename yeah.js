// ==== ÉLÉMENTS DOM ====
const loginCard = document.getElementById("loginCard");
const roomCard = document.getElementById("roomCard");
const chatCard = document.getElementById("chatCard");

const pseudoInput = document.getElementById("pseudoInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const statusDiv = document.getElementById("status");

const roomListDiv = document.getElementById("roomList");
const newRoomName = document.getElementById("newRoomName");
const newRoomPassword = document.getElementById("newRoomPassword");
const createRoomBtn = document.getElementById("createRoomBtn");

const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const roomTitle = document.getElementById("roomTitle");

const adminBtn = document.getElementById("adminBtn");
const adminPopup = document.getElementById("adminPopup");
const userListDiv = document.getElementById("userList");
const closePopupBtn = document.getElementById("closePopupBtn");

// ==== VARIABLES ====
let user = localStorage.getItem("user") || null;
let currentRoom = null;

// ==== CONNEXION AUTOMATIQUE ====
if (user) showRoomSelection();

// ==== LOGIN / INSCRIPTION ====
loginBtn.onclick = () => {
    const pseudo = pseudoInput.value.trim();
    const password = passwordInput.value.trim();
    if (!pseudo || !password) return alert("Pseudo et mot de passe requis");

    let accounts = JSON.parse(localStorage.getItem("accounts")) || {};

    if (accounts[pseudo]) {
        if (accounts[pseudo] !== password) return alert("Mot de passe incorrect");
    } else {
        accounts[pseudo] = password;
        localStorage.setItem("accounts", JSON.stringify(accounts));
        alert("Compte créé !");
    }

    user = pseudo;
    localStorage.setItem("user", user);
    showRoomSelection();
};

// ==== AFFICHER SALON ====
function showRoomSelection() {
    loginCard.classList.add("hidden");
    chatCard.classList.add("hidden");
    roomCard.classList.remove("hidden");
    statusDiv.innerText = "Connecté : " + user;
    renderRoomList();
}

// ==== RENDER SALONS ====
function renderRoomList() {
    roomListDiv.innerHTML = "";
    let rooms = JSON.parse(localStorage.getItem("rooms")) || {};

    for (let name in rooms) {
        const div = document.createElement("div");
        div.className = "roomItem";
        div.innerText = name;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        // === CLIC NORMAL (SI PAS GLISSÉ) ===
        div.addEventListener("click", () => {
            if (!isDragging) {
                joinRoom(name, prompt("Mot de passe du salon :"));
            }
        });

        // === SOURIS ===
        div.addEventListener("mousedown", (e) => {
            startX = e.clientX;
            isDragging = true;
            div.classList.remove("swiping");
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            currentX = e.clientX - startX;

            if (currentX < 0) {
                div.style.transform = `translateX(${currentX}px)`;
                div.classList.add("swiping");
            }
        });

        document.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;

            if (currentX < -120) {
                deleteRoom(name, div);
            } else {
                div.style.transform = "translateX(0)";
                div.classList.remove("swiping");
            }
            currentX = 0;
        });

        // === TACTILE (MOBILE) ===
        div.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
        });

        div.addEventListener("touchmove", (e) => {
            currentX = e.touches[0].clientX - startX;
            if (currentX < 0) {
                div.style.transform = `translateX(${currentX}px)`;
                div.classList.add("swiping");
            }
        });

        div.addEventListener("touchend", () => {
            if (currentX < -120) {
                deleteRoom(name, div);
            } else {
                div.style.transform = "translateX(0)";
                div.classList.remove("swiping");
            }
            currentX = 0;
        });

        roomListDiv.appendChild(div);
    }
}



// ==== CRÉER SALON ====
createRoomBtn.onclick = () => {
    const name = newRoomName.value.trim();
    const pass = newRoomPassword.value.trim();
    if (!name || !pass) return alert("Nom et mot de passe requis");

    let rooms = JSON.parse(localStorage.getItem("rooms")) || {};
    if (rooms[name]) return alert("Ce salon existe déjà");

    rooms[name] = { password: pass, messages: [], admin: user, banned: [] };
    localStorage.setItem("rooms", JSON.stringify(rooms));
    alert("Salon créé ! Vous êtes l'admin.");
    newRoomName.value = "";
    newRoomPassword.value = "";
    renderRoomList();
};

// ==== REJOINDRE SALON ====
function joinRoom(name, pass) {
    let rooms = JSON.parse(localStorage.getItem("rooms"));
    if (!rooms[name]) return alert("Salon suprimer");
    if (rooms[name].password !== pass) return alert("Mot de passe incorrect");

    currentRoom = name;
    roomCard.classList.add("hidden");
    chatCard.classList.remove("hidden");
    roomTitle.innerText = "Salon : " + currentRoom;
    renderMessages();
    updateAdminBtn();
}

// ==== ENVOYER MESSAGE AVEC IMAGE ====
sendBtn.onclick = () => {
    const text = messageInput.value.trim();
    const file = imageInput.files[0];

    if (!text && !file) return alert("Écrivez un message ou choisissez une image.");

    let rooms = JSON.parse(localStorage.getItem("rooms"));
    if (rooms[currentRoom].banned.includes(user)) return alert("Vous êtes banni de ce salon !");

    const newMessage = { user, text, time: new Date().toLocaleTimeString() };

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            newMessage.image = e.target.result;
            rooms[currentRoom].messages.push(newMessage);
            localStorage.setItem("rooms", JSON.stringify(rooms));
            messageInput.value = "";
            imageInput.value = "";
            renderMessages();
        };
        reader.readAsDataURL(file);
    } else {
        rooms[currentRoom].messages.push(newMessage);
        localStorage.setItem("rooms", JSON.stringify(rooms));
        messageInput.value = "";
        renderMessages();
    }
};

// ==== RENDER MESSAGES ====
function renderMessages() {
    messagesDiv.innerHTML = "";
    const rooms = JSON.parse(localStorage.getItem("rooms"));
    const msgs = rooms[currentRoom].messages;
    const admin = rooms[currentRoom].admin;

    msgs.forEach((m, index) => {
        const div = document.createElement("div");

        if (m.user === admin) {
            div.className = m.user === user ? "message user" : "message admin";
        } else {
            div.className = m.user === user ? "message user" : "message other";
        }

        let content = `
      <strong>${m.user}</strong>
      <span class="small">${m.time}</span>
      <div>${m.text || ""}</div>
    `;

        if (m.image) {
            content += `<img src="${m.image}" class="chatImage" />`;
        }

        div.innerHTML = content;

        // === SWIPE LOGIC ===
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        // SOURIS
        div.addEventListener("mousedown", (e) => {
            startX = e.clientX;
            isDragging = true;
            div.classList.remove("swiping");
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            currentX = e.clientX - startX;

            if (currentX < 0) {
                div.style.transform = `translateX(${currentX}px)`;
                div.classList.add("swiping");
            }
        });

        document.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;

            if (currentX < -120) {
                deleteMessage(index, div);
            } else {
                div.style.transform = "translateX(0)";
                div.classList.remove("swiping");
            }
            currentX = 0;
        });

        // TACTILE
        div.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
        });

        div.addEventListener("touchmove", (e) => {
            currentX = e.touches[0].clientX - startX;
            if (currentX < 0) {
                div.style.transform = `translateX(${currentX}px)`;
                div.classList.add("swiping");
            }
        });

        div.addEventListener("touchend", () => {
            if (currentX < -120) {
                deleteMessage(index, div);
            } else {
                div.style.transform = "translateX(0)";
                div.classList.remove("swiping");
            }
            currentX = 0;
        });

        messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ==== ADMIN BUTTON ====
function updateAdminBtn() {
    const rooms = JSON.parse(localStorage.getItem("rooms"));
    if (!currentRoom) return;
    const admin = rooms[currentRoom].admin;
    adminBtn.classList.toggle("hidden", user !== admin);
}

adminBtn.onclick = () => {
    adminPopup.classList.toggle("hidden");
};

closePopupBtn.onclick = () => {
    adminPopup.classList.add("hidden");
};

// ==== QUITTER SALON ====
leaveRoomBtn.onclick = () => {
    chatCard.classList.add("hidden");
    currentRoom = null;
    showRoomSelection();
};

// ==== DÉCONNEXION ====
logoutBtn.onclick = () => {
    localStorage.removeItem("user");
    user = null;
    chatCard.classList.add("hidden");
    roomCard.classList.add("hidden");
    loginCard.classList.remove("hidden");
    statusDiv.innerText = "Non connecté";
};
//==== deleteroom ==== 
function deleteRoom(roomName, element) {
    if (!confirm(`Supprimer le salon "${roomName}" ?`)) {
        element.style.transform = "translateX(0)";
        element.classList.remove("swiping");
        return;
    }

    let rooms = JSON.parse(localStorage.getItem("rooms")) || {};
    delete rooms[roomName];
    localStorage.setItem("rooms", JSON.stringify(rooms));

    element.style.opacity = "0";
    element.style.transform = "translateX(-100%)";

    setTimeout(() => {
        element.remove();
    }, 300);
}
// ==== delete message ====
function deleteMessage(index, element) {
    const rooms = JSON.parse(localStorage.getItem("rooms"));
    const msg = rooms[currentRoom].messages[index];

    // Sécurité : l’auteur ou l’admin seulement
    if (msg.user !== user && rooms[currentRoom].admin !== user) {
        alert("Tu ne peux supprimer que tes messages.");
        element.style.transform = "translateX(0)";
        element.classList.remove("swiping");
        return;
    }

    if (!confirm("Supprimer ce message ?")) {
        element.style.transform = "translateX(0)";
        element.classList.remove("swiping");
        return;
    }

    rooms[currentRoom].messages.splice(index, 1);
    localStorage.setItem("rooms", JSON.stringify(rooms));

    element.style.opacity = "0";
    element.style.transform = "translateX(-100%)";

    setTimeout(() => {
        renderMessages();
    }, 250);
}
