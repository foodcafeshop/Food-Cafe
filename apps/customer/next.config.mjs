import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
        importScripts: ["/custom-sw.js"],
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*$/,
                handler: "NetworkFirst",
                options: {
                    cacheName: "supabase-api-cache",
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60 * 24, // 24 hours
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },
            {
                urlPattern: /^https:\/\/images\.unsplash\.com\/.*$/,
                handler: "CacheFirst",
                options: {
                    cacheName: "unsplash-image-cache",
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },
        ],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
};

export default withPWA(nextConfig);
