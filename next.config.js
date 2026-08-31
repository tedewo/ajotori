/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/maa-metsatalouskoneet', destination: '/maatalouskoneet', permanent: true },
      { source: '/maa-metsatalouskoneet/traktorit', destination: '/maatalouskoneet/traktorit', permanent: true },
      { source: '/maa-metsatalouskoneet/puimurit', destination: '/maatalouskoneet/puimurit', permanent: true },
      { source: '/maa-metsatalouskoneet/muut-maatalouskoneet', destination: '/maatalouskoneet/muut-maatalouskoneet', permanent: true },
      { source: '/maa-metsatalouskoneet/traktorin-lisalaitteet', destination: '/maatalouskoneet/traktorin-lisalaitteet', permanent: true },
      { source: '/maa-metsatalouskoneet/traktorin-peravaunut', destination: '/maatalouskoneet/traktorin-peravaunut', permanent: true },
      { source: '/maa-metsatalouskoneet/metsatraktorit', destination: '/metsatalouskoneet/metsatraktorit', permanent: true },
      { source: '/maa-metsatalouskoneet/harvesterit', destination: '/metsatalouskoneet/harvesterit', permanent: true },
      { source: '/maa-metsatalouskoneet/muut-metsakoneet', destination: '/metsatalouskoneet/muut-metsakoneet', permanent: true },
      { source: '/muut-ajoneuvot/veneet', destination: '/veneet/veneet', permanent: true },
      { source: '/muut-ajoneuvot', destination: '/muut-ajoneuvot', permanent: true },
    ];
  },
};

module.exports = nextConfig;
