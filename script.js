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
const sectionTitle = document.getElementById('sectionTitle');
const bookCount = document.getElementById('bookCount');
const readerModal = document.getElementById('readerModal');
const readerContainer = document.getElementById('readerContainer');
const modalBookTitle = document.getElementById('modalBookTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const flipbookContainer = document.getElementById('flipbookContainer');
const flipbookStage = document.getElementById('flipbookStage');
const bookWrapper = document.getElementById('bookWrapper');
const goldenSpine = document.getElementById('goldenSpine');
const loadingSpinner = document.getElementById('loadingSpinner');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageIndicator = document.getElementById('pageIndicator');
const readingProgressFill = document.getElementById('readingProgressFill');

// عناصر الشريط السفلي الزجاجي
const dockHomeBtn = document.getElementById('dockHomeBtn');
const dockCategoriesBtn = document.getElementById('dockCategoriesBtn');
const dockSavedBtn = document.getElementById('dockSavedBtn');
const dockSearchBtn = document.getElementById('dockSearchBtn');
const categoriesPopover = document.getElementById('categoriesPopover');
const catChips = document.querySelectorAll('.cat-chip');

// قائمة الأدوات الجانبية القابلة للفتح والإغلاق
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
let onlySavedFilter = false;
let pageFlipInstance = null;
let currentBookId = null;
let currentPageIndex = 0;
let totalBookPages = 1;
let currentZoom = 1;

function renderBooks(books) {
    booksGrid.innerHTML = '';
    bookCount.textContent = `${books.length} ${books.length === 1 ? 'Book' : 'Books'} Available`;

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
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = booksData.filter(book => {
        const matchesCategory = currentCategory === 'all' || book.category === currentCategory;
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm);
        const matchesSaved = !onlySavedFilter || localStorage.getItem(`rofoof_bookmark_${book.id}`) !== null;
        return matchesCategory && matchesSearch && matchesSaved;
    });
    renderBooks(filtered);
}

// أزرار الشريط السفلي الزجاجي
function setActiveDock(btn) {
    [dockHomeBtn, dockCategoriesBtn, dockSavedBtn, dockSearchBtn].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

dockHomeBtn.addEventListener('click', () => {
    setActiveDock(dockHomeBtn);
    categoriesPopover.classList.remove('open');
    currentCategory = 'all';
    onlySavedFilter = false;
    sectionTitle.textContent = 'Featured Library Collection';
    filterBooks();
});

dockCategoriesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveDock(dockCategoriesBtn);
    categoriesPopover.classList.toggle('open');
});

dockSavedBtn.addEventListener('click', () => {
    setActiveDock(dockSavedBtn);
    categoriesPopover.classList.remove('open');
    onlySavedFilter = true;
    sectionTitle.textContent = 'Bookmarked Books';
    filterBooks();
});

dockSearchBtn.addEventListener('click', () => {
    setActiveDock(dockSearchBtn);
    categoriesPopover.classList.remove('open');
    searchInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

catChips.forEach(chip => {
    chip.addEventListener('click', () => {
        catChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCategory = chip.dataset.category;
        onlySavedFilter = false;
        sectionTitle.textContent = currentCategory === 'all' ? 'Featured Library Collection' : `${currentCategory} Section`;
        categoriesPopover.classList.remove('open');
        filterBooks();
    });
});

document.addEventListener('click', (e) => {
    if (!categoriesPopover.contains(e.target) && !dockCategoriesBtn.contains(e.target)) {
        categoriesPopover.classList.remove('open');
    }
});

searchInput.addEventListener('input', filterBooks);

// فتح وإغلاق قائمة الأدوات الجانبية بجانب الصفحة اليمنى
sideToolsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sideToolsDrawer.classList.toggle('open');
    sideToolsToggle.classList.toggle('active');
    sideToolsToggle.textContent = sideToolsDrawer.classList.contains('open') ? '✕' : '☰';
});

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

    pageIndicator.textContent = `Page ${displayPage} of ${totalBookPages} (${percent}%)`;
    readingProgressFill.style.width = `${percent}%`;

    const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
    if (saved !== null) {
        const savedIdx = parseInt(saved);
        savedPageNum.textContent = savedIdx + 1;
        goBookmarkBtn.style.display = 'block';

        if (isCurrentPageBookmarked()) {
            goldBookmarkRibbon.style.display = 'block';
            bookmarkText.textContent = 'Remove Bookmark';
            bookmarkBtn.classList.add('active-tool');
        } else {
            goldBookmarkRibbon.style.display = 'none';
            bookmarkText.textContent = 'Save Bookmark';
            bookmarkBtn.classList.remove('active-tool');
        }
    } else {
        goBookmarkBtn.style.display = 'none';
        goldBookmarkRibbon.style.display = 'none';
        bookmarkText.textContent = 'Save Bookmark';
        bookmarkBtn.classList.remove('active-tool');
    }
}

async function openBook(book) {
    currentBookId = book.id;
    currentZoom = 1;
    bookWrapper.style.transform = 'scale(1)';
    sideToolsDrawer.classList.remove('open');
    sideToolsToggle.classList.remove('active');
    sideToolsToggle.textContent = '☰';

    modalBookTitle.textContent = book.title;
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

        // حساب أبعاد الكتاب ليملأ الشاشة فوراً وتلقائياً بكل وضوح
        const availW = window.innerWidth - 16;
        const availH = window.innerHeight - 16;

        pageFlipInstance = new St.PageFlip(flipbookContainer, {
            width: isMobile ? availW : Math.floor(availW / 2),
            height: availH,
            size: "stretch",
            minWidth: 260,
            maxWidth: 1400,
            minHeight: 360,
            maxHeight: 1600,
            showCover: false,
            usePortrait: isMobile,
            mobileScrollSupport: false
        });

        pageFlipInstance.loadFromHTML(document.querySelectorAll('.page-sheet'));

        const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
        const startPage = saved !== null ? parseInt(saved) : 0;

        if (startPage > 0 && startPage < totalBookPages) {
            setTimeout(() => {
                if (pageFlipInstance) pageFlipInstance.turnToPage(startPage);
            }, 150);
        }

        updateReadingUI(startPage);

        pageFlipInstance.on('flip', (e) => {
            updateReadingUI(e.data);
        });

    } catch (error) {
        loadingSpinner.textContent = 'Error loading PDF file.';
        console.error(error);
    }
}

bookmarkBtn.addEventListener('click', () => {
    if (!currentBookId) return;
    if (isCurrentPageBookmarked()) {
        localStorage.removeItem(`rofoof_bookmark_${currentBookId}`);
    } else {
        localStorage.setItem(`rofoof_bookmark_${currentBookId}`, currentPageIndex);
    }
    updateReadingUI(currentPageIndex);
    filterBooks();
});

goBookmarkBtn.addEventListener('click', () => {
    const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
    if (saved !== null && pageFlipInstance) {
        pageFlipInstance.flip(parseInt(saved));
    }
});

// وضع القراءة الدافئ المريح للعين (Warm Mode)
warmModeBtn.addEventListener('click', () => {
    bookWrapper.classList.toggle('warm-mode');
    warmModeBtn.classList.toggle('active-tool');
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        if (readerContainer.requestFullscreen) {
            readerContainer.requestFullscreen().catch(() => {});
        } else if (readerContainer.webkitRequestFullscreen) {
            readerContainer.webkitRequestFullscreen();
        }
        fullscreenBtn.textContent = '⛶ Exit Full Screen';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
        fullscreenBtn.textContent = '⛶ Full Screen';
    }
});

zoomInBtn.addEventListener('click', () => {
    if (currentZoom < 1.5) {
        currentZoom += 0.15;
        bookWrapper.style.transform = `scale(${currentZoom})`;
    }
});

zoomOutBtn.addEventListener('click', () => {
    if (currentZoom > 0.85) {
        currentZoom -= 0.15;
        bookWrapper.style.transform = `scale(${currentZoom})`;
    }
});

prevPageBtn.addEventListener('click', () => {
    if (pageFlipInstance) pageFlipInstance.flipPrev();
});

nextPageBtn.addEventListener('click', () => {
    if (pageFlipInstance) pageFlipInstance.flipNext();
});

closeModalBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
    readerModal.style.display = 'none';
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    flipbookContainer.innerHTML = '';
    filterBooks();
});

renderBooks(booksData);
