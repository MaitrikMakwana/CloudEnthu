import { useState } from 'react';
import { Link } from 'react-router-dom';

const PUBLIC_NOTES = [
    { id: 1, title: 'AWS S3 Storage Classes', slug: 'aws-s3-storage-classes', excerpt: 'Overview of standard, intelligent, and glacier patterns.', weekNumber: 1, tags: ['aws', 's3'], publishedAt: 'Oct 12, 2026', authorHandle: 'cloudenthu' },
    { id: 2, title: 'IAM Roles vs Policies', slug: 'iam-roles-vs-policies', excerpt: 'What is the difference and when to use them.', weekNumber: 1, tags: ['aws', 'iam', 'security'], publishedAt: 'Oct 14, 2026', authorHandle: 'cloudenthu' },
];

export default function BlogHome() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTag, setActiveTag] = useState('All');

    const filteredNotes = PUBLIC_NOTES.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = activeTag === 'All' || n.tags.includes(activeTag);
        return matchesSearch && matchesTag;
    });

    return (
        <div className="public-layout">
            <header className="public-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                <Link to="/" className="public-logo">CloudEnthu</Link>
                <div className="header-actions">
                    <Link to="/login" className="neobrutalism-btn yellow">Dashboard / Login</Link>
                </div>
            </header>

            <main className="public-main">
                <section className="hero-banner neobrutalism-box">
                    <h1>Notes from the Cloud journey.</h1>
                    <p>Filtering out the noise. Real-world insights and study guides.</p>
                </section>

                <section className="filter-bar neobrutalism-box">
                    <input
                        type="text"
                        className="neobrutalism-input filter-search"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className="filter-tags">
                        {['All', 'aws', 's3', 'iam', 'networking', 'security'].map(tag => (
                            <button
                                key={tag}
                                className={`pill filter-pill ${activeTag === tag ? 'pink' : ''}`}
                                onClick={() => setActiveTag(tag)}
                            >
                                {tag === 'All' ? 'All Posts' : `#${tag}`}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="feed-renderer">
                    {filteredNotes.length === 0 ? (
                        <div className="empty-state neobrutalism-box">
                            <h2>Looks like I haven't learned anything about "{searchQuery || activeTag}" yet.</h2>
                            <p>Try a different search or clear your filters.</p>
                        </div>
                    ) : (
                        <div className="article-grid">
                            {filteredNotes.map(note => (
                                <Link to={`/blog/${note.slug}`} key={note.id} className="article-card-link">
                                    <article className="article-card neobrutalism-box">
                                        <h3>{note.title}</h3>
                                        <p className="article-excerpt">{note.excerpt}</p>
                                        <div className="article-meta">
                                            <span className="article-date">{note.publishedAt}</span>
                                            <div className="article-tags">
                                                {note.tags.map(t => <span key={t} className="tiny-pill">#{t}</span>)}
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
