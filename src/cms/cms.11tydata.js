module.exports = {
  eleventyComputed: {
    title:  data => {
      if (!data.cms.title) {
        console.warn(`Title needed for ${data.page.url}`);
      }
      return data.cms.title || 'Title Needed'
    },
    subtitle: data => data.cms.header
      ? data.cms.header.subTitle
      : data.subtitle,
    summary: data => data.cms.header
      ? data.cms.header.summary
      : data.summary,
    hero: data => {
      const pageHero = data.cms.header?.hero.data?.attributes;
      return pageHero || data.site.header.hero.data?.attributes;
    },
    date: data => data.cms.date,
  }
};
