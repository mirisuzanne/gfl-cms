const pluginRss = require('@11ty/eleventy-plugin-rss');

const ogImage = (image, url) => {
  if (image) {
    return `/images/${image}`;
  }

  const api = 'https://screenshot-api.miriam.codes/';
  const baseUrl = process.env.URL || 'https://miriamsuzanne.com';
  const encoded = encodeURIComponent(`${baseUrl}${url}`);
  return `${api}${encoded}/opengraph/`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addFilter('ogImage', ogImage);
  eleventyConfig.addLiquidFilter('absoluteUrl', pluginRss.absoluteUrl);
};
