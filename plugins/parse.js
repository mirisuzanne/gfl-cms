const slugify = require('slugify');
const markdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');
const { EleventyRenderPlugin } = require('@11ty/eleventy');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const striptags = require('striptags');

const slug = (str) => {
  if (!str) {
    return;
  }

  return slugify(str, {
    lower: true,
    strict: true,
    remove: /["]/g,
  });
}

const mdIt = markdownIt({
  html: true,
}).use(anchor, {
  permalink: anchor.permalink.headerLink({ safariReaderFix: true }),
  level: [2,],
  slugify: slug,
});

const block = (content) => (content ? mdIt.render(content.trim()) : '');
const inline = (content) => (content ? mdIt.renderInline(content.trim()) : '');
const mdRemove = (content) => (content ? striptags(inline(content)) : '');

const cmsItem = (item) => ({ item, is: item.__component });

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addFilter('slug', slug);
  eleventyConfig.addFilter('md', block);
  eleventyConfig.addFilter('mdInline', inline);
  eleventyConfig.addFilter('mdRemove', mdRemove);
  eleventyConfig.addFilter('cmsItem', cmsItem);

  eleventyConfig.setLibrary('md', mdIt);
};
