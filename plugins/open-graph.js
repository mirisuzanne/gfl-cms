const ogImage = (og, url) => {
  if (og && og.image) {
    return `/images/${og.image}/`;
  }

  const api = 'https://screenshot-api.miriam.codes/';
  const baseUrl = process.env.URL || 'http://localhost:8080/';
  const encoded = encodeURIComponent(`${baseUrl}/_og${url}`);
  return `${api}${encoded}/opengraph/_wait:2_${new Date().toISOString()}`;
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter('ogImage', ogImage);
};
