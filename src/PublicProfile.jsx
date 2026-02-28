import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PublicProfile() {
    const { username } = useParams();
    const [author, setAuthor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/public/@${username}`);
                if (!res.ok) throw new Error('Author not found');
                const data = await res.json();
                setAuthor(data);
                document.title = `${data.displayName || username}'s Notes | CloudEnthu`;
            } catch (err) {
                console.error(err);
                setError(err.message);
                // Fallback for MVP if backend is off
                setAuthor({
                    username: username,
                    displayName: 'Demo Cloud Engineer',
                    bio: 'Currently studying for AWS Certified Developer. I post my weekly notes here.',
                    notes: [
                        { id: '1', title: 'Example Note', slug: 'example-note', excerpt: 'Backend offline fallback.', weekNumber: 1, tags: ['fallback'], publishedAt: new Date().toISOString() }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    return (
        <div className="public-layout">
            <header className="public-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                <Link to="/" className="public-logo">CloudEnthu</Link>
                <div className="header-actions">
                    <Link to="/dashboard" className="neobrutalism-btn yellow">Dashboard / Login</Link>
                </div>
            </header>

            <main className="public-main">
                {loading ? (
                    <div className="empty-state neobrutalism-box text-center">
                        <h2>Loading profile...</h2>
                    </div>
                ) : error && !author ? (
                    <div className="empty-state neobrutalism-box text-center">
                        <h2>{error}</h2>
                        <Link to="/" className="neobrutalism-btn pink mt-4">Go Home</Link>
                    </div>
                ) : (
                    <>
                        <section className="profile-hero neobrutalism-box pink">
                            <div className="profile-avatar"></div>
                            <div className="profile-info">
                                <h1>{author.displayName || author.username}</h1>
                                <span className="pill yellow" style={{ display: 'inline-block', marginBottom: '10px' }}>@{author.username}</span>
                                <p>{author.bio || "This user prefers to let their notes speak for them."}</p>
                            </div>
                        </section>

                        <section className="feed-renderer mt-8">
                            <h2 style={{ marginBottom: '20px' }}>Published Notes ({author.notes?.length || 0})</h2>
                            {author.notes?.length === 0 ? (
                                <div className="empty-state neobrutalism-box">
                                    <h2>No notes published yet.</h2>
                                </div>
                            ) : (
                                <div className="article-grid">
                                    {author.notes?.map(post => (
                                        <Link to={`/blog/${post.slug}`} key={post.id} className="article-card-link">
                                            <article className="article-card neobrutalism-box">
                                                <h3>{post.title}</h3>
                                                <p className="article-excerpt">{post.excerpt}</p>
                                                <div className="article-meta">
                                                    <span className="article-date">
                                                        {new Date(post.publishedAt).toLocaleDateString()}
                                                    </span>
                                                    <div className="article-tags">
                                                        {post.tags.map(t => <span key={t} className="tiny-pill">#{t}</span>)}
                                                    </div>
                                                </div>
                                            </article>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
