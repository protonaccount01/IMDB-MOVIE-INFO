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
const fileInput = document.getElementById("file-input");
const attachBtn = document.getElementById("attach-btn");

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
let textContent = msg.text || "";
let fileObj = null;

if (msg.photo) {
textContent = msg.caption || "";
fileObj = { type: "photo", id: msg.photo[msg.photo.length - 1].file_id };
} else if (msg.document) {
textContent = msg.caption || "";
fileObj = { type: "document", id: msg.document.file_id, name: msg.document.file_name };
} else if (msg.video) {
textContent = msg.caption || "";
fileObj = { type: "document", id: msg.video.file_id, name: msg.video.file_name || "Video" };
} else if (msg.audio) {
textContent = msg.caption || "";
fileObj = { type: "document", id: msg.audio.file_id, name: msg.audio.file_name || "Audio" };
} else if (!msg.text) {
textContent = "[Unsupported media]";
}

chats[chatId].messages.push({ text: textContent, type: "in", file: fileObj });
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

if (m.file) {
if (m.file.type === "photo") {
const img = document.createElement("img");
img.style.maxWidth = "100%";
img.style.borderRadius = "4px";
img.style.marginBottom = "5px";

if (m.type === "in") {
fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${m.file.id}`)
.then(res => res.json())
.then(data => {
if(data.ok) {
img.src = `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}
});
} else {
img.src = m.file.url;
}
div.appendChild(img);
div.appendChild(document.createElement("br"));
} else if (m.file.type === "document") {
const fileLink = document.createElement("a");
fileLink.className = "file-attachment";
fileLink.textContent = m.file.name || "File Attachment";
fileLink.target = "_blank";

if (m.type === "in") {
fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${m.file.id}`)
.then(res => res.json())
.then(data => {
if(data.ok) {
fileLink.href = `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}
});
} else {
fileLink.href = "#";
fileLink.textContent = "Sent: " + (m.file.name || "File");
}
div.appendChild(fileLink);
div.appendChild(document.createElement("br"));
}
}

const span = document.createElement("span");
span.textContent = m.text;
div.appendChild(span);
messageList.appendChild(div);
});
messageList.scrollTop = messageList.scrollHeight;
}

attachBtn.addEventListener("click", () => {
fileInput.click();
});

sendBtn.addEventListener("click", () => {
const text = messageInput.value.trim();
const file = fileInput.files[0];

if (!activeChatId) return;

if (file) {
const formData = new FormData();
formData.append("chat_id", activeChatId);

let endpoint = "sendDocument";
let fileField = "document";
let fType = "document";

if (file.type.startsWith("image/")) {
endpoint = "sendPhoto";
fileField = "photo";
fType = "photo";
}

formData.append(fileField, file);
if (text) formData.append("caption", text);

fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
method: "POST",
body: formData
})
.then(res => res.json())
.then(data => {
if (data.ok) {
const localUrl = URL.createObjectURL(file);
chats[activeChatId].messages.push({
text: text,
type: "out",
file: { type: fType, url: localUrl, name: file.name }
});
renderMessages(activeChatId);
messageInput.value = "";
fileInput.value = "";
}
});
} else if (text) {
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
  
