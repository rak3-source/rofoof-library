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
const currentSectionTitle = document.getElementById('currentSectionTitle');
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
const progressPercent = document.getElementById('progressPercent');
const readingProgressFill = document.getElementById('readingProgressFill');

// عناصر الشريط السفلي الزجاجي
const dockHomeBtn = document.getElementById('dockHomeBtn');
const dockCategoriesBtn = document.getElementById('dockCategoriesBtn');
const dockSavedBtn = document.getElementById('dockSavedBtn');
const dockSearchBtn = document.getElementById('dockSearchBtn');
const categoriesPopover = document.getElementById('categoriesPopover');
const catChips = document.querySelectorAll('.cat-chip');

// أدوات القارئ
const fullscreenBtn = document.getElementById('fullscreenBtn');
const exitFullscreenFloatBtn = document.getElementById('exitFullscreenFloatBtn');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const bookmarkText = document.getElementById('bookmarkText');
const goBookmarkBtn = document.getElementById('goBookmarkBtn');
const savedPageNum = document.getElementById('savedPageNum');
const goldBookmarkRibbon = document.getElementById('goldBookmarkRibbon');
const sepiaBtn = document.getElementById('sepiaBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');

let currentCategory = 'all';
let onlySavedFilter = false;
let pageFlipInstance = null;
let currentBookId = null;
let currentPageIndex = 0;
let totalBookPages = 1;
let currentZoom = 1;
let isPureFullscreen = false;

// التحقق تلقائياً إذا قام المستخدم برفع صورة فاصلة مخصصة باسم spine.png
const customSpineImg = new Image();
customSpineImg.src = 'spine.png';
customSpineImg.onload = () => {
    goldenSpine.style.background = `url('spine.png') center / 100% 100% no-repeat`;
    goldenSpine.style.width = '36px';
};

function renderBooks(books) {
    booksGrid.innerHTML = '';
    bookCount.textContent = `${books.length} ${books.length === 1 ? 'Book' : 'Books'} Available`;

    if (books.length === 0) {
        booksGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #526b60; padding: 40px;">No books found matching your selection.</p>';
        return;
    }

    books.forEach(book => {
        const savedPage = localStorage.getItem(`rofoof_bookmark_${book.id}`);
        const badgeLabel = savedPage ? `🔖 Page ${parseInt(savedPage) + 1}` : '📖 Flipbook Ready';

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
                <button class="read-btn">${savedPage ? 'Continue Reading' : 'Open Book'}</button>
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

// تحكم أزرار الشريط السفلي العائم
function setActiveDock(btn) {
    [dockHomeBtn, dockCategoriesBtn, dockSavedBtn, dockSearchBtn].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

dockHomeBtn.addEventListener('click', () => {
    setActiveDock(dockHomeBtn);
    categoriesPopover.classList.remove('open');
    currentCategory = 'all';
    onlySavedFilter = false;
    currentSectionTitle.textContent = 'All Library Books';
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
    currentSectionTitle.textContent = 'Bookmarked Books';
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
        currentSectionTitle.textContent = currentCategory === 'all' ? 'All Library Books' : `${currentCategory} Section`;
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

// بناء القارئ بأبعاد تتناسب تلقائياً مع الشاشة سواء في الوضع العادي أو ملء الشاشة الكامل
function initFlipbookLayout(startPage = 0) {
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
    }

    const isMobile = window.innerWidth < 650;
    goldenSpine.style.display = isMobile ? 'none' : 'block';

    // حساب الأبعاد المثالية لملء المساحة المتاحة بدقة دون قص أي طرف
    const stageWidth = isPureFullscreen ? window.innerWidth : flipbookStage.clientWidth - 24;
    const stageHeight = isPureFullscreen ? window.innerHeight : flipbookStage.clientHeight - 24;

    const singlePageWidth = isMobile ? stageWidth : Math.floor(stageWidth / 2);
    const singlePageHeight = stageHeight;

    pageFlipInstance = new St.PageFlip(flipbookContainer, {
        width: singlePageWidth,
        height: singlePageHeight,
        size: "stretch",
        minWidth: 250,
        maxWidth: 1200,
        minHeight: 320,
        maxHeight: 1400,
        showCover: false,
        usePortrait: isMobile,
        mobileScrollSupport: false
    });

    pageFlipInstance.loadFromHTML(document.querySelectorAll('.page-sheet'));

    if (startPage > 0 && startPage < totalBookPages) {
        setTimeout(() => pageFlipInstance.flip(startPage), 150);
    }

    updateReadingUI(startPage);

    pageFlipInstance.on('flip', (e) => {
        updateReadingUI(e.data);
    });
}

function updateReadingUI(pageIdx) {
    currentPageIndex = pageIdx;
    const displayPage = pageIdx + 1;
    const percent = Math.round((displayPage / totalBookPages) * 100);

    pageIndicator.textContent = `Page ${displayPage} of ${totalBookPages}`;
    progressPercent.textContent = `(${percent}%)`;
    readingProgressFill.style.width = `${percent}%`;

    const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
    if (saved !== null) {
        const savedIdx = parseInt(saved);
        savedPageNum.textContent = savedIdx + 1;
        goBookmarkBtn.style.display = 'inline-block';

        if (savedIdx === pageIdx || savedIdx === pageIdx + 1) {
            goldBookmarkRibbon.style.display = 'block';
            bookmarkText.textContent = 'Bookmarked';
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

let cachedPagesHTML = '';

async function openBook(book) {
    currentBookId = book.id;
    currentZoom = 1;
    isPureFullscreen = false;
    readerContainer.classList.remove('is-pure-fullscreen');
    bookWrapper.style.transform = 'scale(1)';
    modalBookTitle.textContent = book.title;
    readerModal.style.display = 'flex';
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

        cachedPagesHTML = flipbookContainer.innerHTML;
        loadingSpinner.style.display = 'none';

        const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
        const startPage = saved ? parseInt(saved) : 0;
        initFlipbookLayout(startPage);

    } catch (error) {
        loadingSpinner.textContent = 'Error loading PDF file.';
        console.error(error);
    }
}

// تفعيل وضع ملء الشاشة الكامل الحقيقي (الكتاب فقط يملأ كامل الشاشة من الحافة للحافة)
function togglePureFullscreen(enable) {
    isPureFullscreen = enable;
    if (enable) {
        readerContainer.classList.add('is-pure-fullscreen');
        if (readerContainer.requestFullscreen) {
            readerContainer.requestFullscreen().catch(() => {});
        } else if (readerContainer.webkitRequestFullscreen) {
            readerContainer.webkitRequestFullscreen();
        }
    } else {
        readerContainer.classList.remove('is-pure-fullscreen');
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }

    // إعادة ضبط أبعاد الكتاب فوراً لتتطابق مع أطراف الشاشة الجديدة
    setTimeout(() => {
        flipbookContainer.innerHTML = cachedPagesHTML;
        initFlipbookLayout(currentPageIndex);
    }, 120);
}

fullscreenBtn.addEventListener('click', () => togglePureFullscreen(true));
exitFullscreenFloatBtn.addEventListener('click', () => togglePureFullscreen(false));

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isPureFullscreen) {
        togglePureFullscreen(false);
    }
});

window.addEventListener('resize', () => {
    if (readerModal.style.display === 'flex' && cachedPagesHTML) {
        flipbookContainer.innerHTML = cachedPagesHTML;
        initFlipbookLayout(currentPageIndex);
    }
});

bookmarkBtn.addEventListener('click', () => {
    if (!currentBookId) return;
    localStorage.setItem(`rofoof_bookmark_${currentBookId}`, currentPageIndex);
    updateReadingUI(currentPageIndex);
    filterBooks();
});

goBookmarkBtn.addEventListener('click', () => {
    const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
    if (saved !== null && pageFlipInstance) {
        pageFlipInstance.flip(parseInt(saved));
    }
});

sepiaBtn.addEventListener('click', () => {
    bookWrapper.classList.toggle('sepia-mode');
    sepiaBtn.classList.toggle('active-tool');
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
    if (isPureFullscreen) togglePureFullscreen(false);
    readerModal.style.display = 'none';
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    flipbookContainer.innerHTML = '';
    filterBooks();
});

renderBooks(booksData);
