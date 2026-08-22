/**
 * Blog_nest - Main Application Module
 * 
 * Manages post feed rendering, search/filtering, reading time computation,
 * single post view rendering with Markdown parsing, and post deletion modal.
 */

// Global API Endpoint Base Path
const POSTS_API_BASE = window.location.pathname.includes('/public/')
  ? '../backend/api'
  : 'backend/api';

/**
 * Calculate estimated reading time in minutes
 * @param {string} content 
 * @returns {string} e.g. "3 min read"
 */
function calculateReadingTime(content) {
  const wordsPerMinute = 180;
  const words = content ? content.trim().split(/\s+/).length : 0;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${Math.max(1, minutes)} min read`;
}

/**
 * Format database timestamp to human-friendly format (e.g. "Aug 21, 2026")
 * @param {string} dateString 
 * @returns {string}
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString.replace(/-/g, '/'));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Generate diverse warm aesthetic color gradients for card covers
 * @param {number} id 
 * @returns {string}
 */
function getCoverGradient(id) {
  const gradients = [
    'linear-gradient(135deg, #E29578 0%, #A85D34 100%)',
    'linear-gradient(135deg, #DDA15E 0%, #BC6C25 100%)',
    'linear-gradient(135deg, #CDB4DB 0%, #8A5A44 100%)',
    'linear-gradient(135deg, #F3C68F 0%, #D4885E 100%)',
    'linear-gradient(135deg, #B5838D 0%, #6D4C41 100%)',
    'linear-gradient(135deg, #E6AF2E 0%, #A0522D 100%)'
  ];
  return gradients[id % gradients.length];
}

/**
 * Get category tag icon & label based on post content/title
 */
function getCategoryMeta(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('security') || text.includes('sql') || text.includes('xss') || text.includes('auth')) {
    return { name: 'Security', icon: '🔒' };
  }
  if (text.includes('css') || text.includes('design') || text.includes('style') || text.includes('ui')) {
    return { name: 'Design & UI', icon: '🎨' };
  }
  if (text.includes('php') || text.includes('backend') || text.includes('api') || text.includes('database')) {
    return { name: 'Backend', icon: '⚡' };
  }
  if (text.includes('markdown') || text.includes('write') || text.includes('guide')) {
    return { name: 'Writing', icon: '📝' };
  }
  return { name: 'Technology', icon: '☕' };
}

/* ==========================================================================
   Feed Controller (`index.html`)
   ========================================================================== */

let allPosts = [];
let currentFilter = 'all';

async function fetchAndRenderFeed() {
  const feedContainer = document.getElementById('posts-container');
  if (!feedContainer) return;

  // Render skeleton loading state
  feedContainer.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton skeleton-card"></div>
  `).join('');

  try {
    const res = await fetch(`${POSTS_API_BASE}/posts_list.php`, { credentials: 'same-origin' });
    const json = await res.json();

    if (json.status && json.data?.posts) {
      allPosts = json.data.posts;
      
      // Unhide "My Articles" filter chip if current user owns any posts or is logged in
      const myPostsChip = document.getElementById('my-posts-chip');
      if (myPostsChip) {
        const hasOwnPosts = allPosts.some(p => p.is_owner);
        const authData = typeof checkAuthStatus === 'function' ? await checkAuthStatus() : null;
        if (hasOwnPosts || (authData && authData.authenticated)) {
          myPostsChip.style.display = 'inline-flex';
        }
      }

      renderPostsGrid(allPosts);
      initSearchAndFilter();
    } else {
      renderEmptyState('No articles found', 'Be the first author to publish a blog post on Blog_nest!');
    }
  } catch (err) {
    console.error('Failed to load posts feed:', err);
    feedContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">⚠️</div>
        <h3 class="empty-title">Failed to load articles</h3>
        <p class="empty-subtitle">Please check your database connection or try refreshing the page.</p>
        <button onclick="fetchAndRenderFeed()" class="btn btn-secondary btn-sm">Try Again</button>
      </div>
    `;
  }
}

function renderPostsGrid(posts) {
  const feedContainer = document.getElementById('posts-container');
  if (!feedContainer) return;

  if (posts.length === 0) {
    if (currentFilter === 'my-posts') {
      renderEmptyState('You have not published any articles yet', 'Share your thoughts, technology insights, or tutorials with the world!');
    } else {
      renderEmptyState('No articles match your search', 'Try adjusting your keywords or category filters.');
    }
    return;
  }

  feedContainer.innerHTML = posts.map(post => {
    const category = getCategoryMeta(post.title, post.content);
    const readingTime = calculateReadingTime(post.content);
    const formattedDate = formatDate(post.created_at);
    const authorInitial = post.author ? post.author.charAt(0).toUpperCase() : 'A';
    const bgGradient = getCoverGradient(post.id);
    const ownerBadge = post.is_owner ? `<span class="owner-pill" style="font-size: 0.7rem; background: var(--accent-light); color: var(--accent-dark); padding: 1px 7px; border-radius: 9999px; font-weight: 600; margin-left: 0.35rem;">You</span>` : '';
    const ownerActions = post.is_owner ? `
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
        <a href="editor.html?id=${post.id}" class="btn btn-outline btn-sm" style="flex: 1; display: flex; justify-content: center; font-size: 0.8rem;">✏️ Edit</a>
        <button onclick="openDeleteModal(${post.id}, '${escapeHtml(post.title).replace(/'/g, "\\'")}')" class="btn btn-danger-outline btn-sm" style="flex: 1; display: flex; justify-content: center; font-size: 0.8rem;">🗑️ Delete</button>
      </div>
    ` : '';

    return `
      <article class="post-card">
        <div class="card-cover" style="background: ${bgGradient}">
          <div class="card-cover-pattern">☕</div>
          <span class="card-category-badge">${category.icon} ${category.name}</span>
          <span class="card-reading-time">⏱️ ${readingTime}</span>
        </div>
        <div class="card-body">
          <h2 class="card-title">
            <a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a>
          </h2>
          <p class="card-excerpt">${escapeHtml(post.excerpt || '')}</p>
          <div class="card-footer">
            <div class="card-author">
              <div class="card-author-avatar">${authorInitial}</div>
              <span>${escapeHtml(post.author)}${ownerBadge}</span>
            </div>
            <time datetime="${post.created_at}">${formattedDate}</time>
          </div>
          ${ownerActions}
        </div>
      </article>
    `;
  }).join('');
}

function renderEmptyState(title, subtitle) {
  const feedContainer = document.getElementById('posts-container');
  if (!feedContainer) return;

  feedContainer.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <div class="empty-icon">📭</div>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-subtitle">${subtitle}</p>
      <a href="editor.html" class="btn btn-primary btn-sm">Write an Article</a>
    </div>
  `;
}

function initSearchAndFilter() {
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const tagChips = document.querySelectorAll('.tag-chip');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      if (searchClearBtn) {
        searchClearBtn.classList.toggle('visible', term.length > 0);
      }
      filterPosts();
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.classList.remove('visible');
        filterPosts();
      });
    }
  }

  tagChips.forEach(chip => {
    chip.addEventListener('click', () => {
      tagChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-tag') || 'all';
      filterPosts();
    });
  });
}

function filterPosts() {
  const searchInput = document.getElementById('search-input');
  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let filtered = allPosts.filter(post => {
    const matchesSearch = !term ||
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      post.author.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (currentFilter === 'all') return true;
    if (currentFilter === 'my-posts') return Boolean(post.is_owner);

    const category = getCategoryMeta(post.title, post.content);
    return category.name.toLowerCase().includes(currentFilter.toLowerCase());
  });

  renderPostsGrid(filtered);
}

/* ==========================================================================
   Single Post Reader Controller (`post.html`)
   ========================================================================== */

let currentPost = null;

async function loadSinglePostView() {
  const articleWrapper = document.getElementById('article-wrapper');
  if (!articleWrapper) return;

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(`${POSTS_API_BASE}/posts_read.php?id=${postId}`, { credentials: 'same-origin' });
    const json = await res.json();

    if (json.status && json.data?.post) {
      currentPost = json.data.post;
      renderSinglePost(currentPost);
      initReadingProgressBar();
    } else {
      articleWrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h2 class="empty-title">Article Not Found</h2>
          <p class="empty-subtitle">The requested blog post could not be found or has been removed.</p>
          <a href="index.html" class="btn btn-primary btn-sm">Return to Feed</a>
        </div>
      `;
    }
  } catch (err) {
    console.error('Failed to load post:', err);
    articleWrapper.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h2 class="empty-title">Error Loading Article</h2>
        <p class="empty-subtitle">Could not connect to the database. Please try again later.</p>
        <a href="index.html" class="btn btn-secondary btn-sm">Back to Home</a>
      </div>
    `;
  }
}

function renderSinglePost(post) {
  document.title = `${post.title} — Blog_nest`;

  const readingTime = calculateReadingTime(post.content);
  const formattedDate = formatDate(post.created_at);
  const authorInitial = post.author ? post.author.charAt(0).toUpperCase() : 'A';
  const category = getCategoryMeta(post.title, post.content);

  // Markdown parsing (with marked.js or basic fallback)
  let parsedContent = '';
  if (typeof marked !== 'undefined' && marked.parse) {
    parsedContent = marked.parse(post.content);
  } else {
    parsedContent = fallbackMarkdownParser(post.content);
  }

  // Author Action Toolbar (Only for Post Owner)
  let authorToolbarHtml = '';
  if (post.is_owner) {
    authorToolbarHtml = `
      <div class="author-action-bar">
        <a href="editor.html?id=${post.id}" class="btn btn-secondary btn-sm">
          <span>✏️</span> Edit Post
        </a>
        <button id="delete-post-btn" class="btn btn-danger-outline btn-sm">
          <span>🗑️</span> Delete
        </button>
      </div>
    `;
  }

  const articleWrapper = document.getElementById('article-wrapper');
  articleWrapper.innerHTML = `
    <header class="post-view-header">
      <a href="index.html" class="post-back-link">
        <span>←</span> Back to all articles
      </a>
      <div class="hero-pill" style="margin-bottom: 0.75rem;">${category.icon} ${category.name}</div>
      <h1 class="post-view-title">${escapeHtml(post.title)}</h1>
      
      <div class="post-meta-row">
        <div class="post-author-info">
          <div class="post-author-avatar-lg">${authorInitial}</div>
          <div>
            <div class="post-author-name">${escapeHtml(post.author)}</div>
            <div class="post-date-row">Published on ${formattedDate} • ⏱️ ${readingTime}</div>
          </div>
        </div>
        ${authorToolbarHtml}
      </div>
    </header>

    <div class="article-content" id="article-body">
      ${parsedContent}
    </div>

    <div class="post-author-card">
      <div class="post-author-avatar-lg">${authorInitial}</div>
      <div>
        <div class="author-bio-title">Written by ${escapeHtml(post.author)}</div>
        <div class="author-bio-sub">Author on Blog_nest. Passionate about sharing thoughts, tech insights, and architectural ideas.</div>
      </div>
    </div>
  `;

  // Enhance Code Blocks with Copy Buttons
  enhanceCodeBlocks();

  // Attach Delete Modal trigger
  if (post.is_owner) {
    const deleteBtn = document.getElementById('delete-post-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => openDeleteModal(post.id, post.title));
    }
  }
}

/**
 * Enhance <pre><code> blocks with a "Copy" button
 */
function enhanceCodeBlocks() {
  document.querySelectorAll('#article-body pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.textContent = 'Copy';

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      } catch (e) {
        copyBtn.textContent = 'Failed';
      }
    });

    pre.style.position = 'relative';
    pre.appendChild(copyBtn);
  });
}

/**
 * Reading progress bar calculation
 */
function initReadingProgressBar() {
  const progressBar = document.getElementById('reading-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    const progress = (window.scrollY / totalHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  });
}

/**
 * Delete Confirmation Modal Controller
 */
function openDeleteModal(postId, postTitle) {
  let modal = document.getElementById('delete-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'delete-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-icon-badge">🗑️</div>
        <h3 class="modal-title">Delete Article</h3>
        <p class="modal-body">Are you sure you want to delete <strong id="delete-modal-post-title"></strong>? This action is irreversible.</p>
        <div class="modal-actions">
          <button id="modal-cancel-btn" class="btn btn-secondary btn-sm">Cancel</button>
          <button id="modal-confirm-delete-btn" class="btn btn-danger btn-sm">Delete Permanently</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-cancel-btn').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  document.getElementById('delete-modal-post-title').textContent = `"${postTitle}"`;
  const confirmBtn = document.getElementById('modal-confirm-delete-btn');

  // Replace click handler cleanly
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener('click', async () => {
    newConfirmBtn.disabled = true;
    newConfirmBtn.textContent = 'Deleting...';

    try {
      const res = await fetch(`${POSTS_API_BASE}/posts_delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
        credentials: 'same-origin'
      });
      const json = await res.json();

      if (json.status) {
        showToast('Article deleted successfully!', 'success');
        modal.classList.remove('active');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 700);
      } else {
        showToast(json.message || 'Deletion failed', 'error');
        newConfirmBtn.disabled = false;
        newConfirmBtn.textContent = 'Delete Permanently';
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error during deletion.', 'error');
      newConfirmBtn.disabled = false;
      newConfirmBtn.textContent = 'Delete Permanently';
    }
  });

  modal.classList.add('active');
}

/**
 * Minimal fallback markdown parser in case CDN fails
 */
function fallbackMarkdownParser(text) {
  if (!text) return '';
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote><p>$1</p></blockquote>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '</p><p>');
  return `<p>${html}</p>`;
}

/**
 * HTML Escaping Helper
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('posts-container')) {
    fetchAndRenderFeed();
  }
  if (document.getElementById('article-wrapper')) {
    loadSinglePostView();
  }
});
