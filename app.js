const API_URL = "https://cha-t.tama-kg-6.workers.dev"; // 自分のURLに
let currentUser = JSON.parse(localStorage.getItem('chaT_user')) || null;
let currentChannelId = "general";
let isSignUp = false;

function toggleSidebar() { document.getElementById('app').classList.toggle('sidebar-open'); }

function toggleAuthMode() {
    isSignUp = !isSignUp;
    document.getElementById('auth-title').textContent = isSignUp ? "chaT に新規登録" : "chaT にログイン";
    document.getElementById('auth-btn').textContent = isSignUp ? "登録する" : "ログイン";
    document.getElementById('auth-displayname').style.display = isSignUp ? "block" : "none";
}

async function handleAuth() {
    const user_id = document.getElementById('auth-userid').value;
    const password = document.getElementById('auth-password').value;
    const display_name = document.getElementById('auth-displayname').value;
    if(!user_id || !password) return alert("入力してください");
    const endpoint = isSignUp ? "/register" : "/login";
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, password, display_name })
        });
        const data = await res.json();
        if (res.ok) {
            if (isSignUp) { alert("登録完了！ログインしてください。"); toggleAuthMode(); }
            else { currentUser = data.user; localStorage.setItem('chaT_user', JSON.stringify(currentUser)); showApp(); }
        } else { alert(data.error); }
    } catch (e) { alert("通信エラー"); }
}

function showApp() {
    document.getElementById('auth-overlay').style.display = "none";
    document.getElementById('app').style.display = "flex";
    document.getElementById('user-display-name').textContent = currentUser.display_name;
    loadUserList();
    loadMessages();
    if(!window.chatInterval) window.chatInterval = setInterval(loadMessages, 3000);
}

async function loadUserList() {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    const userListDiv = document.getElementById('user-list');
    userListDiv.innerHTML = users
        .filter(u => u.user_id !== currentUser.user_id)
        .map(u => `<li onclick="startDM('${u.user_id}', '${u.display_name}')">👤 ${u.display_name}</li>`)
        .join('');
}

function startDM(targetId, targetName) {
    const ids = [currentUser.user_id, targetId].sort();
    currentChannelId = `dm_${ids[0]}_${ids[1]}`;
    updateHeader(`${targetName} とのDM`, false);
    if(window.innerWidth <= 768) toggleSidebar();
    loadMessages();
}

function selectChannel(id) {
    currentChannelId = id;
    const isAnnounce = (id === 'announcement');
    updateHeader(isAnnounce ? "📢 お知らせ" : `# ${id}`, isAnnounce);
    if(window.innerWidth <= 768) toggleSidebar();
    loadMessages();
}

function updateHeader(title, isAnnounce) {
    document.getElementById('display-channel-name').textContent = title;
    const container = document.getElementById('chat-container');
    const inputArea = document.getElementById('input-area');

    if (isAnnounce) {
        container.classList.add('mode-announcement');
        // 管理者(admin)以外はお知らせで入力できないようにする
        inputArea.style.display = (currentUser.user_id === 'admin') ? 'flex' : 'none';
    } else {
        container.classList.remove('mode-announcement');
        inputArea.style.display = 'flex';
    }
}

async function loadMessages() {
    try {
        const res = await fetch(`${API_URL}/messages?channel=${currentChannelId}`);
        const data = await res.json();
        const msgDiv = document.getElementById('messages');
        const isBottom = msgDiv.scrollHeight - msgDiv.scrollTop <= msgDiv.clientHeight + 100;
        msgDiv.innerHTML = data.map(m => `
            <div class="msg-item">
                <div class="msg-user">${m.display_name || m.sender_id}</div>
                <div class="msg-content">${m.content}</div>
            </div>
        `).join('');
        if(isBottom) msgDiv.scrollTop = msgDiv.scrollHeight;
    } catch (e) {}
}

document.getElementById('message-input').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        const content = e.target.value;
        e.target.value = "";
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel_id: currentChannelId, sender_id: currentUser.user_id, content: content })
        });
        loadMessages();
    }
});

function logout() { localStorage.removeItem('chaT_user'); location.reload(); }
window.onload = () => { if (currentUser) showApp(); };
