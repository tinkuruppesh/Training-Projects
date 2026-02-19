const API_KEY = '78033499'; // OMDB API Key
const API_URL = 'https://www.omdbapi.com/';

let currentPage = 1;
let currentSearch = '';
let currentType = '';
let currentYear = '';
let totalResults = 0;
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Initialize
window.addEventListener('load', () => {
    populateYearFilter();
    updateWatchlistBadge();
    loadTheme();
    searchMovies('Avengers'); // Default search
});

function populateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        searchMovies();
    }
}

async function searchMovies(query = null) {
    const searchInput = document.getElementById('searchInput');
    currentSearch = query || searchInput.value.trim();
    
    if (!currentSearch) return;
    
    currentPage = 1;
    await fetchMovies();
}

function applyFilters() {
    currentType = document.getElementById('typeFilter').value;
    currentYear = document.getElementById('yearFilter').value;
    currentPage = 1;
    fetchMovies();
}

async function fetchMovies() {
    showLoading(true);
    hideEmpty();
    
    let url = `${API_URL}?apikey=${API_KEY}&s=${currentSearch}&page=${currentPage}`;
    
    if (currentType) url += `&type=${currentType}`;
    if (currentYear) url += `&y=${currentYear}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.Response === 'True') {
            totalResults = parseInt(data.totalResults);
            displayMovies(data.Search);
            updateStats();
            renderPagination();
        } else {
            showEmpty();
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showEmpty();
    } finally {
        showLoading(false);
    }
}

function displayMovies(movies) {
    const grid = document.getElementById('moviesGrid');
    
    grid.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="showMovieDetails('${movie.imdbID}')">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/250x350?text=No+Poster'}" 
                 alt="${movie.Title}" 
                 class="movie-poster">
            <div class="movie-info">
                <div class="movie-title">${movie.Title}</div>
                <div class="movie-meta">
                    <span>${movie.Year}</span>
                    <span class="movie-type">${movie.Type}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const stats = document.getElementById('stats');
    const start = (currentPage - 1) * 10 + 1;
    const end = Math.min(currentPage * 10, totalResults);
    stats.textContent = `Showing ${start}-${end} of ${totalResults} results`;
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalResults / 10);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
    `;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<span style="padding: 0 10px;">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span style="padding: 0 10px;">...</span>`;
        html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    html += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    fetchMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showMovieDetails(imdbID) {
    const modal = document.getElementById('movieModal');
    const modalBody = document.getElementById('modalBody');
    
    modal.classList.add('active');
    modalBody.innerHTML = '<div class="loading active"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const movie = await response.json();
        
        if (movie.Response === 'True') {
            const isInWatchlist = watchlist.some(item => item.imdbID === movie.imdbID);
            
            modalBody.innerHTML = `
                <div class="modal-header">
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300'}" 
                         class="modal-backdrop" alt="">
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300'}" 
                         class="modal-poster" alt="${movie.Title}">
                </div>
                
                <div class="modal-details">
                    <h2 class="modal-title">${movie.Title}</h2>
                    
                    <div class="modal-meta">
                        <div class="meta-item">📅 ${movie.Year}</div>
                        <div class="meta-item">⏱️ ${movie.Runtime}</div>
                        <div class="meta-item rating">⭐ ${movie.imdbRating}/10</div>
                        <div class="meta-item">🎭 ${movie.Genre}</div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="action-btn btn-primary" onclick="toggleWatchlist('${movie.imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${movie.Year}', '${movie.Poster}')">
                            <span>${isInWatchlist ? '✓' : '+'}</span>
                            <span>${isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                        </button>
                        <button class="action-btn btn-secondary" onclick="window.open('https://www.imdb.com/title/${movie.imdbID}', '_blank')">
                            <span>🔗</span>
                            <span>View on IMDb</span>
                        </button>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="section-title">Plot</h3>
                        <p>${movie.Plot}</p>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="section-title">Cast & Crew</h3>
                        <p><strong>Director:</strong> ${movie.Director}</p>
                        <p><strong>Writers:</strong> ${movie.Writer}</p>
                        <p><strong>Actors:</strong> ${movie.Actors}</p>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="section-title">Additional Info</h3>
                        <p><strong>Language:</strong> ${movie.Language}</p>
                        <p><strong>Country:</strong> ${movie.Country}</p>
                        <p><strong>Awards:</strong> ${movie.Awards}</p>
                        <p><strong>Box Office:</strong> ${movie.BoxOffice || 'N/A'}</p>
                    </div>
                    
                    <div class="modal-section" id="relatedMovies">
                        <h3 class="section-title">Related Movies</h3>
                        <div class="related-movies" id="relatedGrid"></div>
                    </div>
                </div>
            `;
            
            // Fetch related movies
            fetchRelatedMovies(movie.Genre.split(',')[0].trim(), movie.imdbID);
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        modalBody.innerHTML = '<p style="text-align: center; padding: 40px;">Error loading movie details</p>';
    }
}

async function fetchRelatedMovies(genre, excludeID) {
    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${genre}&type=movie`);
        const data = await response.json();
        
        if (data.Response === 'True') {
            const related = data.Search.filter(m => m.imdbID !== excludeID).slice(0, 6);
            const relatedGrid = document.getElementById('relatedGrid');
            
            relatedGrid.innerHTML = related.map(movie => `
                <div class="related-card" onclick="showMovieDetails('${movie.imdbID}')">
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/150x220'}" 
                         alt="${movie.Title}" 
                         class="related-poster">
                    <div class="related-title">${movie.Title}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error fetching related movies:', error);
    }
}

function closeModal() {
    document.getElementById('movieModal').classList.remove('active');
}

function toggleWatchlist(imdbID, title, year, poster) {
    const index = watchlist.findIndex(item => item.imdbID === imdbID);
    
    if (index > -1) {
        watchlist.splice(index, 1);
    } else {
        watchlist.push({ imdbID, title, year, poster });
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistBadge();
    
    // Refresh modal if open
    if (document.getElementById('movieModal').classList.contains('active')) {
        showMovieDetails(imdbID);
    }
    
    // Refresh watchlist panel if open
    if (document.getElementById('watchlistPanel').classList.contains('active')) {
        renderWatchlist();
    }
}

function showWatchlist() {
    const panel = document.getElementById('watchlistPanel');
    panel.classList.add('active');
    renderWatchlist();
}

function closeWatchlist() {
    document.getElementById('watchlistPanel').classList.remove('active');
}

function renderWatchlist() {
    const content = document.getElementById('watchlistContent');
    
    if (watchlist.length === 0) {
        content.innerHTML = '<p style="text-align: center; padding: 40px; opacity: 0.6;">Your watchlist is empty</p>';
        return;
    }
    
    content.innerHTML = watchlist.map(movie => `
        <div class="watchlist-item" onclick="showMovieDetails('${movie.imdbID}')">
            <img src="${movie.poster !== 'N/A' ? movie.poster : 'https://via.placeholder.com/80x120'}" 
                 alt="${movie.title}" 
                 class="watchlist-poster">
            <div class="watchlist-info">
                <div class="watchlist-title">${movie.title}</div>
                <div class="watchlist-year">${movie.year}</div>
                <button class="remove-btn" onclick="event.stopPropagation(); removeFromWatchlist('${movie.imdbID}')">
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

function removeFromWatchlist(imdbID) {
    watchlist = watchlist.filter(item => item.imdbID !== imdbID);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlistBadge();
    renderWatchlist();
}

function updateWatchlistBadge() {
    document.getElementById('watchlistBadge').textContent = watchlist.length;
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.classList.toggle('active', show);
}

function showEmpty() {
    document.getElementById('emptyState').classList.add('active');
    document.getElementById('moviesGrid').innerHTML = '';
    document.getElementById('pagination').innerHTML = '';
    document.getElementById('stats').textContent = '';
}

function hideEmpty() {
    document.getElementById('emptyState').classList.remove('active');
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeWatchlist();
    }
});
