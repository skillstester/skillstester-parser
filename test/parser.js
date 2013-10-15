var path = require('path');
var fs = require('fs');
var expect = require('expect.js');
var path = require('path');

var ScenarioParser = require('../lib/parser');

var parser = new ScenarioParser();

function fetchScenario(filename) {
    var scenarioFile = path.join(__dirname, 'scenarios', filename);
    var text = fs.readFileSync(scenarioFile, 'utf-8');
    return text;
}

describe('ScenarioParser', function () {

  it('should ignore all unknown sections', function(done) {

    var mdText = fetchScenario('only_unknown_sections.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(scenario.actions).to.be.empty();
      expect(scenario.hardware).to.be.empty();
      expect(scenario.checks).to.be.empty();
      expect(scenario.tasks).to.be.empty();
      expect(scenario.run_list).to.be.empty();
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();
      done();
    });
  });

  it('should ignore all special unknown sections', function(done) {

    var mdText = fetchScenario('special_inside_unknown_section.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(scenario.actions).to.be.empty();
      expect(scenario.hardware).to.be.empty();
      expect(scenario.checks).to.be.empty();
      expect(scenario.tasks).to.be.empty();
      expect(scenario.run_list).to.be.empty();
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();
      done();
    });
  });

  it('should find specials in Scenario section', function(done) {

    var mdText = fetchScenario('special_inside_scenario_task_section.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();

      expect(scenario.tasks).not.to.be.empty();
      expect(scenario.tasks[0].run_list).not.to.be.empty();
      done();
    });
  });

  it('should ignore specials in Scenario section that are not in a task section', function(done) {

    var mdText = fetchScenario('special_inside_scenario_section.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();

      expect(scenario.tasks).to.be.empty();
      done();
    });
  });

  it('should get the correct description,link,type of a special inside Scenario/Task', function(done) {

    var mdText = fetchScenario('correct_special_inside_task.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();
      expect(scenario.tasks).not.to.be.empty();
      var run_list = scenario.tasks[0].run_list;
      expect(run_list).not.to.be.empty();
      expect(run_list[0].type).to.equal('check');
      expect(run_list[0].id).to.equal('checks-simple-check');
      expect(run_list[0].description).to.equal('A simple check');

      done();
    });
  });

  it('should warn on incorrect special inside Scenario/Task', function(done) {

    var mdText = fetchScenario('incorrect_special_inside_task.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).not.to.be.empty();
      expect(scenario.tasks).not.to.be.empty();

      done();
    });
  });

  it('should read correct action inside Actions', function(done) {

    var mdText = fetchScenario('correct_action_inside_actions.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();
      expect(scenario.tasks).to.be.empty();
      expect(scenario.actions).to.not.be.empty();
      var action = scenario.actions[0];

      var expected = {
        id: 'simple-action-bla',
        type: 'action',
        params: {
          type: 'exec',
          command: 'bla'
        }
      };

      expect(action).to.eql(expected);

      done();
    });
  });

  it('should split info sections inside Scenario', function(done) {

    var mdText = fetchScenario('info_inside_scenario_section.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();
      expect(scenario.tasks).to.not.be.empty();
      //expect(scenario.actions).to.not.be.empty();
      var action = scenario.actions[0];

      var expected = {
        id: 'simple-action-bla',
        type: 'action',
        params: {
          type: 'exec',
          command: 'bla'
        }
      };

      //expect(action).to.eql(expected);

      done();
    });
  });

});
