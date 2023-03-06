module.exports = {
  eleventyComputed: {
    title:  data => data.cms.title,
    subtitle: data => data.cms.header.subTitle,
    summary: data => data.cms.header.summary,
    hero: data => data.cms.header.hero.data.attributes,
  }
};
