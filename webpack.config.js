module.exports = {
    entry: './index.js',
    mode: 'development',
    output: {
      path: `${__dirname}/public/dist`,
      filename: 'bundle.js',
    },
    watch: false
};
