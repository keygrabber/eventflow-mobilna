const { getDefaultConfig } = require('expo/metro-config');
const gateway = require('./scripts/authenticated-api-gateway.cjs');
const config = getDefaultConfig(__dirname);
const previous = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) =>
  gateway(previous ? previous(middleware, server) : middleware);
module.exports = config;
