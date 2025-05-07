module.exports = {
  apps: [
    {
      name: 'fresh-nextjs-app',
      script: 'npm',
      args: 'start',
      watch: true,
      ignore_watch: ['node_modules', '.next'],
      restart_delay: 1000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
