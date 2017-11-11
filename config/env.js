const version = new Date().getTime();
module.exports = {
  __DEVELOPMENT__: JSON.parse(process.env.NODE_ENV === 'development'),
  __BUILD__:       JSON.parse(process.env.NODE_ENV === 'production'),
  __VERSION__:     version,
};
