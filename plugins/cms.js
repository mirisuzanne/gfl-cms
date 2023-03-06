const dateFormat = require('date-fns/format');
const { utcToZonedTime } = require('date-fns-tz');

const dateUrl = (date) =>
  dateFormat(utcToZonedTime(date, '+00:00'), 'yyyy-MM-dd');

const permaSlug = (page, type) => {
  let slug = page.slug || `${page.id}`;

  if (page.type === 'post') {
    const date = dateUrl(page.date);
    slug = `article/${date}/${slug}`;
  } else if (type === 'show') {
    slug = `shows/${slug}`;
  } else if (type === 'event') {
    const show = page.show.data.attributes.slug;
    const date = dateUrl(page.date);
    slug = `shows/${show}/${date}/${slug}`;
  } else if (type === 'script') {
    const show = page.show.data.attributes.slug;
    slug = `shows/${show}/script`;
  }

  if (slug.endsWith('index')) {
    return `${slug}.html`;
  }

  return slug.endsWith('/') || slug.endsWith('.html') ? slug : `${slug}/`;
}

module.exports = (eleventyConfig) => {
  eleventyConfig.addFilter('permaSlug', permaSlug);
}
