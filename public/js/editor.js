/**
 * Blog_nest - Markdown Editor Module
 * 
 * Manages post creation and editing, live split-pane Markdown preview,
 * formatting toolbar shortcuts, word metrics, and API mutation calls.
 */

const EDITOR_API_BASE = window.location.pathname.includes('/public/')
  ? '../backend/api'
  : 'backend/api';

let isEditMode = false;
let currentPostId = null;

/**
 * Initialize the Post Editor
 */
async function initEditor() {
  // 1. Auth Guard: Verify user is logged in
  const authData = await checkAuthStatus();
  if (!authData.authenticated) {
    showToast('Please sign in to write or edit an article.', 'info');
    const redirectTarget = window.location.search ? `editor.html${window.location.search}` : 'editor.html';
    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}`;
    }, 600);
    return;
  }

  // 2. Check for Edit Mode (?id=123)
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (postId) {
    isEditMode = true;
    currentPostId = parseInt(postId, 10);
    setupEditMode(currentPostId);
  } else {
    isEditMode = false;
    document.getElementById('editor-page-title').textContent = 'Create New Article';
    document.getElementById('publish-btn-text').textContent = 'Publish Article';
    updateLivePreview();
  }

  // 3. Attach Live Preview & Toolbar Listeners
  initTextareaListeners();
  initToolbar();
  initFormSubmit();
}

/**
 * Fetch and populate existing post data for Edit Mode
 */
async function setupEditMode(postId) {
  document.getElementById('editor-page-title').textContent = 'Edit Article';
  document.getElementById('publish-btn-text').textContent = 'Save Changes';

  try {
    const res = await fetch(`${EDITOR_API_BASE}/posts_read.php?id=${postId}`, { credentials: 'same-origin' });
    const json = await res.json();

    if (json.status && json.data?.post) {
      const post = json.data.post;
      
      // Check ownership
      if (!post.is_owner) {
        showToast('You do not have permission to edit this article.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        return;
      }

      document.getElementById('post-title').value = post.title || '';
      document.getElementById('post-content').value = post.content || '';
      updateLivePreview();
    } else {
      showToast('Could not load post for editing.', 'error');
    }
  } catch (err) {
    console.error('Error fetching post for edit:', err);
    showToast('Network error while loading post.', 'error');
  }
}

/**
 * Live Markdown Preview & Word Counter
 */
function initTextareaListeners() {
  const contentInput = document.getElementById('post-content');
  const titleInput = document.getElementById('post-title');

  if (contentInput) {
    contentInput.addEventListener('input', () => {
      updateLivePreview();
    });
  }

  if (titleInput) {
    titleInput.addEventListener('input', () => {
      const previewTitle = document.getElementById('preview-title-render');
      if (previewTitle) {
        previewTitle.textContent = titleInput.value.trim() || 'Your Article Title';
      }
    });
  }
}

function updateLivePreview() {
  const content = document.getElementById('post-content')?.value || '';
  const previewBody = document.getElementById('editor-preview-body');
  
  if (!previewBody) return;

  if (typeof marked !== 'undefined' && marked.parse) {
    previewBody.innerHTML = content.trim() 
      ? marked.parse(content) 
      : `<p style="color: var(--text-muted); font-style: italic;">Your live Markdown article preview will appear here...</p>`;
  } else {
    previewBody.innerHTML = content.trim()
      ? fallbackMarkdownParser(content)
      : `<p style="color: var(--text-muted); font-style: italic;">Preview will render as you write...</p>`;
  }

  // Update Stats
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readTime = Math.max(1, Math.ceil(words / 180));

  const wordStat = document.getElementById('stat-word-count');
  const charStat = document.getElementById('stat-char-count');
  const readStat = document.getElementById('stat-read-time');

  if (wordStat) wordStat.textContent = `${words} words`;
  if (charStat) charStat.textContent = `${chars} chars`;
  if (readStat) readStat.textContent = `~${readTime} min read`;
}

/**
 * Markdown Toolbar Action Shortcuts
 */
function initToolbar() {
  const textarea = document.getElementById('post-content');
  if (!textarea) return;

  const insertSyntax = (before, after = '', defaultText = '') => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || defaultText;
    const replacement = before + selectedText + after;

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selectedText.length;

    updateLivePreview();
  };

  document.querySelectorAll('.toolbar-btn[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      switch (action) {
        case 'h1':
          insertSyntax('# ', '', 'Heading 1');
          break;
        case 'h2':
          insertSyntax('## ', '', 'Heading 2');
          break;
        case 'h3':
          insertSyntax('### ', '', 'Heading 3');
          break;
        case 'bold':
          insertSyntax('**', '**', 'bold text');
          break;
        case 'italic':
          insertSyntax('*', '*', 'italic text');
          break;
        case 'code':
          insertSyntax('`', '`', 'code');
          break;
        case 'codeblock':
          insertSyntax('```javascript\n', '\n```', '// your code here');
          break;
        case 'quote':
          insertSyntax('> ', '', 'Quoted thought');
          break;
        case 'list':
          insertSyntax('- ', '', 'List item');
          break;
        case 'link':
          insertSyntax('[', '](https://example.com)', 'Link description');
          break;
        case 'table':
          insertSyntax('\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n', '');
          break;
        default:
          break;
      }
    });
  });

  // Keyboard Shortcuts (Ctrl+B, Ctrl+I)
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertSyntax('**', '**', 'bold text');
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertSyntax('*', '*', 'italic text');
    }
  });
}

/**
 * Handle Article Publish / Update Submission
 */
function initFormSubmit() {
  const form = document.getElementById('editor-form');
  if (!form) return;

  const submitBtn = document.getElementById('publish-btn');
  const alertBox = document.getElementById('editor-alert');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertBox) alertBox.innerHTML = '';

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title || !content) {
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert-box alert-danger">Please provide both a title and article content.</div>`;
      }
      showToast('Title and content are required.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Saving...</span>`;
    }

    const endpoint = isEditMode 
      ? `${EDITOR_API_BASE}/posts_update.php`
      : `${EDITOR_API_BASE}/posts_create.php`;

    const payload = isEditMode
      ? { id: currentPostId, title, content }
      : { title, content };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });

      const json = await res.json();

      if (json.status) {
        const targetId = json.data?.post?.id || currentPostId;
        showToast(isEditMode ? 'Article updated successfully!' : 'Article published successfully!', 'success');
        
        setTimeout(() => {
          window.location.href = `post.html?id=${targetId}`;
        }, 800);
      } else {
        const errorMsg = json.data?.errors 
          ? Object.values(json.data.errors).filter(Boolean).join('<br>')
          : json.message;
        if (alertBox) {
          alertBox.innerHTML = `<div class="alert-box alert-danger">${errorMsg || 'Failed to save article.'}</div>`;
        }
        showToast(json.message || 'Operation failed', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>${isEditMode ? 'Save Changes' : 'Publish Article'}</span>`;
        }
      }
    } catch (err) {
      console.error('Editor submit error:', err);
      if (alertBox) {
        alertBox.innerHTML = `<div class="alert-box alert-danger">Network error while saving. Please try again.</div>`;
      }
      showToast('Network error occurred.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>${isEditMode ? 'Save Changes' : 'Publish Article'}</span>`;
      }
    }
  });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('editor-form')) {
    initEditor();
  }
});
