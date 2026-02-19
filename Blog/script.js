let blogs = JSON.parse(localStorage.getItem('blogs')) || [
    {
        id: 1,
        title: "Building Scalable Microservices",
        author: "Alex Chen",
        category: "Technology",
        content: "Kubernetes has revolutionized how we deploy and manage containerized applications. Learn best practices for building scalable microservices with auto-scaling, service mesh, and monitoring solutions.",
        image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800",
        date: "2024-01-20"
    },
    {
        id: 2,
        title: "Minimalist Design Principles",
        author: "Sarah Williams",
        category: "Design",
        content: "Discover how less is more in modern UI/UX design. Explore color theory, typography, whitespace usage, and the balance between simplicity and functionality.",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        date: "2024-01-19"
    },
    {
        id: 3,
        title: "Machine Learning Basics",
        author: "Dr. Michael Zhang",
        category: "Technology",
        content: "Start your AI journey with hands-on projects. Learn supervised and unsupervised learning, neural networks, TensorFlow and PyTorch with practical examples.",
        image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
        date: "2024-01-18"
    },
    {
        id: 4,
        title: "Remote Work Productivity",
        author: "Emma Rodriguez",
        category: "Lifestyle",
        content: "Master working from anywhere with proven strategies. Optimize your home office, maintain work-life balance, and leverage collaboration tools effectively.",
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
        date: "2024-01-17"
    },
    {
        id: 5,
        title: "Cybersecurity Essentials",
        author: "James Patterson",
        category: "Technology",
        content: "Protect your applications from vulnerabilities. Learn OWASP Top 10, secure coding practices, authentication strategies, and encryption techniques.",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
        date: "2024-01-16"
    },
    {
        id: 6,
        title: "Sustainable Living Guide",
        author: "Olivia Green",
        category: "Lifestyle",
        content: "Make a difference with individual action. Explore practical ways to reduce waste, conserve energy, and make sustainable choices in daily life.",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
        date: "2024-01-15"
    }
];

let filter = 'all';

window.onload = () => {
    render();
    loadTheme();
};

function render() {
    renderFilters();
    renderPosts();
}

function renderFilters() {
    const categories = ['all', ...new Set(blogs.map(b => b.category))];
    document.getElementById('filters').innerHTML = categories.map(cat => 
        `<button class="filter-btn ${cat === filter ? 'active' : ''}" onclick="setFilter('${cat}')">${cat}</button>`
    ).join('');
}

function renderPosts() {
    const search = document.getElementById('search').value.toLowerCase();
    const filtered = blogs.filter(b => 
        (filter === 'all' || b.category === filter) &&
        (b.title.toLowerCase().includes(search) || b.content.toLowerCase().includes(search))
    );
    
    document.getElementById('posts').innerHTML = filtered.map(b => `
        <div class="post-card" onclick="openPost(${b.id})">
            <img src="${b.image}" alt="${b.title}">
            <div class="post-body">
                <span class="post-category">${b.category}</span>
                <h3>${b.title}</h3>
                <p>${b.content.substring(0, 120)}...</p>
                <div class="post-author">By ${b.author} • ${b.date}</div>
            </div>
        </div>
    `).join('');
}

function setFilter(cat) {
    filter = cat;
    render();
}

function openPost(id) {
    const blog = blogs.find(b => b.id === id);
    document.getElementById('modalBody').innerHTML = `
        <img src="${blog.image}" alt="${blog.title}">
        <span class="post-category">${blog.category}</span>
        <h2>${blog.title}</h2>
        <p style="color:#adb5bd;margin:10px 0;">By ${blog.author} • ${blog.date}</p>
        <p style="line-height:1.8;font-size:16px;">${blog.content}</p>
        <button class="delete-btn" onclick="deleteBlog(${blog.id})">🗑️ Delete Post</button>
    `;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function openForm() {
    document.getElementById('formModal').classList.add('active');
}

function closeForm() {
    document.getElementById('formModal').classList.remove('active');
}

function saveBlog(e) {
    e.preventDefault();
    const blog = {
        id: Date.now(),
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        category: document.getElementById('category').value,
        content: document.getElementById('content').value,
        image: document.getElementById('image').value,
        date: new Date().toISOString().split('T')[0]
    };
    
    blogs.unshift(blog);
    localStorage.setItem('blogs', JSON.stringify(blogs));
    render();
    closeForm();
    e.target.reset();
    alert('Blog published successfully!');
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
}

function deleteBlog(id) {
    if (confirm('Are you sure you want to delete this blog post?')) {
        blogs = blogs.filter(b => b.id !== id);
        localStorage.setItem('blogs', JSON.stringify(blogs));
        closeModal();
        render();
        alert('Blog deleted successfully!');
    }
}
