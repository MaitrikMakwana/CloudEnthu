import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('admin', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@cloudenthu.com' },
        update: {},
        create: {
            email: 'admin@cloudenthu.com',
            passwordHash: passwordHash,
            displayName: 'Cloud Specialist',
            username: 'cloudenthu',
            bio: 'Currently studying for AWS Certified Developer. I post my weekly notes here.'
        }
    });

    console.log('Admin user created/verified:', user.email);

    // Add a sample post
    await prisma.note.upsert({
        where: { slug: 'aws-s3-storage-classes' },
        update: {},
        create: {
            title: 'AWS S3 Storage Classes',
            slug: 'aws-s3-storage-classes',
            excerpt: 'Overview of standard, intelligent, and glacier patterns.',
            content: '# S3 Storage Classes\n\nAmazon S3 offers a range of storage classes tailored to different use cases. Choosing the right storage class can drastically reduce your monthly AWS bill.\n\n## The Big Three\n\n1. **Standard:** General purpose. Expensive storage, cheap retrieval. Use this for assets that are accessed frequently (e.g., website images).\n2. **Intelligent-Tiering:** Automatically moves objects to the most cost-effective access tier based on access frequency. **Always use this if access patterns are unknown.**\n3. **Glacier:** Deep archive. Incredibly cheap storage, but retrievals take hours and cost money.\n\n### Example CLI Command\nTo move a file to Glacier using the AWS CLI:\n```bash\naws s3 cp my-file.txt s3://my-bucket/ --storage-class GLACIER\n```\n\n> **Warning:** Do not use Glacier for data you need instantly. It is literally designed to be put on tape drives in an AWS data center.',
            weekNumber: 1,
            tags: ['aws', 's3'],
            publishedAt: new Date('2026-10-12T10:00:00Z'),
            status: 'PUBLISHED',
            userId: user.id
        }
    });

    await prisma.note.upsert({
        where: { slug: 'iam-roles-vs-policies' },
        update: {},
        create: {
            title: 'IAM Roles vs Policies',
            slug: 'iam-roles-vs-policies',
            excerpt: 'What is the difference and when to use them.',
            content: '# IAM Definitions\n\n**Roles** are assumed by entities (users, services).\n**Policies** are JSON documents attached to roles or users defining permissions.\n\n*Never use root account for daily tasks.*',
            weekNumber: 1,
            tags: ['aws', 'iam', 'security'],
            publishedAt: new Date('2026-10-14T10:00:00Z'),
            status: 'PUBLISHED',
            userId: user.id
        }
    });

    console.log('Sample posts verified');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
