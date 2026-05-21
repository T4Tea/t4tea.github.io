/**
 * 书签管理应用
 */

// 搜索引擎配置
const SEARCH_ENGINES = {
    baidu: {
        name: '百度',
        url: 'https://www.baidu.com/s?wd=',
        icon: '🔍'
    },
    google: {
        name: 'Google',
        url: 'https://www.google.com/search?q=',
        icon: '🔍'
    },
    bing: {
        name: '必应',
        url: 'https://www.bing.com/search?q=',
        icon: '🔍'
    }
};

// 默认书签
const DEFAULT_BOOKMARKS = [
    { title: '百度', url: 'https://www.baidu.com', icon: 'https://www.baidu.com/favicon.ico' },
    { title: 'Google', url: 'https://www.google.com', icon: 'https://www.google.com/favicon.ico' },
    { title: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico' },
    { title: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' }
];

// 应用状态
let state = {
    currentEngine: 'baidu',
    bookmarks: [],
    editingIndex: -1,
    contextMenuIndex: -1
};

// DOM 元素
let elements = {};

/**
 * 初始化应用
 */
function init() {
    // 获取 DOM 元素
    elements = {
        searchEngines: document.querySelector('.search-engines'),
        searchInput: document.querySelector('.search-input'),
        searchBtn: document.querySelector('.search-btn'),
        bookmarksGrid: document.querySelector('.bookmarks-grid'),
        editModal: document.getElementById('editModal'),
        confirmModal: document.getElementById('confirmModal'),
        contextMenu: document.getElementById('contextMenu'),
        toast: document.getElementById('toast'),
        titleInput: document.getElementById('titleInput'),
        urlInput: document.getElementById('urlInput'),
        modalTitle: document.getElementById('modalTitle'),
        confirmTitle: document.getElementById('confirmTitle'),
        confirmMessage: document.getElementById('confirmMessage')
    };

    // 加载书签
    loadBookmarks();

    // 绑定事件
    bindEvents();

    // 渲染书签
    renderBookmarks();
}

/**
 * 加载书签
 */
function loadBookmarks() {
    try {
        const saved = localStorage.getItem('bookmarks');
        state.bookmarks = saved ? JSON.parse(saved) : [...DEFAULT_BOOKMARKS];
    } catch (error) {
        console.error('加载书签失败:', error);
        state.bookmarks = [...DEFAULT_BOOKMARKS];
        showToast('加载书签失败，已恢复默认书签', 'error');
    }
}

/**
 * 保存书签
 */
function saveBookmarks() {
    try {
        localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
    } catch (error) {
        console.error('保存书签失败:', error);
        showToast('保存书签失败', 'error');
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 搜索引擎切换
    elements.searchEngines.addEventListener('click', handleEngineSwitch);

    // 搜索功能
    elements.searchInput.addEventListener('keypress', handleSearch);
    elements.searchBtn.addEventListener('click', handleSearch);

    // 模态框关闭
    elements.editModal.querySelector('.modal-close').addEventListener('click', closeEditModal);
    elements.editModal.querySelector('.btn-secondary').addEventListener('click', closeEditModal);
    elements.editModal.querySelector('.btn-primary').addEventListener('click', handleSaveBookmark);

    // 确认对话框
    elements.confirmModal.querySelector('.btn-secondary').addEventListener('click', closeConfirmModal);
    elements.confirmModal.querySelector('.btn-danger').addEventListener('click', handleConfirmDelete);

    // 点击外部关闭
    document.addEventListener('click', handleDocumentClick);

    // 右键菜单
    document.addEventListener('contextmenu', handleContextMenu);

    // ESC 键关闭
    document.addEventListener('keydown', handleKeyDown);
}

/**
 * 处理搜索引擎切换
 */
function handleEngineSwitch(e) {
    const btn = e.target.closest('.search-engine-btn');
    if (!btn) return;

    const engine = btn.dataset.engine;
    if (!engine || !SEARCH_ENGINES[engine]) return;

    state.currentEngine = engine;
    document.querySelectorAll('.search-engine-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

/**
 * 处理搜索
 */
function handleSearch(e) {
    if (e.type === 'keypress' && e.key !== 'Enter') return;

    const searchTerm = elements.searchInput.value.trim();
    if (!searchTerm) {
        showToast('请输入搜索内容', 'error');
        return;
    }

    const engine = SEARCH_ENGINES[state.currentEngine];
    window.open(engine.url + encodeURIComponent(searchTerm), '_blank');
}

/**
 * 渲染书签
 */
function renderBookmarks() {
    const grid = elements.bookmarksGrid;
    grid.innerHTML = '';

    state.bookmarks.forEach((bookmark, index) => {
        const card = createBookmarkCard(bookmark, index);
        grid.appendChild(card);
    });

    // 添加"添加书签"按钮
    const addCard = createAddBookmarkCard();
    grid.appendChild(addCard);
}

/**
 * 创建书签卡片
 */
function createBookmarkCard(bookmark, index) {
    const card = document.createElement('div');
    card.className = 'bookmark-card';
    card.dataset.index = index;

    // 使用安全的方式创建元素
    const img = document.createElement('img');
    img.src = bookmark.icon;
    img.alt = bookmark.title;
    img.onerror = function() {
        this.src = createDefaultIcon(bookmark.title);
    };

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = bookmark.title;

    const actions = document.createElement('div');
    actions.className = 'bookmark-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(index);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = '删除';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showConfirmDelete(index);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(actions);

    // 点击事件
    card.addEventListener('click', () => handleBookmarkClick(bookmark));

    // 右键菜单
    card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, index);
    });

    // 触摸事件（长按）
    let pressTimer;
    let isLongPress = false;

    card.addEventListener('touchstart', (e) => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
            isLongPress = true;
            showContextMenu(e, index);
        }, 500);
    });

    card.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
    });

    card.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
    });

    return card;
}

/**
 * 创建默认图标
 */
function createDefaultIcon(title) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = '#4285f4';
    ctx.beginPath();
    ctx.roundRect(0, 0, 48, 48, 8);
    ctx.fill();

    // 文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.charAt(0).toUpperCase(), 24, 24);

    return canvas.toDataURL();
}

/**
 * 创建添加书签卡片
 */
function createAddBookmarkCard() {
    const card = document.createElement('div');
    card.className = 'bookmark-card add-bookmark';
    card.innerHTML = '+';
    card.addEventListener('click', () => openEditModal(-1));
    return card;
}

/**
 * 处理书签点击
 */
function handleBookmarkClick(bookmark) {
    try {
        const url = new URL(bookmark.url);
        window.open(url.href, '_blank');
    } catch (error) {
        console.error('无效的 URL:', bookmark.url);
        showToast('无效的链接地址', 'error');
    }
}

/**
 * 打开编辑模态框
 */
function openEditModal(index) {
    state.editingIndex = index;
    closeContextMenu();

    const isEdit = index >= 0;
    elements.modalTitle.textContent = isEdit ? '编辑书签' : '添加书签';
    elements.titleInput.value = isEdit ? state.bookmarks[index].title : '';
    elements.urlInput.value = isEdit ? state.bookmarks[index].url : '';

    elements.editModal.classList.add('show');
    elements.titleInput.focus();
}

/**
 * 关闭编辑模态框
 */
function closeEditModal() {
    elements.editModal.classList.remove('show');
    state.editingIndex = -1;
}

/**
 * 处理保存书签
 */
function handleSaveBookmark() {
    const title = elements.titleInput.value.trim();
    const url = elements.urlInput.value.trim();

    if (!title) {
        showToast('请输入标题', 'error');
        elements.titleInput.focus();
        return;
    }

    if (!url) {
        showToast('请输入 URL', 'error');
        elements.urlInput.focus();
        return;
    }

    // 验证和规范化 URL
    let normalizedUrl = url;
    try {
        if (!/^https?:\/\//i.test(url)) {
            normalizedUrl = 'https://' + url;
        }
        new URL(normalizedUrl);
    } catch (error) {
        showToast('请输入有效的 URL', 'error');
        elements.urlInput.focus();
        return;
    }

    const bookmark = {
        title,
        url: normalizedUrl,
        icon: `${new URL(normalizedUrl).origin}/favicon.ico`
    };

    if (state.editingIndex === -1) {
        // 添加新书签
        state.bookmarks.push(bookmark);
        showToast('书签已添加', 'success');
    } else {
        // 更新现有书签
        state.bookmarks[state.editingIndex] = bookmark;
        showToast('书签已更新', 'success');
    }

    saveBookmarks();
    renderBookmarks();
    closeEditModal();
}

/**
 * 显示确认删除对话框
 */
function showConfirmDelete(index) {
    state.editingIndex = index;
    closeContextMenu();

    const bookmark = state.bookmarks[index];
    elements.confirmTitle.textContent = '删除书签';
    elements.confirmMessage.textContent = `确定要删除 "${bookmark.title}" 吗？此操作无法撤销。`;

    elements.confirmModal.classList.add('show');
}

/**
 * 关闭确认对话框
 */
function closeConfirmModal() {
    elements.confirmModal.classList.remove('show');
    state.editingIndex = -1;
}

/**
 * 处理确认删除
 */
function handleConfirmDelete() {
    if (state.editingIndex < 0) return;

    const bookmark = state.bookmarks[state.editingIndex];
    state.bookmarks.splice(state.editingIndex, 1);

    saveBookmarks();
    renderBookmarks();
    closeConfirmModal();

    showToast(`已删除 "${bookmark.title}"`, 'success');
}

/**
 * 显示右键菜单
 */
function showContextMenu(e, index) {
    state.contextMenuIndex = index;
    const bookmark = state.bookmarks[index];

    const menu = elements.contextMenu;
    menu.innerHTML = '';

    const items = [
        { icon: '🔗', text: '打开链接', action: () => handleBookmarkClick(bookmark) },
        { icon: '✏️', text: '编辑', action: () => openEditModal(index) },
        { icon: '📋', text: '复制链接', action: () => copyToClipboard(bookmark.url) },
        { icon: '🗑️', text: '删除', action: () => showConfirmDelete(index), className: 'danger' }
    ];

    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = `context-menu-item ${item.className || ''}`;
        menuItem.innerHTML = `<span class="context-menu-icon">${item.icon}</span>${item.text}`;
        menuItem.addEventListener('click', () => {
            item.action();
            closeContextMenu();
        });
        menu.appendChild(menuItem);
    });

    // 定位菜单
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.add('show');
}

/**
 * 关闭右键菜单
 */
function closeContextMenu() {
    elements.contextMenu.classList.remove('show');
    state.contextMenuIndex = -1;
}

/**
 * 处理文档点击
 */
function handleDocumentClick(e) {
    if (!elements.contextMenu.contains(e.target)) {
        closeContextMenu();
    }
}

/**
 * 处理右键菜单
 */
function handleContextMenu(e) {
    // 如果不是书签卡片，关闭菜单
    const card = e.target.closest('.bookmark-card');
    if (!card || card.classList.contains('add-bookmark')) {
        closeContextMenu();
    }
}

/**
 * 处理键盘事件
 */
function handleKeyDown(e) {
    if (e.key === 'Escape') {
        closeEditModal();
        closeConfirmModal();
        closeContextMenu();
    }
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('链接已复制', 'success');
    } catch (error) {
        console.error('复制失败:', error);
        showToast('复制失败', 'error');
    }
}

/**
 * 显示提示消息
 */
function showToast(message, type = 'success') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);
