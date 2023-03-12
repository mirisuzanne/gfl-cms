module.exports = {
  eleventyComputed: {
    byline: data => data.cms.byline,
    showTitle: data => data.cms.show.data.attributes.title,
  }
};
