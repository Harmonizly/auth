let harmonize = {
  name: 'auth.harmonize',
  script: './index.js',
};

if (process.env.NODE_ENV === 'development') {
  harmonize = Object.assign(harmonize, {
    node_args: ['--inspect=0.0.0.0:9229'],
    watch: ['dist/server'],
  });
}

module.exports = {
  apps: [harmonize],
};
