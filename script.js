// تهيئة محرك PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const booksData = [
    {
        id: 1,
        title: "Journey to the Center of the Earth",
        author: "Jules Verne",
        category: "Novels",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
        pdfUrl: "books/sample1.pdf"
    },
    {
        id: 2,
        title: "Fundamentals of Space & Astronomy",
        author: "School Science Department",
        category: "Science",
        cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80",
        pdfUrl: "books/sample2.pdf"
    },
    {
        id: 3,
        title: "Classic Fables & Short Stories",
        author: "Aesop",
        category: "Short Stories",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
        pdfUrl: "books/sample3.pdf"
    },
    {
        id: 4,
        title: "Scientists Who Changed History",
        author: "Dr. Ahmed Zaki",
        category: "History",
        cover: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80",
        pdfUrl: "books/sample4.pdf"
    }
];

const booksGrid = document.getElementById('booksGrid');
const searchInput = document.getElementById('searchInput');
const catButtons = document.querySelectorAll('.cat-btn');
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
    if (books.length === 0) {
        booksGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">No books found matching your search.</p>';
        return;
    }

    books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" class="book-cover">
            <div class="book-info">
                <span class="book-category">${book.category}</span>
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">By: ${book.author}</p>
                <button class="read-btn" onclick="openBook('${book.title}', '${book.pdfUrl}')">Read Book</button>
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

// دالة فتح الكتاب وتحويل صفحات الـ PDF إلى كتاب تفاعلي بصفحتين
async function openBook(title, url) {
    modalBookTitle.textContent = title;
    readerModal.style.display = 'flex';
    loadingSpinner.style.display = 'block';
    pageIndicator.textContent = 'Loading...';

    // تنظيف أي كتاب سابق
    if (pageFlipInstance) {
        pageFlipInstance.destroy();
        pageFlipInstance = null;
    }
    flipbookContainer.innerHTML = '';

    try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const totalPages = pdf.numPages;

        // تحويل كل صفحة من الـ PDF إلى عنصر صفحة في الكتاب
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

        // تحديد وضع العرض: صفحتان بجانب بعض على الآيباد والكمبيوتر، وصفحة واحدة على الجوال الصغير
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
            usePortrait: isMobile, // false على الآيباد والكمبيوتر ليعرض صفحتين متقابلتين
            mobileScrollSupport: false
        });

        pageFlipInstance.loadFromHTML(document.querySelectorAll('.page-sheet'));

        pageIndicator.textContent = `Page 1 of ${totalPages}`;
        pageFlipInstance.on('flip', (e) => {
            pageIndicator.textContent = `Page ${e.data + 1} of ${totalPages}`;
        });

    } catch (error) {
        loadingSpinner.textContent = 'Error loading book. Make sure the PDF file exists in the books folder.';
        console.error(error);
    }
}

// أزرار تقليب الصفحات
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