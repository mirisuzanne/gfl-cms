module.exports = function(eleventyConfig, options = {}) {
  const opts = {
    collectionExcludeOutputTypes: ['css'],
    ...options,
  }

  // When `permalink` is false, the file is not written to disk
  eleventyConfig.addGlobalData("eleventyComputed.permalink", function() {
    return (data) => {
      // Skip drafts during non-watch/serve builds
      if(data.draft && !process.env.BUILD_DRAFTS) {
        return false;
      }

      return data.permalink;
    }
  });

  // When `eleventyExcludeFromCollections` is true, the file is not included in any collections
  eleventyConfig.addGlobalData("eleventyComputed.eleventyExcludeFromCollections", function() {
    return (data) => {
      const exclude =
        // Exclude drafts from non-watch/serve builds
        data.draft && !process.env.BUILD_DRAFTS
        // Exclude output types
        || opts.collectionExcludeOutputTypes.includes(data.page.outputFileExtension);

      if(exclude) {
        return true;
      }

      return data.eleventyExcludeFromCollections;
    }
  });

  eleventyConfig.on("eleventy.before", ({runMode}) => {
    // Set the environment variable
    if(runMode === "serve" || runMode === "watch") {
      process.env.BUILD_DRAFTS = true;
    }
  });
}
