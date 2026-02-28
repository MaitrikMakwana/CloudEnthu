import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import API_BASE from './config';

export default function PublicPost() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/public/posts/${slug}`);
                if (!res.ok) throw new Error('Post not found');
                const data = await res.json();
                setPost(data);
                document.title = `${data.title} | CloudEnthu`;
            } catch (err) {
                console.error(err);
                setError(err.message);
                // Fallback for MVP if backend is off
                setPost({
                    title: 'AWS S3 Storage Classes (Fallback)',
                    publishedAt: new Date().toISOString(),
                    weekNumber: 1,
                    user: { username: 'cloudenthu_demo' },
                    tags: ['aws', 's3'],
                    content: `
# S3 Storage Classes

Because the backend is offline, you are seeing this fallback layout. 

* **Standard:** General purpose.
* **Intelligent-Tiering:** Automatic cost savings.
* **Glacier:** Deep archive.

### CLI Example
\`\`\`bash
aws s3 cp my-file.txt s3://my-bucket/ --storage-class GLACIER
\`\`\`
`
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className="public-layout">
                <header className="public-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                    <Link to="/" className="public-logo">CloudEnthu</Link>
                </header>
                <main className="public-main p-8 text-center" style={{ marginTop: '100px' }}>
                    <h1>Loading Post...</h1>
                </main>
            </div>
        );
    }

    if (error && !post) {
        return (
            <div className="public-layout">
                <header className="public-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                    <Link to="/" className="public-logo">CloudEnthu</Link>
                </header>
                <main className="public-main p-8 text-center" style={{ marginTop: '100px' }}>
                    <h1>{error}</h1>
                    <Link to="/" className="neobrutalism-btn pink mt-4">Go Home</Link>
                </main>
            </div>
        );
    }

    const shareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="public-layout">
            <header className="public-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                <Link to="/" className="public-logo">CloudEnthu</Link>
                <div className="header-actions">
                    <Link to="/dashboard" className="neobrutalism-btn yellow">Dashboard / Login</Link>
                </div>
            </header>

            <article className="post-detail-container">
                <div className="post-metadata text-center">
                    <h1 className="post-title">{post.title}</h1>
                    <div className="post-meta-pills">
                        <span className="pill green">Week {post.weekNumber}</span>
                        <Link to={`/@${post.user?.username}`} className="neobrutalism-btn secondary small">@{post.user?.username}</Link>
                        <span className="note-date">{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="markdown-body neobrutalism-box">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>

                <footer className="post-footer">
                    <button onClick={shareLink} className="neobrutalism-btn pink">Share this Note</button>
                    <Link to="/" className="neobrutalism-btn secondary ml-4">Back to Feed</Link>
                </footer>
            </article>
        </div>
    );
}
