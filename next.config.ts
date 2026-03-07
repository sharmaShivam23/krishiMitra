// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


import createNextIntlPlugin from 'next-intl/plugin';
 
// Tell the plugin exactly where your file is!
// const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
 
/** @type {import('next').NextConfig} */
const nextConfig = {};
 
export default withNextIntl(nextConfig);