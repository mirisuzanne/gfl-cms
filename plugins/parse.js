import slugify from 'slugify';
import markdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { EleventyRenderPlugin } from '@11ty/eleventy';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import stripTags from 'striptags';

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
const mdRemove = (content) => (content ? stripTags(inline(content)) : '');

const cmsItem = (item) => ({ item, is: item.__component });

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addFilter('slug', slug);
  eleventyConfig.addFilter('md', block);
  eleventyConfig.addFilter('mdInline', inline);
  eleventyConfig.addFilter('mdRemove', mdRemove);
  eleventyConfig.addFilter('cmsItem', cmsItem);

  eleventyConfig.setLibrary('md', mdIt);
};
