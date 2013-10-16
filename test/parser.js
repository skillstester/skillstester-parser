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

  it('should add a codeblock if one expects it', function(done) {

    var mdText = fetchScenario('action_with_codeblock.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).to.be.empty();
      expect(parserState.warnings).to.be.empty();
      var action = scenario.actions[0];

      expect(action.params.command).to.equal('ls -l');

      done();
    });
  });

  it('should add a textblock if one expects it', function(done) {

    var mdText = fetchScenario('text_block.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      var textBlock = scenario.tasks[0].run_list;
      expect(scenario.tasks[0].run_list.length).to.be(5);

      done();
    });
  });

  it('should detect multiple specials grouped together', function(done) {

    var mdText = fetchScenario('specials_grouped.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(scenario.tasks[0].run_list.length).to.be(4);
      done();
    });
  });

  it('should detect a solution block', function(done) {

    var mdText = fetchScenario('solution_block.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(scenario.tasks[0].run_list.length).to.be(4);
      // The first 2 run_list items are not part of a solution block
      expect(scenario.tasks[0].run_list[0].solution).not.to.be(true);
      expect(scenario.tasks[0].run_list[1].solution).not.to.be(true);
      // Last 2 run_list items are part of a solution block
      expect(scenario.tasks[0].run_list[2].solution).to.be(true);
      expect(scenario.tasks[0].run_list[3].solution).to.be(true);
      done();
    });
  });

  it('should detect a non-existing special', function(done) {

    var mdText = fetchScenario('missing_special_definition.md');

    parser.parse(mdText,function(err,scenario, parserState) {
      expect(err).to.be(null);
      expect(parserState.errors).not.to.be.empty();
      done();
    });
  });

});
