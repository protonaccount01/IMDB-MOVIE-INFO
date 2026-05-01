let token = "";
let lastUpdateId = 0;
let chats = {};
let activeChatId = null;

const loginBtn = document.getElementById("login-btn");
const tokenInput = document.getElementById("bot-token");
const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const chatList = document.getElementById("chat-list");
const messageList = document.getElementById("message-list");
const chatHeader = document.getElementById("chat-header");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

loginBtn.addEventListener("click", () => {
token = tokenInput.value.trim();
if (token) {
fetch(`https://api.telegram.org/bot${token}/getMe`)
.then(res => res.json())
.then(data => {
if (data.ok) {
loginScreen.style.display = "none";
chatScreen.style.display = "flex";
pollUpdates();
} else {
alert("Invalid token");
}
})
.catch(() => alert("Connection error"));
}
});

function pollUpdates() {
fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`)
.then(res => res.json())
.then(data => {
if (data.ok && data.result.length > 0) {
data.result.forEach(update => {
lastUpdateId = update.update_id;
if (update.message) {
handleIncomingMessage(update.message);
}
});
renderChatList();
if (activeChatId) {
renderMessages(activeChatId);
}
}
})
.finally(() => {
setTimeout(pollUpdates, 2000);
});
}

function handleIncomingMessage(msg) {
const chatId = msg.chat.id;
const chatName = msg.chat.first_name || msg.chat.title || "User " + chatId;
if (!chats[chatId]) {
chats[chatId] = { name: chatName, messages: [] };
}
let textContent = msg.text;
if (!textContent) {
textContent = "[Media/Non-text message]";
}
chats[chatId].messages.push({ text: textContent, type: "in" });
}

function renderChatList() {
chatList.innerHTML = "";
for (const id in chats) {
const div = document.createElement("div");
div.className = "chat-item";
div.textContent = chats[id].name;
div.onclick = () => {
activeChatId = id;
chatHeader.textContent = chats[id].name;
renderMessages(id);
};
chatList.appendChild(div);
}
}

function renderMessages(id) {
messageList.innerHTML = "";
chats[id].messages.forEach(m => {
const div = document.createElement("div");
div.className = "msg " + m.type;
div.textContent = m.text;
messageList.appendChild(div);
});
messageList.scrollTop = messageList.scrollHeight;
}

sendBtn.addEventListener("click", () => {
const text = messageInput.value.trim();
if (text && activeChatId) {
fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ chat_id: activeChatId, text: text })
})
.then(res => res.json())
.then(data => {
if (data.ok) {
chats[activeChatId].messages.push({ text: text, type: "out" });
renderMessages(activeChatId);
messageInput.value = "";
}
});
}
});
  
