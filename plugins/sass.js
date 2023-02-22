const sass = require("sass");
const path = require("node:path");

module.exports = function(eleventyConfig, options = {}) {
  const opts = {
    sassIn: 'sass',
    cssOut: 'css',
    ...options,
  };

  eleventyConfig.addTemplateFormats("scss");

  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",

    compileOptions: {
      permalink: function(contents, inputPath) {
        return (data) => {
          let cssPath = data.page.filePathStem.startsWith(`/${opts.sassIn}/`)
            ? data.page.filePathStem.replace(`/${opts.sassIn}/`, '')
            : data.page.filePathStem.replace('/', '');
          return `${path.join(opts.cssOut, cssPath)}.css`;
        };
      }
    },

    compile: async function (inputContent, inputPath) {
      let parsed = path.parse(inputPath);

      if (parsed.name.startsWith("_")) {
        return;
      }

      let result = sass.compileString(inputContent, {
        loadPaths: [parsed.dir || "."],
      });

      this.addDependencies(inputPath, result.loadedUrls);

      return async (data) => {
        return result.css;
      };
    }
  });
};
