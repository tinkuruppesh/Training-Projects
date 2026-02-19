// Using JSearch API via RapidAPI (free tier available)
// For demo purposes, we'll use mock data with realistic job listings
const USE_MOCK_DATA = true;

// State
let currentPage = 1;
let currentQuery = '';
let currentLocation = '';
let currentType = '';
let currentSort = 'date';
let allJobs = [];
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationFilter = document.getElementById('locationFilter');
const typeFilter = document.getElementById('typeFilter');
const sortFilter = document.getElementById('sortFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
const recentSearchesDiv = document.getElementById('recentSearches');
const resultsCount = document.getElementById('resultsCount');
const loading = document.getElementById('loading');
const jobsList = document.getElementById('jobsList');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Initialize
function init() {
  renderRecentSearches();
  
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  
  locationFilter.addEventListener('change', performSearch);
  typeFilter.addEventListener('change', performSearch);
  sortFilter.addEventListener('change', performSearch);
  clearFiltersBtn.addEventListener('click', clearFilters);
  loadMoreBtn.addEventListener('click', loadMore);
}

// Perform Search
async function performSearch() {
  const query = searchInput.value.trim() || 'developer';
  currentQuery = query;
  currentLocation = locationFilter.value;
  currentType = typeFilter.value;
  currentSort = sortFilter.value;
  currentPage = 1;
  allJobs = [];
  
  addToRecentSearches(query);
  await fetchJobs();
}

// Fetch Jobs from API
async function fetchJobs() {
  loading.style.display = 'block';
  jobsList.innerHTML = '';
  loadMoreContainer.style.display = 'none';
  
  try {
    let jobs;
    
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      jobs = getMockJobs();
    }
    
    loading.style.display = 'none';
    
    if (jobs && jobs.length > 0) {
      allJobs = [...allJobs, ...jobs];
      renderJobs(jobs);
      updateResultsCount(jobs.length + (currentPage - 1) * 10);
      
      // Show load more for first 3 pages
      if (currentPage < 3) {
        loadMoreContainer.style.display = 'block';
      }
    } else {
      showEmptyState();
    }
    
  } catch (error) {
    loading.style.display = 'none';
    showErrorState(error.message);
  }
}

// Mock Jobs Data
function getMockJobs() {
  const allMockJobs = [
    {
      title: 'Senior Frontend Developer',
      company: { display_name: 'TechCorp Inc.' },
      location: { display_name: 'San Francisco, CA' },
      description: 'We are looking for an experienced Frontend Developer to join our team. You will work on building modern web applications using React, TypeScript, and other cutting-edge technologies.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 120000,
      salary_max: 160000,
      category: { label: 'IT & Software' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'UX/UI Designer',
      company: { display_name: 'Design Studio' },
      location: { display_name: 'Remote' },
      description: 'Join our creative team as a UX/UI Designer. Create beautiful and intuitive user interfaces for web and mobile applications. Experience with Figma and Adobe XD required.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 80000,
      salary_max: 110000,
      category: { label: 'Design' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'Full Stack Developer',
      company: { display_name: 'StartupXYZ' },
      location: { display_name: 'New York, NY' },
      description: 'Exciting opportunity for a Full Stack Developer to work on innovative projects. Tech stack includes Node.js, React, MongoDB, and AWS. Great benefits and startup culture.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 100000,
      salary_max: 140000,
      category: { label: 'IT & Software' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'Marketing Manager',
      company: { display_name: 'Global Marketing Co.' },
      location: { display_name: 'London, UK' },
      description: 'Lead our marketing team and develop strategies to grow our brand. Experience in digital marketing, SEO, and content creation required. International team environment.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 70000,
      salary_max: 95000,
      category: { label: 'Marketing' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'Data Scientist',
      company: { display_name: 'AI Solutions Ltd.' },
      location: { display_name: 'Berlin, Germany' },
      description: 'Work on cutting-edge machine learning projects. Strong Python skills and experience with TensorFlow or PyTorch required. PhD preferred but not required.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 90000,
      salary_max: 130000,
      category: { label: 'Data Science' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'Backend Developer',
      company: { display_name: 'CloudTech Systems' },
      location: { display_name: 'Remote' },
      description: 'Build scalable backend systems using Java, Spring Boot, and microservices architecture. Experience with Docker and Kubernetes is a plus.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 110000,
      salary_max: 145000,
      category: { label: 'IT & Software' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'Product Manager',
      company: { display_name: 'Innovation Labs' },
      location: { display_name: 'San Francisco, CA' },
      description: 'Lead product development from concept to launch. Work with cross-functional teams to deliver exceptional products. 5+ years experience required.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 130000,
      salary_max: 170000,
      category: { label: 'Product Management' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'DevOps Engineer',
      company: { display_name: 'Infrastructure Pro' },
      location: { display_name: 'Remote' },
      description: 'Manage and optimize our cloud infrastructure. Experience with AWS, CI/CD pipelines, and infrastructure as code required.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 105000,
      salary_max: 140000,
      category: { label: 'IT & Software' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'Content Writer',
      company: { display_name: 'Media House' },
      location: { display_name: 'New York, NY' },
      description: 'Create engaging content for our blog and social media channels. Strong writing skills and SEO knowledge required.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 50000,
      salary_max: 70000,
      category: { label: 'Writing' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    },
    {
      title: 'Mobile App Developer',
      company: { display_name: 'AppWorks Studio' },
      location: { display_name: 'Remote' },
      description: 'Develop native mobile applications for iOS and Android. Experience with React Native or Flutter preferred.',
      redirect_url: 'https://example.com/apply',
      created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      salary_min: 95000,
      salary_max: 125000,
      category: { label: 'IT & Software' },
      contract_time: 'Full Time',
      contract_type: 'Permanent'
    }
  ];
  
  // Filter by search query
  let filtered = allMockJobs.filter(job => {
    const matchesQuery = job.title.toLowerCase().includes(currentQuery.toLowerCase()) ||
                        job.company.display_name.toLowerCase().includes(currentQuery.toLowerCase()) ||
                        job.description.toLowerCase().includes(currentQuery.toLowerCase());
    
    const matchesLocation = !currentLocation || 
                           job.location.display_name.toLowerCase().includes(currentLocation.toLowerCase());
    
    const matchesType = !currentType || 
                       job.contract_time.toLowerCase().includes(currentType.toLowerCase());
    
    return matchesQuery && matchesLocation && matchesType;
  });
  
  // Sort
  if (currentSort === 'date') {
    filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
  }
  
  // Pagination
  const start = (currentPage - 1) * 10;
  const end = start + 10;
  
  return filtered.slice(start, end);
}

// Render Jobs
function renderJobs(jobs) {
  const jobsHTML = jobs.map(job => {
    const title = job.title || 'No title';
    const company = job.company?.display_name || 'Company not specified';
    const location = job.location?.display_name || 'Location not specified';
    const description = job.description || 'No description available';
    const url = job.redirect_url || '#';
    const created = job.created ? formatDate(job.created) : 'Recently posted';
    const salary = job.salary_min && job.salary_max 
      ? `$${Math.round(job.salary_min).toLocaleString()} - $${Math.round(job.salary_max).toLocaleString()}`
      : null;
    
    return `
      <div class="job-card">
        <div class="job-header">
          <div>
            <h3 class="job-title">${title}</h3>
            <div class="job-company">${company}</div>
          </div>
        </div>
        
        <div class="job-details">
          <div class="job-detail">
            <span>📍</span>
            <span>${location}</span>
          </div>
          ${salary ? `
            <div class="job-detail">
              <span>💰</span>
              <span>${salary}</span>
            </div>
          ` : ''}
          <div class="job-detail">
            <span>🕒</span>
            <span>${created}</span>
          </div>
        </div>
        
        <div class="job-tags">
          ${job.category?.label ? `<span class="job-tag">${job.category.label}</span>` : ''}
          ${job.contract_time ? `<span class="job-tag">${job.contract_time}</span>` : ''}
          ${job.contract_type ? `<span class="job-tag">${job.contract_type}</span>` : ''}
        </div>
        
        <div class="job-description">${description}</div>
        
        <div class="job-footer">
          <span class="job-date">${created}</span>
          <a href="${url}" target="_blank" class="apply-btn">Apply Now</a>
        </div>
      </div>
    `;
  }).join('');
  
  jobsList.insertAdjacentHTML('beforeend', jobsHTML);
}

// Load More
async function loadMore() {
  currentPage++;
  await fetchJobs();
}

// Update Results Count
function updateResultsCount(count) {
  resultsCount.textContent = `Found ${count}+ jobs for "${currentQuery}"`;
}

// Show Empty State
function showEmptyState() {
  jobsList.innerHTML = `
    <div class="empty-state">
      <h3>No Jobs Found</h3>
      <p>Try adjusting your search criteria or filters</p>
    </div>
  `;
  resultsCount.textContent = 'No results found';
}

// Show Error State
function showErrorState(message) {
  jobsList.innerHTML = `
    <div class="error-state">
      <h3>Oops! Something went wrong</h3>
      <p>Unable to fetch jobs. Please try again later.</p>
      <p style="font-size: 0.9rem; margin-top: 10px;">Error: ${message}</p>
    </div>
  `;
  resultsCount.textContent = 'Error loading jobs';
}

// Clear Filters
function clearFilters() {
  searchInput.value = '';
  locationFilter.value = '';
  typeFilter.value = '';
  sortFilter.value = 'date';
  jobsList.innerHTML = '';
  loadMoreContainer.style.display = 'none';
  resultsCount.textContent = 'Search for jobs to see results';
}

// Recent Searches
function addToRecentSearches(query) {
  if (!query || query.length < 2) return;
  
  // Remove if already exists
  recentSearches = recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase());
  
  // Add to beginning
  recentSearches.unshift(query);
  
  // Keep only last 5
  recentSearches = recentSearches.slice(0, 5);
  
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  if (recentSearches.length === 0) {
    recentSearchesDiv.innerHTML = '';
    return;
  }
  
  const tagsHTML = recentSearches.map(search => 
    `<span class="recent-tag" onclick="searchRecent('${search}')">${search}</span>`
  ).join('');
  
  recentSearchesDiv.innerHTML = `
    <div class="recent-searches-title">Recent Searches:</div>
    <div class="recent-tags">${tagsHTML}</div>
  `;
}

function searchRecent(query) {
  searchInput.value = query;
  performSearch();
}

// Utility Functions
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Initialize app
init();
