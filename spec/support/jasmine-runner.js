const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const noop = function () { };

const jrunner = new Jasmine({});
jrunner.configureDefaultReporter({
    print: noop,
    showingColors: true
});
jasmine.getEnv().addReporter(new SpecReporter()); // add jasmine-spec-reporter
jrunner.loadConfigFile(); // load jasmine.json configuration
jrunner.execute();
jrunner.randomizeTests(true);

module.exports = jrunner;