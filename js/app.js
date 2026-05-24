/**
 * 书签管理应用
 */

// 搜索引擎配置
const SEARCH_ENGINES = {
    baidu: {
        name: '百度',
        url: 'https://www.baidu.com/s?wd='
    },
    google: {
        name: 'Google',
        url: 'https://www.google.com/search?q='
    },
    bing: {
        name: '必应',
        url: 'https://www.bing.com/search?q='
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
    isEditMode: false
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
        editModeBtn: document.getElementById('editModeBtn'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        editModal: document.getElementById('editModal'),
        confirmModal: document.getElementById('confirmModal'),
        toast: document.getElementById('toast'),
        titleInput: document.getElementById('titleInput'),
        urlInput: document.getElementById('urlInput'),
        iconInput: document.getElementById('iconInput'),
        iconPreview: document.getElementById('iconPreview'),
        modalTitle: document.getElementById('modalTitle'),
        confirmTitle: document.getElementById('confirmTitle'),
        confirmMessage: document.getElementById('confirmMessage')
    };

    // 加载书签
    loadBookmarks();

    // 初始化主题
    initTheme();

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
 * 初始化主题
 */
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
        document.documentElement.classList.remove('dark');
    }
    // 'auto' 或未设置时，跟随系统（由 CSS media query 处理）
}

/**
 * 切换主题
 */
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 搜索引擎切换
    elements.searchEngines.addEventListener('click', handleEngineSwitch);

    // 搜索功能
    elements.searchInput.addEventListener('keydown', handleSearch);
    elements.searchBtn.addEventListener('click', handleSearch);

    // 编辑模式切换
    elements.editModeBtn.addEventListener('click', toggleEditMode);

    // 主题切换
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // 模态框关闭
    elements.editModal.querySelector('.modal-close').addEventListener('click', closeEditModal);
    elements.editModal.querySelector('.btn-secondary').addEventListener('click', closeEditModal);
    elements.editModal.querySelector('.btn-primary').addEventListener('click', handleSaveBookmark);

    // 确认对话框
    elements.confirmModal.querySelector('.btn-secondary').addEventListener('click', closeConfirmModal);
    elements.confirmModal.querySelector('.btn-danger').addEventListener('click', handleConfirmDelete);

    // 图标输入预览
    elements.iconInput.addEventListener('input', updateIconPreview);
    elements.urlInput.addEventListener('blur', autoFillIcon);

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
    if (e.type === 'keydown' && e.key !== 'Enter') return;

    const searchTerm = elements.searchInput.value.trim();
    if (!searchTerm) {
        showToast('请输入搜索内容', 'error');
        return;
    }

    const engine = SEARCH_ENGINES[state.currentEngine];
    window.open(engine.url + encodeURIComponent(searchTerm), '_blank');
}

/**
 * 切换编辑模式
 */
function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    document.body.classList.toggle('edit-mode', state.isEditMode);
    elements.editModeBtn.classList.toggle('active', state.isEditMode);

    // 更新按钮图标
    const editIcon = elements.editModeBtn.querySelector('.edit-icon');
    editIcon.textContent = state.isEditMode ? '✅' : '✏️';

    // 退出编辑模式时，隐藏所有操作按钮
    if (!state.isEditMode) {
        document.querySelectorAll('.bookmark-card').forEach(card => {
            card.classList.remove('show-actions');
        });
    }
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

    // 编辑按钮
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn';
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(index);
    });

    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
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
    card.addEventListener('click', () => {
        if (!state.isEditMode) {
            handleBookmarkClick(bookmark);
        }
    });

    return card;
}

/**
 * 创建默认图标
 */
function createDefaultIcon(title) {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    const r = 8;

    // 背景（兼容 roundRect）
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(0, 0, 40, 40, r);
    } else {
        ctx.moveTo(r, 0);
        ctx.arcTo(40, 0, 40, 40, r);
        ctx.arcTo(40, 40, 0, 40, r);
        ctx.arcTo(0, 40, 0, 0, r);
        ctx.arcTo(0, 0, 40, 0, r);
        ctx.closePath();
    }
    ctx.fill();

    // 文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.charAt(0).toUpperCase(), 20, 20);

    return canvas.toDataURL();
}

/**
 * 创建添加书签卡片
 */
function createAddBookmarkCard() {
    const card = document.createElement('div');
    card.className = 'bookmark-card add-bookmark';
    card.innerHTML = '<svg class="add-bookmark-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
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

    const isEdit = index >= 0;
    elements.modalTitle.textContent = isEdit ? '编辑书签' : '添加书签';
    elements.titleInput.value = isEdit ? state.bookmarks[index].title : '';
    elements.urlInput.value = isEdit ? state.bookmarks[index].url : '';
    elements.iconInput.value = isEdit ? (state.bookmarks[index].icon || '') : '';

    // 更新图标预览
    updateIconPreview();

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
    const customIcon = elements.iconInput.value.trim();

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

    // 验证 URL
    try {
        let normalizedUrl = url;
        if (!/^https?:\/\//i.test(url)) {
            normalizedUrl = 'https://' + url;
        }
        new URL(normalizedUrl);
    } catch (error) {
        showToast('请输入有效的 URL', 'error');
        elements.urlInput.focus();
        return;
    }

    // 图标：优先使用自定义图标，否则使用网站默认 favicon
    let icon = customIcon;
    if (!icon) {
        try {
            let iconUrl = url;
            if (!/^https?:\/\//i.test(url)) {
                iconUrl = 'https://' + url;
            }
            icon = `${new URL(iconUrl).origin}/favicon.ico`;
        } catch {
            icon = '';
        }
    }

    const bookmark = { title, url, icon };

    if (state.editingIndex === -1) {
        state.bookmarks.push(bookmark);
        showToast('书签已添加', 'success');
    } else {
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
    closeEditModal();

    showToast(`已删除 "${bookmark.title}"`, 'success');
}

/**
 * 更新图标预览
 */
function updateIconPreview() {
    const iconUrl = elements.iconInput.value.trim();
    const preview = elements.iconPreview;

    if (iconUrl) {
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = iconUrl;
        img.onerror = function() {
            preview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
        };
        preview.appendChild(img);
    } else {
        preview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    }
}

/**
 * URL 输入失焦时自动填充图标
 */
function autoFillIcon() {
    const url = elements.urlInput.value.trim();
    const currentIcon = elements.iconInput.value.trim();

    // 仅在图标输入框为空时自动填充
    if (url && !currentIcon) {
        try {
            let normalizedUrl = url;
            if (!/^https?:\/\//i.test(url)) {
                normalizedUrl = 'https://' + url;
            }
            const faviconUrl = `${new URL(normalizedUrl).origin}/favicon.ico`;
            elements.iconInput.value = faviconUrl;
            updateIconPreview();
        } catch {
            // URL 无效时不处理
        }
    }
}

/**
 * 处理键盘事件
 */
function handleKeyDown(e) {
    if (e.key === 'Escape') {
        closeEditModal();
        closeConfirmModal();
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
