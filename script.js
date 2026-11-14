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
const progressPercent = document.getElementById('progressPercent');
const readingProgressFill = document.getElementById('readingProgressFill');

// أدوات القارئ الجديدة
const fullscreenBtn = document.getElementById('fullscreenBtn');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const bookmarkText = document.getElementById('bookmarkText');
const goBookmarkBtn = document.getElementById('goBookmarkBtn');
const savedPageNum = document.getElementById('savedPageNum');
const goldBookmarkRibbon = document.getElementById('goldBookmarkRibbon');
const sepiaBtn = document.getElementById('sepiaBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');

let currentCategory = 'all';
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
        return matchesCategory && matchesSearch;
    });
    renderBooks(filtered);
}

catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterBooks();
    });
});

searchInput.addEventListener('input', filterBooks);

function updateReadingUI(pageIdx) {
    currentPageIndex = pageIdx;
    const displayPage = pageIdx + 1;
    const percent = Math.round((displayPage / totalBookPages) * 100);

    pageIndicator.textContent = `Page ${displayPage} of ${totalBookPages}`;
    progressPercent.textContent = `(${percent}%)`;
    readingProgressFill.style.width = `${percent}%`;

    // التحقق من وجود علامة مرجعية محفوظة لهذه الصفحة
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

async function openBook(book) {
    currentBookId = book.id;
    currentZoom = 1;
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
            const viewport = page.getViewport({ scale: 1.5 });

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
        // إظهار الفاصل الذهبي الفخم فقط في وضع الصفحتين (الآيباد والكمبيوتر)
        goldenSpine.style.display = isMobile ? 'none' : 'block';

        pageFlipInstance = new St.PageFlip(flipbookContainer, {
            width: isMobile ? 310 : 410,
            height: isMobile ? 440 : 540,
            size: "stretch",
            minWidth: 260,
            maxWidth: 520,
            minHeight: 360,
            maxHeight: 680,
            showCover: false,
            usePortrait: isMobile,
            mobileScrollSupport: false
        });

        pageFlipInstance.loadFromHTML(document.querySelectorAll('.page-sheet'));

        const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
        const startPage = saved ? parseInt(saved) : 0;

        if (startPage > 0 && startPage < totalBookPages) {
            setTimeout(() => pageFlipInstance.flip(startPage), 200);
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

// زر حفظ العلامة المرجعية (Bookmark)
bookmarkBtn.addEventListener('click', () => {
    if (!currentBookId) return;
    localStorage.setItem(`rofoof_bookmark_${currentBookId}`, currentPageIndex);
    updateReadingUI(currentPageIndex);
    renderBooks(booksData);
});

// زر الانتقال السريع للصفحة المحفوظة
goBookmarkBtn.addEventListener('click', () => {
    const saved = localStorage.getItem(`rofoof_bookmark_${currentBookId}`);
    if (saved !== null && pageFlipInstance) {
        pageFlipInstance.flip(parseInt(saved));
    }
});

// زر وضع ملء الشاشة (Full Screen)
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        if (readerContainer.requestFullscreen) {
            readerContainer.requestFullscreen();
        } else if (readerContainer.webkitRequestFullscreen) {
            readerContainer.webkitRequestFullscreen();
        }
        fullscreenBtn.innerHTML = '⛶ Exit Full Screen';
        fullscreenBtn.classList.add('active-tool');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        fullscreenBtn.innerHTML = '⛶ Full Screen';
        fullscreenBtn.classList.remove('active-tool');
    }
});

// زر وضع الورق الدافئ المريح للعين
sepiaBtn.addEventListener('click', () => {
    bookWrapper.classList.toggle('sepia-mode');
    sepiaBtn.classList.toggle('active-tool');
});

// أزرار التكبير والتصغير
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
        document.exitFullscreen();
    }
    readerModal.style.display = 'none';
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    flipbookContainer.innerHTML = '';
    renderBooks(booksData);
});

renderBooks(booksData);
