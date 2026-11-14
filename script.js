pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// كتابك الحقيقي فقط (A Bird in the Hand)
const booksData = [
    {
        id: 1,
        title: "A Bird in the Hand",
        author: "Randall Garrett",
        category: "Science Fiction",
        cover: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80",
        pdfUrl: "books/sample1.pdf"
    }
];

const booksGrid = document.getElementById('booksGrid');
const searchInput = document.getElementById('searchInput');
const catButtons = document.querySelectorAll('.cat-btn');
const bookCount = document.getElementById('bookCount');
const readerModal = document.getElementById('readerModal');
const modalBookTitle = document.getElementById('modalBookTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const flipbookContainer = document.getElementById('flipbookContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageIndicator = document.getElementById('pageIndicator');

let currentCategory = 'all';
let pageFlipInstance = null;

function renderBooks(books) {
    booksGrid.innerHTML = '';
    bookCount.textContent = `${books.length} ${books.length === 1 ? 'Book' : 'Books'} Available`;

    if (books.length === 0) {
        booksGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #475569; padding: 40px;">No books found in this section yet.</p>';
        return;
    }

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        // الضغط في أي مكان على بطاقة الكتاب يفتح الكتاب فوراً
        card.onclick = () => openBook(book.title, book.pdfUrl);

        card.innerHTML = `
            <div class="book-cover-wrapper">
                <img src="${book.cover}" alt="${book.title}" class="book-cover">
                <span class="book-badge">📖 Flipbook Ready</span>
            </div>
            <div class="book-info">
                <span class="book-category">${book.category}</span>
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">By: ${book.author}</p>
                <button class="read-btn">Open Book</button>
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

async function openBook(title, url) {
    modalBookTitle.textContent = title;
    readerModal.style.display = 'flex';
    loadingSpinner.style.display = 'block';
    loadingSpinner.textContent = 'Opening Book Pages...';
    pageIndicator.textContent = 'Loading...';

    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    flipbookContainer.innerHTML = '';

    try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const totalPages = pdf.numPages;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
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

        pageFlipInstance = new St.PageFlip(flipbookContainer, {
            width: isMobile ? 320 : 420,
            height: isMobile ? 460 : 580,
            size: "stretch",
            minWidth: 280,
            maxWidth: 550,
            minHeight: 400,
            maxHeight: 750,
            showCover: true,
            usePortrait: isMobile,
            mobileScrollSupport: false
        });

        pageFlipInstance.loadFromHTML(document.querySelectorAll('.page-sheet'));

        pageIndicator.textContent = `Page 1 of ${totalPages}`;
        pageFlipInstance.on('flip', (e) => {
            pageIndicator.textContent = `Page ${e.data + 1} of ${totalPages}`;
        });

    } catch (error) {
        loadingSpinner.textContent = 'Make sure the file inside books folder is named sample1.pdf (not sample1.pdf.pdf).';
        console.error(error);
    }
}

prevPageBtn.addEventListener('click', () => {
    if (pageFlipInstance) pageFlipInstance.flipPrev();
});

nextPageBtn.addEventListener('click', () => {
    if (pageFlipInstance) pageFlipInstance.flipNext();
});

closeModalBtn.addEventListener('click', () => {
    readerModal.style.display = 'none';
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    flipbookContainer.innerHTML = '';
});

renderBooks(booksData);
