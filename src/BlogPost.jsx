import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useEffect } from 'react';

// Fake Data for MVP (Simulate DB Fetch)
const MOCK_DB = {
    'aws-s3-storage-classes': {
        title: 'AWS S3 Storage Classes',
        publishedAt: 'Oct 12, 2026',
        weekNumber: 1,
        authorHandle: 'cloudenthu',
        tags: ['aws', 's3'],
        content: `
# S3 Storage Classes

Amazon S3 offers a range of storage classes tailored to different use cases. Choosing the right storage class can drastically reduce your monthly AWS bill.

## The Big Three

1. **Standard:** General purpose. Expensive storage, cheap retrieval. Use this for assets that are accessed frequently (e.g., website images).
2. **Intelligent-Tiering:** Automatically moves objects to the most cost-effective access tier based on access frequency. **Always use this if access patterns are unknown.**
3. **Glacier:** Deep archive. Incredibly cheap storage, but retrievals take hours and cost money.

### Example CLI Command
To move a file to Glacier using the AWS CLI:
\`\`\`bash
aws s3 cp my-file.txt s3://my-bucket/ --storage-class GLACIER
\`\`\`

> **Warning:** Do not use Glacier for data you need instantly. It is literally designed to be put on tape drives in an AWS data center.
`
    }
};

export default function BlogPost() {
    const { slug } = useParams();
    const post = MOCK_DB[slug];

    // SEO Injection (Simulated)
    useEffect(() => {
        if (post) {
            document.title = `${post.title} | CloudEnthu`;
        }
    }, [post]);

    if (!post) {
        return (
            <div className="public-layout">
                <header className="public-header neobrutalism-box" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                    <Link to="/" className="public-logo">CloudEnthu</Link>
                </header>
                <main className="public-main p-8 text-center" style={{ marginTop: '100px' }}>
                    <h1>Post Not Found</h1>
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
                    <Link to="/login" className="neobrutalism-btn yellow">Dashboard / Login</Link>
                </div>
            </header>

            <article className="post-detail-container">
                <div className="post-metadata text-center">
                    <h1 className="post-title">{post.title}</h1>
                    <div className="post-meta-pills">
                        <span className="pill green">Week {post.weekNumber}</span>
                        <Link to={`/@${post.authorHandle}`} className="neobrutalism-btn secondary small">@{post.authorHandle}</Link>
                        <span className="note-date">{post.publishedAt}</span>
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
