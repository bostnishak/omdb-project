const API_KEY = '4a3b711b';
const API_BASE = 'https://www.omdbapi.com/';
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const typeFilter = document.getElementById('typeFilter');
const yearFilter = document.getElementById('yearFilter');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const resultsGrid = document.getElementById('resultsGrid');
const pagination = document.getElementById('pagination');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const movieModal = document.getElementById('movieModal');
const closeModal = document.getElementById('closeModal');
const modalPoster = document.getElementById('modalPoster');
const modalTitle = document.getElementById('modalTitle');
const modalYear = document.getElementById('modalYear');
const modalRated = document.getElementById('modalRated');
const modalRuntime = document.getElementById('modalRuntime');
const modalGenre = document.getElementById('modalGenre');
const modalPlot = document.getElementById('modalPlot');
const modalDirector = document.getElementById('modalDirector');
const modalWriter = document.getElementById('modalWriter');
const modalActors = document.getElementById('modalActors');
const modalLanguage = document.getElementById('modalLanguage');
const modalCountry = document.getElementById('modalCountry');
const modalAwards = document.getElementById('modalAwards');
const modalBoxOffice = document.getElementById('modalBoxOffice');
const modalBoxOfficeRow = document.getElementById('modalBoxOfficeRow');
const modalRating = document.getElementById('modalRating');
const modalRatings = document.getElementById('modalRatings');
let state = {
    query: '',
    type: '',
    year: '',
    page: 1,
    totalResults: 0,
    results: [],
    isLoading: false
};
function init() {
    populateYearFilter();
    restoreState();
    bindEvents();
    if (state.query) {
        searchInput.value = state.query;
        typeFilter.value = state.type;
        yearFilter.value = state.year;
        updateClearButton();
        searchMovies();
    }
}
function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }
}
function restoreState() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlQuery = urlParams.get('q');
        const urlType = urlParams.get('type');
        const urlYear = urlParams.get('year');
        const urlPage = urlParams.get('page');
        if (urlQuery) {
            state.query = urlQuery;
            state.type = urlType || '';
            state.year = urlYear || '';
            state.page = parseInt(urlPage) || 1;
            return;
        }
        const saved = localStorage.getItem('omdb_search_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.query = parsed.query || '';
            state.type = parsed.type || '';
            state.year = parsed.year || '';
            state.page = parsed.page || 1;
        }
    } catch (e) {
        console.warn('Could not restore state:', e);
    }
}
function saveState() {
    try {
        localStorage.setItem('omdb_search_state', JSON.stringify({
            query: state.query,
            type: state.type,
            year: state.year,
            page: state.page
        }));
        const params = new URLSearchParams();
        if (state.query) params.set('q', state.query);
        if (state.type) params.set('type', state.type);
        if (state.year) params.set('year', state.year);
        if (state.page > 1) params.set('page', state.page);
        const newUrl = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    } catch (e) {
        console.warn('Could not save state:', e);
    }
}
function bindEvents() {
    searchBtn.addEventListener('click', () => {
        state.page = 1;
        triggerSearch();
    });
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            state.page = 1;
            triggerSearch();
        }
    });
    searchInput.addEventListener('input', updateClearButton);
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        updateClearButton();
        searchInput.focus();
    });
    typeFilter.addEventListener('change', () => {
        if (state.query) {
            state.page = 1;
            triggerSearch();
        }
    });
    yearFilter.addEventListener('change', () => {
        if (state.query) {
            state.page = 1;
            triggerSearch();
        }
    });
    prevPage.addEventListener('click', () => {
        if (state.page > 1) {
            state.page--;
            searchMovies();
            scrollToTop();
        }
    });
    nextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(state.totalResults / 10);
        if (state.page < totalPages) {
            state.page++;
            searchMovies();
            scrollToTop();
        }
    });
    closeModal.addEventListener('click', hideModal);
    movieModal.addEventListener('click', (e) => {
        if (e.target === movieModal) hideModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && movieModal.style.display !== 'none') {
            hideModal();
        }
    });
}
function updateClearButton() {
    clearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
}
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function triggerSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        searchInput.focus();
        searchInput.classList.add('shake');
        setTimeout(() => searchInput.classList.remove('shake'), 500);
        return;
    }
    state.query = query;
    state.type = typeFilter.value;
    state.year = yearFilter.value;
    searchMovies();
}
async function searchMovies() {
    if (state.isLoading) return;
    state.isLoading = true;
    showLoading();
    saveState();
    try {
        const params = new URLSearchParams({
            apikey: API_KEY,
            s: state.query,
            page: state.page
        });
        if (state.type) params.set('type', state.type);
        if (state.year) params.set('y', state.year);
        const response = await fetch(`${API_BASE}?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Network error. Please check your connection.');
        }
        const data = await response.json();
        if (data.Response === 'True') {
            state.results = data.Search;
            state.totalResults = parseInt(data.totalResults);
            renderResults();
        } else {
            showError(data.Error || 'Movie not found. Please try a different search.');
        }
    } catch (err) {
        showError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
        state.isLoading = false;
    }
}
async function fetchMovieDetails(imdbID) {
    try {
        const params = new URLSearchParams({
            apikey: API_KEY,
            i: imdbID,
            plot: 'full'
        });
        const response = await fetch(`${API_BASE}?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch movie details.');
        }
        const data = await response.json();
        if (data.Response === 'True') {
            return data;
        } else {
            throw new Error(data.Error || 'Could not load movie details.');
        }
    } catch (err) {
        alert(err.message);
        return null;
    }
}
function showLoading() {
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
    resultsGrid.innerHTML = '';
    pagination.style.display = 'none';
    loadingState.style.display = 'flex';
}
function showError(message) {
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    resultsGrid.innerHTML = '';
    pagination.style.display = 'none';
    errorMessage.textContent = message;
    errorState.style.display = 'flex';
}
function renderResults() {
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
    resultsGrid.innerHTML = state.results.map((movie, index) => {
        const posterSrc = movie.Poster && movie.Poster !== 'N/A'
            ? movie.Poster
            : null;
        return `
            <article class="movie-card" 
                     data-imdbid="${movie.imdbID}" 
                     style="animation-delay: ${index * 0.05}s"
                     tabindex="0"
                     role="button"
                     aria-label="View details for ${escapeHtml(movie.Title)}">
                <div class="card-poster">
                    ${posterSrc 
                        ? `<img src="${posterSrc}" alt="${escapeHtml(movie.Title)} poster" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'no-poster\\'>No Poster Available</div>'">`
                        : `<div class="no-poster">No Poster Available</div>`
                    }
                    <div class="card-overlay">
                        <span class="card-overlay-btn">View Details</span>
                    </div>
                    ${movie.Type ? `<span class="card-type-badge">${escapeHtml(movie.Type)}</span>` : ''}
                </div>
                <div class="card-info">
                    <h3 class="card-title" title="${escapeHtml(movie.Title)}">${escapeHtml(movie.Title)}</h3>
                    <span class="card-year">${escapeHtml(movie.Year)}</span>
                </div>
            </article>
        `;
    }).join('');
    document.querySelectorAll('.movie-card').forEach(card => {
        const handler = () => openMovieDetail(card.dataset.imdbid);
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });
    });
    const totalPages = Math.ceil(state.totalResults / 10);
    if (totalPages > 1) {
        pagination.style.display = 'flex';
        prevPage.disabled = state.page <= 1;
        nextPage.disabled = state.page >= totalPages;
        pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
    } else {
        pagination.style.display = 'none';
    }
}
async function openMovieDetail(imdbID) {
    movieModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modalTitle.textContent = 'Loading...';
    modalPoster.src = '';
    modalPlot.textContent = '';
    modalGenre.innerHTML = '';
    modalRatings.innerHTML = '';
    const movie = await fetchMovieDetails(imdbID);
    if (!movie) {
        hideModal();
        return;
    }
    modalTitle.textContent = movie.Title || 'N/A';
    if (movie.Poster && movie.Poster !== 'N/A') {
        modalPoster.src = movie.Poster;
        modalPoster.alt = `${movie.Title} poster`;
    } else {
        modalPoster.src = '';
        modalPoster.alt = 'No poster available';
    }
    modalYear.textContent = movie.Year || 'N/A';
    modalRated.textContent = movie.Rated || 'N/A';
    modalRuntime.textContent = movie.Runtime || 'N/A';
    modalPlot.textContent = movie.Plot || 'No plot available.';
    modalDirector.textContent = movie.Director || 'N/A';
    modalWriter.textContent = movie.Writer || 'N/A';
    modalActors.textContent = movie.Actors || 'N/A';
    modalLanguage.textContent = movie.Language || 'N/A';
    modalCountry.textContent = movie.Country || 'N/A';
    modalAwards.textContent = movie.Awards || 'N/A';
    if (movie.BoxOffice && movie.BoxOffice !== 'N/A') {
        modalBoxOffice.textContent = movie.BoxOffice;
        modalBoxOfficeRow.style.display = 'flex';
    } else {
        modalBoxOfficeRow.style.display = 'none';
    }
    if (movie.imdbRating && movie.imdbRating !== 'N/A') {
        modalRating.innerHTML = `⭐ ${movie.imdbRating}`;
        modalRating.style.display = 'flex';
    } else {
        modalRating.style.display = 'none';
    }
    if (movie.Genre && movie.Genre !== 'N/A') {
        modalGenre.innerHTML = movie.Genre.split(',').map(g =>
            `<span class="genre-tag">${escapeHtml(g.trim())}</span>`
        ).join('');
    }
    if (movie.Ratings && movie.Ratings.length > 0) {
        modalRatings.innerHTML = movie.Ratings.map(r => `
            <div class="rating-badge">
                <span class="rating-source">${escapeHtml(formatRatingSource(r.Source))}</span>
                <span class="rating-value">${escapeHtml(r.Value)}</span>
            </div>
        `).join('');
    }
}
function hideModal() {
    movieModal.style.display = 'none';
    document.body.style.overflow = '';
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function formatRatingSource(source) {
    const map = {
        'Internet Movie Database': 'IMDb',
        'Rotten Tomatoes': 'Rotten Tomatoes',
        'Metacritic': 'Metacritic'
    };
    return map[source] || source;
}
document.addEventListener('DOMContentLoaded', init);
