module.exports = {
  eleventyComputed: {
    title: data => data.cms.title,
    date: data => data.cms.date,
    byline: data => data.cms.byline,
    showTitle: data => data.cms.show.data.attributes.title,
  }
};
