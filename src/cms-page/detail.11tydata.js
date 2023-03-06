module.exports = {
  eleventyComputed: {
    title:  data => data.cms.title,
    slug:  data => data.cms.slug,
    subtitle: data => data.cms.header.subTitle,
    summary: data => data.cms.header.summary,
    hero: data => data.cms.header.hero.data.attributes,
  }
};
