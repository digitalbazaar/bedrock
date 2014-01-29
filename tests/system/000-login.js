var bedrock = {
  config: require(__libdir + '/config')
};
var should = require('should');
var async = require('async');

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
describe('Dev Account', function() {

  it('should be able to access the landing page', function(done) {
    browser.chain()
      .get(baseUrl)
      .title(function(err, title) {
        should.not.exist(err);
        title.should.eql('Bedrock: Welcome');
        done();
      });
  });

  it('should be able to sign in', function(done) {
    browser.chain()
      .get(baseUrl + '/')
      .elementByName('profile', function(err, element) {
        should.not.exist(err);
        element.sendKeys('dev');
      })
      .elementByName('password', function(err, element) {
        should.not.exist(err);
        element.sendKeys('password');
      })
      .elementByXPath('//a[text()="Sign In"]', function(err, element) {
        should.not.exist(err);
        browser.next('clickElement', element, function() {
        });
      })
      .waitForElementByXPath('//h1[text()="Dashboard"]', 5000, function(err) {
        should.not.exist(err);
        done();
      });
  });

});
