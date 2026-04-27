const API_URL = "https://cha-t.tama-kg-6.workers.dev"; // ←自分のURLに！
let currentUser = JSON.parse(localStorage.getItem('chaT_user')) || null;
let currentChannelId = "general";
let lastMsgCounts = {}; 
let unreadChannels = new Set();
let isSignUp = false;

function toggleSidebar() { document.getElementById('app').classList.toggle('sidebar-open'); }

function toggleAuthMode() {
    isSignUp = !isSignUp;
    document.getElementById('auth-title').textContent = isSignUp ? "chaT に新規登録" : "chaT にログイン";
    document.getElementById('auth-btn').textContent = isSignUp ? "登録する" : "はじめる";
    document.getElementById('auth-displayname').style.display = isSignUp ? "block" : "none";
}

async function handleAuth() {
    const user_id = document.getElementById('auth-userid').value;
    const password = document.getElementById('auth-password').value;
    const display_name = document.getElementById('auth-displayname').value;
    if(!user_id || !password) return alert("入力してください");
    try {
        const res = await fetch(`${API_URL}${isSignUp ? "/register" : "/login"}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, password, display_name })
        });
        const data = await res.json();
        if (res.ok) {
            if (isSignUp) { alert("完了！ログインしてください"); toggleAuthMode(); }
            else { currentUser = data.user; localStorage.setItem('chaT_user', JSON.stringify(currentUser)); showApp(); }
        } else { alert(data.error); }
    } catch (e) { alert("通信エラー"); }
}

function showApp() {
    document.getElementById('auth-overlay').style.display = "none";
    document.getElementById('app').style.display = "flex";
    document.getElementById('user-display-name').textContent = currentUser.display_name;
    if ("Notification" in window) Notification.requestPermission();
    loadUserList();
    setInterval(updatePolling, 3000);
    selectChannel('general');

    // textareaの自動伸縮
    const tx = document.getElementById('message-input');
    tx.addEventListener('input', () => {
        tx.style.height = 'auto';
        tx.style.height = tx.scrollHeight + 'px';
    });
}

async function updatePolling() {
    await loadMessages(currentChannelId);
    document.querySelectorAll('#sidebar li[data-id]').forEach(li => {
        const id = li.getAttribute('data-id');
        if (id !== currentChannelId) checkUnreadFor(id);
    });
}

async function checkUnreadFor(channelId) {
    try {
        const res = await fetch(`${API_URL}/messages?channel=${channelId}`);
        const data = await res.json();
        if (lastMsgCounts[channelId] !== undefined && data.length > lastMsgCounts[channelId]) {
            unreadChannels.add(channelId);
            renderBadges();
        }
        lastMsgCounts[channelId] = data.length;
    } catch (e) {}
}

async function loadMessages(channelId) {
    try {
        const res = await fetch(`${API_URL}/messages?channel=${channelId}`);
        const data = await res.json();
        const msgDiv = document.getElementById('messages');
        if (lastMsgCounts[channelId] !== undefined && data.length > lastMsgCounts[channelId]) {
            if (data[data.length - 1].sender_id !== currentUser.user_id) {
                document.getElementById('notification-sound').play().catch(()=>{});
            }
        }
        lastMsgCounts[channelId] = data.length;
        if (channelId === currentChannelId) {
            const isBottom = msgDiv.scrollHeight - msgDiv.scrollTop <= msgDiv.clientHeight + 100;
            msgDiv.innerHTML = data.map(m => `
                <div class="msg-item">
                    <div class="msg-user">${m.display_name || m.sender_id}</div>
                    <div class="msg-content">${m.content}</div>
                </div>
            `).join('');
            if(isBottom) msgDiv.scrollTop = msgDiv.scrollHeight;
        }
    } catch (e) {}
}

function renderBadges() {
    document.querySelectorAll('#sidebar li[data-id]').forEach(li => {
        const id = li.getAttribute('data-id');
        let badge = li.querySelector('.unread-badge');
        if (unreadChannels.has(id)) {
            if (!badge) { badge = document.createElement('span'); badge.className = 'unread-badge'; li.appendChild(badge); }
        } else if (badge) { badge.remove(); }
    });
}

function selectChannel(id) {
    currentChannelId = id;
    unreadChannels.delete(id);
    renderBadges();
    const isAnnounce = (id === 'announcement');
    document.getElementById('display-channel-name').textContent = isAnnounce ? "📢 お知らせ" : `# ${id}`;
    const inputArea = document.getElementById('input-area');
    inputArea.style.display = (isAnnounce && currentUser.user_id !== 'admin') ? 'none' : 'flex';
    if(window.innerWidth <= 768) document.getElementById('app').classList.remove('sidebar-open');
    loadMessages(id);
}

// 送信処理
async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    if (!content) return;
    input.value = "";
    input.style.height = 'auto';
    await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: currentChannelId, sender_id: currentUser.user_id, content: content })
    });
    loadMessages(currentChannelId);
}

// PCならEnter(Shiftなし)で送信
document.getElementById('message-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
        e.preventDefault();
        sendMessage();
    }
});

async function loadUserList() {
    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
        document.getElementById('user-list').innerHTML = users
            .filter(u => u.user_id !== currentUser.user_id)
            .map(u => {
                const dmId = `dm_${[currentUser.user_id, u.user_id].sort().join('_')}`;
                return `<li onclick="selectChannel('${dmId}')" data-id="${dmId}">👤 ${u.display_name}</li>`;
            }).join('');
    } catch (e) {}
}

function logout() { localStorage.removeItem('chaT_user'); location.reload(); }
window.onload = () => { if (currentUser) showApp(); };
