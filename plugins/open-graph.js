const pluginRss = require('@11ty/eleventy-plugin-rss');

const ogImage = (og, url, cache) => {
  if (og && og.image) {
    return `/images/${og.image}/`;
  }

  const api = 'https://screenshot-api.miriam.codes/';
  const baseUrl = process.env.URL || 'http://localhost:8080/';
  const encoded = encodeURIComponent(`${baseUrl}/${url}`);
  return `${api}${encoded}/opengraph/_${cache || new Date().toISOString()}`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addFilter('ogImage', ogImage);
  eleventyConfig.addLiquidFilter('absoluteUrl', pluginRss.absoluteUrl);
};
