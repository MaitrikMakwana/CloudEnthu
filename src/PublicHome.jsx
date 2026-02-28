import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from './config';

export default function PublicHome() {
    const [posts, setPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTag, setActiveTag] = useState('All');
    const [activeWeek, setActiveWeek] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [weekNames, setWeekNames] = useState({});

    useEffect(() => {
        const fetchPostsAndWeeks = async () => {
            setLoading(true);
            try {
                // Fetch Weeks
                fetch(`${API_BASE}/api/public/weeks`)
                    .then(res => res.json())
                    .then(data => {
                        const map = {};
                        if (Array.isArray(data)) {
                            data.forEach(w => map[w.number] = w.name);
                        }
                        setWeekNames(map);
                    }).catch(err => console.error("Error fetching weeks", err));

                let url = `${API_BASE}/api/public/posts?limit=50`;
                if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
                if (activeTag !== 'All') url += `&tag=${encodeURIComponent(activeTag)}`;

                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to load posts');
                const data = await res.json();
                setPosts(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
                // Fallback for MVP if backend is off
                setPosts([
                    { id: '1', title: 'Example Note', slug: 'example-note', excerpt: 'Backend is off, so here is a fake note.', weekNumber: 1, tags: ['test'], publishedAt: 'Today', user: { username: 'demo' } }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchPostsAndWeeks();
    }, [searchQuery, activeTag]);

    // Unique ascending week numbers from public posts
    const uniqueWeeks = [...new Set(posts.map(p => p.weekNumber).filter(Boolean))].sort((a, b) => a - b);

    const filteredByActiveWeek = activeWeek === 'All'
        ? posts
        : posts.filter(p => p.weekNumber === parseInt(activeWeek));

    // Group visible posts by week
    const groupedByWeek = uniqueWeeks
        .filter(week => activeWeek === 'All' || week === parseInt(activeWeek))
        .map(week => ({
            week,
            posts: filteredByActiveWeek.filter(p => p.weekNumber === week)
        }))
        .filter(g => g.posts.length > 0);

    const ungroupedPosts = activeWeek === 'All' ? posts.filter(p => !p.weekNumber) : [];

    // Extract all unique tags dynamically from loaded posts (or empty if none)
    // To make it feel lively, we can still show a few default tags if we want, but dynamic is better.
    // If we only have filtered posts, dynamic tags might only show tags of current posts, 
    // but the backend API actually filters *on* the backend if a search query is passed. 
    // For MVP, just extracting from loaded posts is fine, plus a few staples.
    const fetchedTags = [...new Set(posts.flatMap(p => p.tags || []))];
    const defaultTags = ['aws', 's3', 'iam', 'networking', 'security'];
    const allTags = [...new Set([...fetchedTags, ...defaultTags])].sort();

    return (
        <div className="public-layout">
            <header className="public-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                <Link to="/" className="public-logo">CloudEnthu</Link>
                <div className="header-actions">
                    <Link to="/dashboard" className="neobrutalism-btn yellow">Dashboard / Login</Link>
                </div>
            </header>

            <main className="public-main">
                <section className="hero-banner neobrutalism-box">
                    <h1>Notes from the Cloud journey.</h1>
                    <p>Filtering out the noise. Real-world insights and study guides.</p>
                </section>

                <section className="filter-bar neobrutalism-box">
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <select
                            className="neobrutalism-input"
                            style={{ flex: '0 0 200px', cursor: 'pointer', appearance: 'auto' }}
                            value={activeWeek}
                            onChange={e => setActiveWeek(e.target.value)}
                        >
                            <option value="All">All Weeks</option>
                            {uniqueWeeks.map(week => (
                                <option key={week} value={week}>{weekNames[week] || `Week ${week}`}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            className="neobrutalism-input filter-search"
                            style={{ flex: 1 }}
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-tags">
                        <button
                            className={`pill filter-pill ${activeTag === 'All' ? 'pink' : ''}`}
                            onClick={() => setActiveTag('All')}
                        >
                            All Posts
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`pill filter-pill ${activeTag === tag ? 'pink' : ''}`}
                                onClick={() => setActiveTag(tag)}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="feed-renderer">
                    {loading ? (
                        <div className="empty-state neobrutalism-box">
                            <h2>Loading posts...</h2>
                        </div>
                    ) : error && posts.length === 0 ? (
                        <div className="empty-state neobrutalism-box">
                            <h2>Something went wrong trying to fetch from the DB.</h2>
                            <p>{error}</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="empty-state neobrutalism-box">
                            <h2>Looks like no one has posted about "{searchQuery || activeTag}" yet.</h2>
                            <p>Try a different search or clear your filters.</p>
                        </div>
                    ) : (
                        <div className="public-articles-container">
                            {groupedByWeek.map(group => (
                                <div key={group.week} style={{ marginBottom: '40px' }}>
                                    <div className="public-week-header neobrutalism-box">
                                        <h2>{weekNames[group.week] || `Week ${group.week}`}</h2>
                                        <span>{group.posts.length} Post{group.posts.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="article-grid">
                                        {group.posts.map(post => (
                                            <Link to={`/blog/${post.slug}`} key={post.id} className="article-card-link">
                                                <article className="article-card neobrutalism-box">
                                                    <h3>{post.title}</h3>
                                                    <p className="article-excerpt">{post.excerpt}</p>
                                                    <div className="article-meta">
                                                        <span className="article-date">
                                                            By @{post.user?.username || 'user'}
                                                        </span>
                                                        <div className="article-tags">
                                                            {(post.tags || []).map(t => <span key={t} className="tiny-pill">#{t}</span>)}
                                                        </div>
                                                    </div>
                                                </article>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {ungroupedPosts.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <div className="public-week-header neobrutalism-box" style={{ backgroundColor: '#fff' }}>
                                        <h2>General Notes</h2>
                                        <span>{ungroupedPosts.length} Post{ungroupedPosts.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="article-grid">
                                        {ungroupedPosts.map(post => (
                                            <Link to={`/blog/${post.slug}`} key={post.id} className="article-card-link">
                                                <article className="article-card neobrutalism-box">
                                                    <h3>{post.title}</h3>
                                                    <p className="article-excerpt">{post.excerpt}</p>
                                                    <div className="article-meta">
                                                        <span className="article-date">
                                                            By @{post.user?.username || 'user'}
                                                        </span>
                                                        <div className="article-tags">
                                                            {(post.tags || []).map(t => <span key={t} className="tiny-pill">#{t}</span>)}
                                                        </div>
                                                    </div>
                                                </article>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
