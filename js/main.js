ts-nocheck
// 下面是你的代码...
// // 通用工具
// 在 main.js 顶部添加（如果未全局暴露）
const getCurrentUser = () => sessionStorage.getItem('currentUser');
function genId() { return new Date().getTime(); }
function fmtTime(timestampOrDatetime) {
  // 兼容时间戳和datetime-local字符串
  let d;
  if (typeof timestampOrDatetime === "number") {
    d = new Date(timestampOrDatetime);
  } else if (typeof timestampOrDatetime === "string") {
    d = new Date(timestampOrDatetime.replace("T", " "));
  } else {
    d = new Date();
  }
  // 补零处理，保证格式统一（如 2024-05-01 14:05）
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 替换原有的save函数
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001';

// ✅ 保存发布信息（type = 'second', 'lost', 'activity'）
async function save(key, data) {
  try {
    // 添加必要字段
    const payload = {
      ...data,
      type: key,
      publisher: getCurrentUser() || 'anonymous',
      publishedAt: new Date().toISOString(),
      status: 'active'
    };

    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('保存失败');
    }

    const result = await response.json();
    console.log('发布成功，ID:', result.id);
    return result.id;
  } catch (error) {
    console.error('保存数据失败:', error);
    alert('发布失败，请检查网络');
  }
}

// ✅ 获取某类所有信息
async function get(key) {
  try {
    const response = await fetch(`${API_BASE_URL}/items?type=${encodeURIComponent(key)}`);
    if (!response.ok) throw new Error('获取数据失败');
    const items = await response.json();
    return items;
  } catch (error) {
    console.error('获取数据失败:', error);
    return [];
  }
}

// ✅ 获取单条信息（用于 detail.html）
async function getOne(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('获取详情失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取单条数据失败:', error);
    return null;
  }
}

// 发布表单切换
function changeType() {
  let type = document.getElementById("type").value;
  let form = document.getElementById("form");
  if (type === "second") {
    form.innerHTML = `
      <div class="mb-3"><label>物品名称</label><input id="title" class="form-control"></div>
      <div class="mb-3"><label>价格</label><input id="price" class="form-control"></div>
      <div class="mb-3"><label>分类</label><select id="stype" class="form-select"><option>书籍</option><option>数码</option><option>生活用品</option><option>其他</option></select></div>
      <div class="mb-3"><label>描述</label><textarea id="desc" class="form-control"></textarea></div>
      <div class="mb-3"><label>联系方式</label><input id="contact" class="form-control"></div>
    `;
  } else if (type === "activity") {
    form.innerHTML = `
      <div class="mb-3"><label>活动标题</label><input id="title" class="form-control"></div>
      <div class="mb-3"><label>主办单位</label><input id="org" class="form-control"></div>
<div class="mb-3">
        <label>活动时间</label>
        <div class="row g-2">
          <div class="col-6">
            <input id="startTime" type="datetime-local" class="form-control" placeholder="开始时间">
          </div>
          <div class="col-6">
            <input id="endTime" type="datetime-local" class="form-control" placeholder="结束时间">
          </div>
        </div>
      </div>
      <div class="mb-3"><label>地点</label><input id="place" class="form-control"></div>
      <div class="mb-3"><label>内容</label><textarea id="content" class="form-control"></textarea></div>
      <div class="mb-3"><label>联系方式</label><input id="contact" class="form-control"></div>
    `;
  } else {
    form.innerHTML = `
      <div class="mb-3"><label>类型</label><select id="ltype" class="form-select"><option>寻物启事</option><option>失物招领</option></select></div>
      <div class="mb-3"><label>物品名称</label><input id="name" class="form-control"></div>
      <div class="mb-3"><label>时间</label><input id="ltime" type="datetime-local" class="form-control"></div>
      <div class="mb-3"><label>地点</label><input id="lplace" class="form-control"></div>
      <div class="mb-3"><label>描述</label><textarea id="ldesc" class="form-control"></textarea></div>
      <div class="mb-3"><label>联系方式</label><input id="lcontact" class="form-control"></div>
    `;
  }
}

// 提交发布
// 提交发布 - 改造 submitPublish 函数
// 提交发布 - 新增必填项校验
function submitPublish() {
  // 1. 先校验登录状态
  const user = localStorage.getItem('campus_user');
  if (!user) {
    alert("请先登录后再发布信息！");
    openLoginModal(); // 打开登录弹窗
    return;
  }

  let type = document.getElementById("type").value;
  let qq = document.getElementById("qq")?.value || ""; // QQ 可选
  let wx = document.getElementById("wx")?.value || ""; // 微信 可选

  // ===== 核心：必填项校验逻辑 =====
  // 定义校验结果和提示信息
  let isValidate = true;
  let errorMsg = "";

  // 分类型校验必填项
  if (type === "second") { // 二手物品发布
    const title = document.getElementById("title").value.trim();
    const price = document.getElementById("price").value.trim();
    const stype = document.getElementById("stype").value.trim();
    const desc = document.getElementById("desc").value.trim();
    const contact = document.getElementById("contact").value.trim();

    // 逐项校验
    if (!title) { errorMsg = "物品名称不能为空！"; isValidate = false; }
    else if (!price) { errorMsg = "价格不能为空！"; isValidate = false; }
    else if (!stype) { errorMsg = "物品分类不能为空！"; isValidate = false; }
    else if (!desc) { errorMsg = "物品描述不能为空！"; isValidate = false; }
    else if (!contact) { errorMsg = "联系人不能为空！"; isValidate = false; }

  } else if (type === "activity") { // 活动发布
    const title = document.getElementById("title").value.trim();
    const org = document.getElementById("org").value.trim();
   const startTime = document.getElementById("startTime").value.trim();
    const endTime = document.getElementById("endTime").value.trim();
    const place = document.getElementById("place").value.trim();
    const content = document.getElementById("content").value.trim();
    const contact = document.getElementById("contact").value.trim();

    // 逐项校验
    if (!title) { errorMsg = "活动标题不能为空！"; isValidate = false; }
    else if (!org) { errorMsg = "主办单位不能为空！"; isValidate = false; }
   else if (!startTime) { errorMsg = "活动开始时间不能为空！"; isValidate = false; }
    else if (!endTime) { errorMsg = "活动结束时间不能为空！"; isValidate = false; }
    // 额外校验：结束时间不能早于开始时间
    else if (new Date(endTime) < new Date(startTime)) {
      errorMsg = "结束时间不能早于开始时间！"; isValidate = false;
    }
    else if (!place) { errorMsg = "活动地点不能为空！"; isValidate = false; }
    else if (!content) { errorMsg = "活动内容不能为空！"; isValidate = false; }
    else if (!contact) { errorMsg = "活动联系人不能为空！"; isValidate = false; }

  } else if (type === "lost") { // 失物招领发布
    const ltype = document.getElementById("ltype").value.trim();
    const name = document.getElementById("name").value.trim();
    const ltime = document.getElementById("ltime").value.trim();
    const lplace = document.getElementById("lplace").value.trim();
    const ldesc = document.getElementById("ldesc").value.trim();
    const lcontact = document.getElementById("lcontact").value.trim();

    // 逐项校验
    if (!ltype) { errorMsg = "类型（寻物/招领）不能为空！"; isValidate = false; }
    else if (!name) { errorMsg = "物品名称不能为空！"; isValidate = false; }
    else if (!ltime) { errorMsg = "时间不能为空！"; isValidate = false; }
    else if (!lplace) { errorMsg = "地点不能为空！"; isValidate = false; }
    else if (!ldesc) { errorMsg = "描述不能为空！"; isValidate = false; }
    else if (!lcontact) { errorMsg = "联系人不能为空！"; isValidate = false; }
  }

  // 校验不通过则提示并终止发布
  if (!isValidate) {
    alert(errorMsg);
    return;
  }

  // ===== 校验通过后，执行原有发布逻辑 =====
  if (type === "second") {
    let data = {
      id: genId(), 
      title: document.getElementById("title").value,
      price: document.getElementById("price").value, 
      type: document.getElementById("stype").value,
      desc: document.getElementById("desc").value, 
      contact: document.getElementById("contact").value,
      time: genId(),
      publisher: user,
      qq: qq,
      wx: wx
    };
    save("second", data);
  } else if (type === "activity") {
    let data = {
      id: genId(), 
      title: document.getElementById("title").value, 
      org: document.getElementById("org").value,
      startTime: document.getElementById("startTime").value,
      endTime: document.getElementById("endTime").value,
      time: `${document.getElementById("startTime").value} 至 ${document.getElementById("endTime").value}`,
      place: document.getElementById("place").value,
      content: document.getElementById("content").value, 
      contact: document.getElementById("contact").value,
      publisher: user,
      qq: qq,
      wx: wx
    };
    save("activity", data);
  } else {
    let data = {
      id: genId(), 
      type: document.getElementById("ltype").value, 
      name: document.getElementById("name").value,
      time: document.getElementById("ltime").value, 
      place: document.getElementById("lplace").value,
      desc: document.getElementById("ldesc").value, 
      contact: document.getElementById("lcontact").value,
      publisher: user,
      qq: qq,
      wx: wx
    };
    save("lost", data);
  }
  
  alert("发布成功！");
  location.href = "index.html";
}
// 加载列表
function loadSecondList() {
  let list = get("second");
  const currentUser = localStorage.getItem('campus_user'); // 获取当前登录用户
  let html = "";
  list.forEach(item => {
    // 仅发布者显示删除按钮
    const deleteBtn = (currentUser && item.publisher === currentUser) 
      ? `<button onclick="deleteItem('second', ${item.id})" class="btn btn-sm btn-danger ms-2">删除</button>` 
      : "";

    html += `
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h5>${item.title}</h5>
            <p>价格：${item.price} 元</p>
            <p>分类：${item.type}</p>
            <a href="detail.html?type=second&id=${item.id}" class="btn btn-sm btn-primary">查看详情</a>
            ${deleteBtn} <!-- 插入删除按钮 -->
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById("list").innerHTML = html;
}
// 改造 loadActivityList
function loadActivityList() {
  let list = get("activity");
  const currentUser = localStorage.getItem('campus_user');
  let html = "";
  list.forEach(item => {
    const deleteBtn = (currentUser && item.publisher === currentUser) 
      ? `<button onclick="deleteItem('activity', ${item.id})" class="btn btn-sm btn-danger ms-2">删除</button>` 
      : "";

    html += `
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h5>${item.title}</h5>
            <p>主办：${item.org}</p>
            <p>时间：${item.time}</p>
            <a href="detail.html?type=activity&id=${item.id}" class="btn btn-sm btn-primary">查看详情</a>
            ${deleteBtn}
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById("list").innerHTML = html;
}

// 改造 loadLostList
function loadLostList() {
  let list = get("lost");
  const currentUser = localStorage.getItem('campus_user');
  let html = "";
  list.forEach(item => {
    const deleteBtn = (currentUser && item.publisher === currentUser) 
      ? `<button onclick="deleteItem('lost', ${item.id})" class="btn btn-sm btn-danger ms-2">删除</button>` 
      : "";

    html += `
      <div class="col-md-4">
        <div class="card h-100 ${item.type === "寻物启事" ? "border-warning" : "border-success"}">
          <div class="card-body">
            <h5>${item.name}</h5>
            <p>${item.type}</p>
            <p>地点：${item.place}</p>
            <a href="detail.html?type=lost&id=${item.id}" class="btn btn-sm btn-primary">查看详情</a>
            ${deleteBtn}
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById("list").innerHTML = html;
}

// 搜索
function searchSecond() {
  let key = document.getElementById("search").value;
  let list = get("second");
  let arr = list.filter(item => item.title.includes(key));
  let html = "";
  arr.forEach(item => {
    html += `
      <div class="col-md-4">
        <div class="card h-100"><div class="card-body">
          <h5>${item.title}</h5><p>价格：${item.price}</p>
          <a href="detail.html?type=second&id=${item.id}" class="btn btn-sm btn-primary">详情</a>
        </div></div>
      </div>
    `;
  });
  document.getElementById("list").innerHTML = html;
}
function searchActivity() {
  let key = document.getElementById("search").value;
  let list = get("activity").filter(item => item.title.includes(key));
  let html = "";
  list.forEach(item => {
    html += `
      <div class="col-md-4"><div class="card h-100"><div class="card-body">
        <h5>${item.title}</h5><p>${item.time}</p>
        <a href="detail.html?type=activity&id=${item.id}" class="btn btn-sm btn-primary">详情</a>
      </div></div></div>
    `;
  });
  document.getElementById("list").innerHTML = html;
}
function searchLost() {
  let key = document.getElementById("search").value;
  let list = get("lost").filter(item => item.name.includes(key));
  let html = "";
  list.forEach(item => {
    html += `
      <div class="col-md-4"><div class="card h-100"><div class="card-body">
        <h5>${item.name}</h5><p>${item.type}</p>
        <a href="detail.html?type=lost&id=${item.id}" class="btn btn-sm btn-primary">详情</a>
      </div></div></div>
    `;
  });
  document.getElementById("list").innerHTML = html;
}

// 加载详情
function loadDetail() {
  let url = new URLSearchParams(location.search);
  let type = url.get("type");
  let id = url.get("id");
  let data = getOne(type, id);
  const currentUser = localStorage.getItem('campus_user');
  // 仅发布者显示删除按钮
  const deleteBtn = (currentUser && data.publisher === currentUser) 
    ? `<button onclick="deleteItem('${type}', ${id})" class="btn btn-danger mt-3">删除这条信息</button>` 
    : "";

  let html = "";
  if (type === "second") {
    html = `
      <div class="card p-4"><h3>${data.title}</h3>
      <p>价格：${data.price} 元</p><p>分类：${data.type}</p>
      <p>描述：${data.desc}</p><p>联系人：${data.contact}</p>
      ${deleteBtn} <!-- 插入删除按钮 -->
      </div>
    `;
  } else if (type === "activity") {
    html = `
      <div class="card p-4"><h3>${data.title}</h3>
      <p>主办：${data.org}</p><p>时间：${data.time}</p><p>地点：${data.place}</p>
      <p>内容：${data.content}</p><p>联系方式：${data.contact}</p>
      ${deleteBtn}
      </div>
    `;
  } else {
    html = `
      <div class="card p-4"><h3>${data.type}：${data.name}</h3>
      <p>时间：${data.time}</p><p>地点：${data.place}</p>
      <p>描述：${data.desc}</p><p>联系人：${data.contact}</p>
      ${deleteBtn}
      </div>
    `;
  }
  document.getElementById("detail").innerHTML = html;
  document.getElementById("show-qq").innerText = data.qq || "未填写";
  document.getElementById("show-wx").innerText = data.wx || "未填写";

  // QQ临时会话链接（自动生成）
  let qq = data.qq || "";
  let qlink = "https://qm.qq.com/cgi-bin/qm/qr?uin=" + data.qq + "&do=1";
  document.getElementById("qq-link").href = qlink;
}
// 删除信息函数
function deleteItem(type, id) {
  // 1. 校验登录状态
  const user = localStorage.getItem('campus_user');
  if (!user) {
    alert("请先登录后再操作！");
    openLoginModal();
    return;
  }

  // 2. 确认删除
  if (!confirm("确定要删除这条信息吗？删除后无法恢复！")) {
    return;
  }

  // 3. 获取对应列表并过滤（仅发布者可删除）
  let list = get(type);
  const targetItem = list.find(item => item.id == id);
  
  // 校验发布者
  if (!targetItem || targetItem.publisher !== user) {
    alert("你没有权限删除这条信息！");
    return;
  }

  // 4. 过滤掉要删除的项并保存
  let newList = list.filter(item => item.id != id);
  localStorage.setItem(type, JSON.stringify(newList));

  // 5. 反馈并跳转
  alert("删除成功！");
  // 根据类型跳转对应列表页
  if (type === "second") {
    location.href = "second.html";
  } else if (type === "activity") {
    location.href = "activity.html";
  } else if (type === "lost") {
    location.href = "lost.html";
  } else {
    location.href = "index.html";
  }
}
// main.js
// (保持原有代码不变...)

// --- 新增：为首页加载内容的函数 ---
function loadIndexContent() {
    console.log("正在加载首页内容...");

    // 1. 加载并显示近期热门活动 (假设取最新的3条)
    const activities = get("activity"); // 获取所有活动
    const recentActivities = activities.slice(0, 3); // 取前3条
    const activityHtml = generateCardHtml(recentActivities, "activity", "活动");
    document.getElementById("activity-list").innerHTML = activityHtml;

    // 2. 加载并显示最新失物招领 (假设取最新的3条)
    const lostItems = get("lost"); // 获取所有失物招领
    const recentLostItems = lostItems.slice(0, 3); // 取前3条
    const lostHtml = generateCardHtml(recentLostItems, "lost", "失物");
    document.getElementById("lost-list").innerHTML = lostHtml;

    // 3. 加载并显示最新二手闲置 (假设取最新的3条)
    const secondItems = get("second"); // 获取所有二手物品
    const recentSecondItems = secondItems.slice(0, 3); // 取前3条
    const secondHtml = generateCardHtml(recentSecondItems, "second", "二手");
    document.getElementById("second-list").innerHTML = secondHtml;
}

/**
 * 一个通用的卡片生成函数，用于减少重复代码
 * @param {Array} items - 数据列表
 * @param {String} type - 类型 ("activity", "lost", "second")
 * @param {String} prefix - 标题前缀
 * @returns {String} - 生成的HTML字符串
 */
function generateCardHtml(items, type, prefix) {
    let html = "";
    items.forEach(item => {
        // 根据不同类型生成不同的卡片内容
        if (type === "activity") {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${item.title}</h5>
                            <p class="card-text">主办：${item.org}</p>
                            <p class="card-text">时间：${fmtTime(item.startTime)}</p>
                            <a href="detail.html?type=${type}&id=${item.id}" class="btn btn-primary stretched-link">查看详情</a>
                        </div>
                    </div>
                </div>`;
        } else if (type === "lost") {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${prefix}: ${item.name}</h5>
                            <p class="card-text">${item.type}</p>
                            <p class="card-text">地点：${fmtTime(item.time)} | ${item.place}</p>
                            <a href="detail.html?type=${type}&id=${item.id}" class="btn btn-primary stretched-link">查看详情</a>
                        </div>
                    </div>
                </div>`;
        } else if (type === "second") {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${item.title}</h5>
                            <p class="card-text">价格：${item.price}元</p>
                            <p class="card-text">分类：${item.type}</p>
                            <a href="detail.html?type=${type}&id=${item.id}" class="btn btn-primary stretched-link">查看详情</a>
                        </div>
                    </div>
                </div>`;
        }
    });
    return html;
}
// --- 结束新增 ---
