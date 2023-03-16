const getPage = (collection, id, type) => collection.find((page) => {
    const idMatch = page.data.id === id;
    const typeMatch = page.data.type === type;
    return type ? typeMatch && idMatch : idMatch;
  });

const permaSlug = (page, type) => {
  let slug = page.slug || `${page.id}`;

  if (page.type === 'post') {
    const date = page.date;
    slug = `article/${date}/${slug}`;
  } else if (type === 'show') {
    slug = `shows/${slug}`;
  } else if (type === 'event') {
    const show = page.show_slug;
    const date = page.date;
    slug = `shows/${show}/${date}/${slug}`;
  } else if (type === 'script') {
    const show = page.show_slug;
    slug = `shows/${show}/script`;
  }

  if (slug.endsWith('index')) {
    return `${slug}.html`;
  }

  slug = slug.endsWith('/') || slug.endsWith('.html') ? slug : `${slug}/`;
  return slug.startsWith('/') ? slug : `/${slug}`;
}

module.exports = (eleventyConfig) => {
  eleventyConfig.addFilter('permaSlug', permaSlug);
  eleventyConfig.addFilter('getPage', getPage);
}
