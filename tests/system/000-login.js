var bedrock = {
  config: require(__libdir + '/config')
};

var browser = GLOBAL.browser;
var baseUrl = bedrock.config.website.baseUrl;

/**
 * These tests are meant to be chained together, they are not stand-alone tests.
 * That means that the tests are designed to have side effects that are
 * assumed in the following test. This would be the wrong way to write unit
 * tests, but it is the "right way" to create live functionality tests.
 * Eventually, we should have long series of tests that are chained together
 * to ensure that we're simulating standard usage flows for the system.
 */
describe('Dev Account Login', function() {

  beforeEach(function() {
    return browser
      .get(baseUrl)
      // FIXME need to wait for angular processing to settle
      .sleep(1000);
  });

  it('should be able to access the page title', function() {
    return browser
      .title().should.become('Bedrock: Welcome');
  });

  it('should be able to sign in', function() {
    return browser
      .elementByName('profile')
      .sendKeys('dev')
      .elementByName('password')
      .sendKeys('password')
      .elementByXPath('//a[text()="Sign In"]')
      .click()
      .waitForElementByXPath('//h1[text()="Dashboard"]', 5000);
  });

});
