const getPage = (collection, id, type) => collection.find((page) => {
    const idMatch = page.data.id === id;
    const typeMatch = page.data.type === type;
    return type ? typeMatch && idMatch : idMatch;
  });

const buildURL = (page) => {
  const type = page.type || 'show';
  let slug = page.slug;

  switch (type) {
    case 'post':
      slug = `article/${page.date}/${slug}`;
      break;
    case 'show':
      slug = `shows/${slug}/`;
      break;
    case 'event':
    case 'row':
      slug = `shows/${page.show.slug}/${slug}/`;
      break;
    default:
      break;
  }

  slug = slug.startsWith('/') ? slug : `/${slug}`
  slug = slug.replaceAll('//', '/');

  if (slug.endsWith('/') || slug.endsWith('.html')) {
    return slug;
  } else if (slug.endsWith('index')) {
    return `${slug}.html`;
  }

  return `${slug}/`;
}

const getHero = (src) => src.header?.hero.data?.attributes;

export default (eleventyConfig) => {
  eleventyConfig.addFilter('buildURL', buildURL);
  eleventyConfig.addFilter('getPage', getPage);
  eleventyConfig.addFilter('getHero', getHero);
}
