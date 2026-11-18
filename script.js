pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const booksData = [
    {
        id: 1,
        title: "A Bird in the Hand",
        author: "Randall Garrett",
        category: "Science Fiction",
        cover: "cover1.jpg",
        pdfUrl: "books/sample1.pdf"
    }
];

const booksGrid = document.getElementById('booksGrid');
const searchInput = document.getElementById('searchInput');
const catButtons = document.querySelectorAll('.cat-btn');
const sectionTitle = document.getElementById('sectionTitle');
const bookCount = document.getElementById('bookCount');
const readerModal = document.getElementById('readerModal');
const readerContainer = document.getElementById('readerContainer');
const modalBookTitle = document.getElementById('modalBookTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const flipbookContainer = document.getElementById('flipbookContainer');
const bookWrapper = document.getElementById('bookWrapper');
const goldenSpine = document.getElementById('goldenSpine');
const loadingSpinner = document.getElementById('loadingSpinner');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageIndicator = document.getElementById('pageIndicator');
const readingProgressFill = document.getElementById('readingProgressFill');

// أدوات القارئ الجانبية
const sideToolsToggle = document.getElementById('sideToolsToggle');
const sideToolsDrawer = document.getElementById('sideToolsDrawer');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const bookmarkText = document.getElementById('bookmarkText');
const goBookmarkBtn = document.getElementById('goBookmarkBtn');
const savedPageNum = document.getElementById('savedPageNum');
const goldBookmarkRibbon = document.getElementById('goldBookmarkRibbon');
const warmModeBtn = document.getElementById('warmModeBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');

let currentCategory = 'all';
let pageFlipInstance = null;
let currentBookId = null;
let currentPageIndex = 0;
let totalBookPages = 1;
let currentZoom = 1;

function renderBooks(books) {
    if (!booksGrid) return;
    booksGrid.innerHTML = '';
    if (bookCount) {
        bookCount.textContent = `${books.length} ${books.length === 1 ? 'Book' : 'Books'} Available`;
    }

    if (books.length === 0) {
        booksGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #475569; padding: 40px;">No books found in this section yet.</p>';
        return;
    }

    books.forEach(book => {
        const savedPage = localStorage.getItem(`rofoof_bookmark_${book.id}`);
        const badgeLabel = savedPage !== null ? `🔖 Page ${parseInt(savedPage) + 1}` : '📖 Flipbook Ready';

        const card = document.createElement('div');
        card.className = 'book-card';
        card.onclick = () => openBook(book);

        card.innerHTML = `
            <div class="book-cover-wrapper">
                <img src="${book.cover}" alt="${book.title}" class="book-cover">
                <span class="book-badge">${badgeLabel}</span>
            </div>
            <div class="book-info">
                <span class="book-category">${book.category}</span>
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">By: ${book.author}</p>
                <button class="read-btn">${savedPage !== null ? 'Continue Reading' : 'Open Book'}</button>
            </div>
        `;
        booksGrid.appendChild(card);
    });
}

function filterBooks() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filtered = booksData.filter(book => {
        const matchesCategory = currentCategory === 'all' || book.category === currentCategory;
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    renderBooks(filtered);
}

catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        if (sectionTitle) {
            sectionTitle.textContent = currentCategory === 'all' ? 'Featured Library Collection' : `${currentCategory} Section`;
        }
        filterBooks();
    });
});

if (searchInput) {
    searchInput.addEventListener('input', filterBooks);
}

// فتح وإغلاق قائمة الأدوات الجانبية بجانب الصفحة اليمنى
if (sideToolsToggle && sideToolsDrawer) {
    sideToolsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sideToolsDrawer.classList.toggle('open');
        sideToolsToggle.classList.toggle('active');
        sideToolsToggle.textContent = sideToolsDrawer.classList.contains('open') ? '✕' : '☰';
    });
}

function isCurrentPageBookmarked() {
    const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
    if (saved === null) return false;
    const savedIdx = parseInt(saved);
    return savedIdx === currentPageIndex || savedIdx === currentPageIndex + 1;
}

function updateReadingUI(pageIdx) {
    currentPageIndex = pageIdx;
    const displayPage = pageIdx + 1;
    const percent = Math.round((displayPage / totalBookPages) * 100);

    if (pageIndicator) pageIndicator.textContent = `Page ${displayPage} of ${totalBookPages} (${percent}%)`;
    if (readingProgressFill) readingProgressFill.style.width = `${percent}%`;

    const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
    if (saved !== null) {
        const savedIdx = parseInt(saved);
        if (savedPageNum) savedPageNum.textContent = savedIdx + 1;
        if (goBookmarkBtn) goBookmarkBtn.style.display = 'block';

        if (isCurrentPageBookmarked()) {
            if (goldBookmarkRibbon) goldBookmarkRibbon.style.display = 'block';
            if (bookmarkText) bookmarkText.textContent = 'Remove Bookmark';
            if (bookmarkBtn) bookmarkBtn.classList.add('active-tool');
        } else {
            if (goldBookmarkRibbon) goldBookmarkRibbon.style.display = 'none';
            if (bookmarkText) bookmarkText.textContent = 'Save Bookmark';
            if (bookmarkBtn) bookmarkBtn.classList.remove('active-tool');
        }
    } else {
        if (goBookmarkBtn) goBookmarkBtn.style.display = 'none';
        if (goldBookmarkRibbon) goldBookmarkRibbon.style.display = 'none';
        if (bookmarkText) bookmarkText.textContent = 'Save Bookmark';
        if (bookmarkBtn) bookmarkBtn.classList.remove('active-tool');
    }
}

async function openBook(book) {
    currentBookId = book.id;
    currentZoom = 1;
    bookWrapper.style.transform = 'scale(1)';
    if (sideToolsDrawer) sideToolsDrawer.classList.remove('open');
    if (sideToolsToggle) {
        sideToolsToggle.classList.remove('active');
        sideToolsToggle.textContent = '☰';
    }

    if (modalBookTitle) modalBookTitle.textContent = book.title;
    readerModal.style.display = 'block';
    loadingSpinner.style.display = 'block';
    goldenSpine.style.display = 'none';

    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    flipbookContainer.innerHTML = '';

    try {
        const pdf = await pdfjsLib.getDocument(book.pdfUrl).promise;
        totalBookPages = pdf.numPages;

        for (let pageNum = 1; pageNum <= totalBookPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.6 });

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-sheet';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            pageDiv.appendChild(canvas);
            flipbookContainer.appendChild(pageDiv);
        }

        loadingSpinner.style.display = 'none';

        const isMobile = window.innerWidth < 650;
        goldenSpine.style.display = isMobile ? 'none' : 'block';

        const availW = window.innerWidth - 16;
