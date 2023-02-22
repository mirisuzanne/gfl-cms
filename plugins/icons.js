// based on eleventy-plugin-inline-link-favicon
// by @bmuenzenmeyer
// https://github.com/bmuenzenmeyer/eleventy-plugin-inline-link-favicon

const Image = require('@11ty/eleventy-img');

const SERVICE_BASE = `https://v1.indieweb-avatar.11ty.dev/:url:/`

const imgOptions = {
  widths: [200, 'auto'],
  formats: ['auto'],
  urlPath: '/fav/',
  outputDir: `./_site/fav/`,
};

const imageAttributes = {
  loading: 'lazy',
  decoding: 'async',
};

async function iconImg(url, alt) {
  let iconUrl = `${SERVICE_BASE.replace(':url:', encodeURIComponent(url))}`;

  let imgAttrs = {
    ...imageAttributes,
    'data-favicon': url,
    alt: alt || '',
  };

  let metadata = await Image(iconUrl, imgOptions);

  return Image.generateHTML(metadata, imgAttrs, {
    whitespaceMode: 'inline',
  });
}

async function iconLink(url, text, alt) {
  let icon = await iconImg(url, alt);
  return `<a href="${url}">${icon}${text || url}</a>`;
}

module.exports = (eleventyConfig) => {
  eleventyConfig.addAsyncFilter('fav', iconLink);
  eleventyConfig.addPairedAsyncShortcode('fav', (text, url, alt) =>
    iconLink(url, text, alt)
  );
}
