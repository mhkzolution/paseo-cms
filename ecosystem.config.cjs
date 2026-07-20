module.exports = {
  apps: [
    {
      name: "paseo-cms",
      script: ".next/standalone/server.js",
      cwd: "/var/www/paseo-cms",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "512M",
      out_file: "/var/log/paseo-cms/out.log",
      error_file: "/var/log/paseo-cms/error.log",
      time: true,
    },
  ],
};
