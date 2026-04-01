// auth.js - 全局认证工具

// 1. 初始化检查：页面加载时运行
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    createLoginModal(); // 确保弹窗HTML存在于页面中
});

// 2. 检查登录状态
function checkLoginStatus() {
    // 1. 修改目标：寻找我们刚刚在 HTML 里创建的 id="nav-buttons" 的容器
    const buttonContainer = document.getElementById('nav-buttons');
    if (!buttonContainer) return; // 如果找不到容器就退出

    const user = localStorage.getItem('campus_user');

    // 清空容器，防止重复添加
    buttonContainer.innerHTML = '';

    if (user) {
        // 2. 如果已登录，显示：欢迎信息 + 退出按钮
        buttonContainer.innerHTML = `
            <span style="color:white; margin-right: 10px;">你好, <b>${user}</b></span>
            <button onclick="handleLogout()" style="
                background: rgba(255,255,255,0.2); 
                border: 1px solid #fff; 
                color: #fff; 
                padding: 5px 15px; 
                border-radius: 15px; 
                cursor: pointer;
                backdrop-filter: blur(5px);
            ">退出</button>
        `;
    } else {
        // 3. 如果未登录，显示：登录按钮
        buttonContainer.innerHTML = `
            <button 
                onclick="openLoginModal()" 
                style="
                    background: #3498db; 
                    color: white; 
                    border: none; 
                    padding: 8px 20px; 
                    border-radius: 15px; 
                    cursor: pointer; 
                    font-weight: bold;
                    transition: 0.3s;
                "
            >
                🔑 登录
            </button>
        `;
    }
}

// 3. 动态创建登录弹窗 HTML (如果页面里没有的话)
function createLoginModal() {
    if (document.getElementById('global-login-overlay')) return;
    
    // 1. 在 .login-box 内顶部添加关闭按钮 (×)
    const modalHTML = `
    <div id="global-login-overlay" class="login-overlay">
        <div class="login-box">
            <button type="button" class="login-close-btn">×</button>
            <h2 class="login-title">欢迎回来</h2>
            <p class="login-subtitle">请登录以发布内容或管理信息</p>
            <form id="global-login-form">
                <div class="input-group">
                    <label>学号 / 用户名</label>
                    <input type="text" id="global-username" placeholder="请输入学号" required>
                </div>
                <div class="input-group">
                    <label>密码</label>
                    <input type="password" id="global-password" placeholder="请输入密码" required>
                </div>
                <button type="submit" class="btn-login">立即登录</button>
            </form>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 绑定表单提交事件
    document.getElementById('global-login-form').addEventListener('submit', handleLogin);
    
    // 2. 新增：绑定关闭事件
    const overlay = document.getElementById('global-login-overlay');
    const closeBtn = document.querySelector('.login-close-btn');
    
    // 点击关闭按钮
    closeBtn.onclick = function() {
        overlay.classList.remove('active');
    };
    
    // 点击遮罩层背景关闭 (防止点击弹窗内部时关闭，所以用了 event.stopPropagation)
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    };
}
// 4. 打开弹窗
window.openLoginModal = function() {
    const modal = document.getElementById('global-login-overlay');
    if (modal) {
        modal.classList.add('active');
    }
}

// 5. 修复后的处理登录逻辑
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('global-username').value;
    const password = document.getElementById('global-password').value;
    
    // 验证用户名和密码
    if (validateCredentials(username, password)) {
        // 保存用户
        localStorage.setItem('campus_user', username);
        
        // 关闭弹窗
        document.getElementById('global-login-overlay').classList.remove('active');
        
        // 刷新页面以显示登录状态
        location.reload();
    } else {
        alert('用户名或密码错误');
    }
}

// 验证凭据函数
function validateCredentials(username, password) {
    // 获取预设的用户数据（在实际应用中，这些应该从服务器获取）
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    // 检查用户是否存在且密码匹配
    if (users[username] && users[username].password === hashPassword(password)) {
        return true;
    }
    
    return false;
}

// 密码哈希函数（简单示例，生产环境应使用更强的哈希算法）
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
}

// 用户注册功能（用于创建账户）
function registerUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    // 检查用户是否已存在
    if (users[username]) {
        alert('用户已存在');
        return false;
    }
    
    // 创建新用户
    users[username] = {
        password: hashPassword(password),
        createdAt: new Date().toISOString()
    };
    
    // 保存用户数据
    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

// 初始化默认用户（仅用于演示，生产环境不应有默认用户）
function initializeDefaultUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (Object.keys(users).length === 0) {
        users['admin'] = {
            password: hashPassword('admin123'),
            createdAt: new Date().toISOString()
        };
        users['user'] = {
            password: hashPassword('user123'),
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// 在页面加载时初始化默认用户
document.addEventListener('DOMContentLoaded', initializeDefaultUsers);

// 6. 处理退出逻辑
window.handleLogout = function() {
    localStorage.removeItem('campus_user');
    location.reload();
}

// 7. 添加必要的 CSS 样式到页面
const style = document.createElement('style');
style.textContent = `
    .login-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px);
        z-index: 9999; display: flex; justify-content: center; align-items: center;
        opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
    }
    .login-overlay.active { opacity: 1; pointer-events: all; }
    .login-box {
        background: white; padding: 40px; border-radius: 20px;
        width: 90%; max-width: 400px; box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        text-align: center; transform: translateY(20px); transition: transform 0.3s ease;
    }
    .login-overlay.active .login-box { transform: translateY(0); }
    .login-title { font-size: 1.8rem; margin-bottom: 10px; color: #2c3e50; }
    .login-subtitle { color: #666; margin-bottom: 30px; font-size: 0.9rem; }
    .input-group { margin-bottom: 20px; text-align: left; }
    .input-group label { display: block; margin-bottom: 8px; font-weight: bold; color: #555; }
    .input-group input { width: 100%; padding: 12px; border: 2px solid #eee; border-radius: 10px; font-size: 1rem; }
    .input-group input:focus { border-color: #3498db; outline: none; }
    .btn-login { width: 100%; padding: 14px; background: linear-gradient(135deg, #3498db, #2c3e50); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: bold; cursor: pointer; }
    .btn-login:hover { opacity: 0.9; }
     .login-close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #999;
        line-height: 1;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    /* 悬停效果 */
    .login-close-btn:hover {
        background-color: #f0f0f0;
        color: #333;
    }
    
    /* 确保 .login-box 的位置是 relative，这样按钮才能绝对定位在它上面 */
    .login-box {
        position: relative;
        background: white;
        padding: 40px;
        border-radius: 20px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        text-align: center;
        transform: translateY(20px);
        transition: transform 0.3s ease;
`;
document.head.appendChild(style);