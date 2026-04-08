import { Metadata } from 'next';

interface SEOProps {
    title: string;
    description: string;
    slug: string;
    image?: string;
}

export function generateSEO({ title, description, slug, image = '/pwa.png' }: SEOProps): Metadata {
    const path = slug.startsWith('/') ? slug : slug === '/' ? '' : `/${slug}`;
    const canonical = `https://kuryekazanc.com.tr${path || ''}`;

    return {
        title,
        description,
        metadataBase: new URL('https://kuryekazanc.com.tr'),
        robots: {
            index: true,
            follow: true,
        },
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'KuryeKazanc',
            images: [
                {
                    url: image.startsWith('http') ? image : `https://kuryekazanc.com.tr${image}`,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: 'website',
            locale: 'tr_TR',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}
