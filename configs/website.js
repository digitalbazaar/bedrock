var config = require(__libdir + '/config');

config.website.browserVersions = {
  IE: {major: 8, minor: 0},
  Firefox: {major: 3, minor: 6},
  Opera: {major: 10, minor: 6},
  Safari: {major: 4, minor: 0},
  Chrome: {major: 17, minor: 0}
};

config.website.views.vars = {
  productionMode: false,
  minimizeJS: false,
  baseUri: config.server.baseUri,
  serviceHost: config.server.host,
  serviceDomain: config.server.domain,
  supportDomain: config.server.domain,
  googleAnalytics: {
    enabled: false,
    account: ''
  },
  session: {
    loaded: false,
    auth: false
  },
  inav: '',
  pageLayout: 'normal',
  debug: true,
  title: config.brand.name,
  siteTitle: config.brand.name,
  redirect: true,
  style: {
    brand: {
      alt: config.brand.name,
      src: '/img/bedrock.png',
      height: '24',
      width: '182'
    }
  },
  // extensions for webpage loaded resources can be adjusted to 'min.css' or
  // similar to load minimized resources
  // local resources
  cssExt: 'css',
  // library resources
  cssLibExt: 'css',
  // list of css files to load without the extension
  cssList: [],
  cacheRoot: '',
  // client-side data
  clientData: {
    baseUri: config.server.baseUri,
    siteTitle: config.brand.name,
    productionMode: false
  },
  // contact and social media details
  // blog, email, facebook, github, googlePlus, irc, twitter, youtube
  //   *: {label: '...', url: '...'}
  //   email: {..., email: '...'}
  contact: {}
};

config.website.views.routes = [
  ['/', 'index.tpl'],
  '/about',
  '/legal',
  '/contact',
  ['/help', 'help/index.tpl']
];
