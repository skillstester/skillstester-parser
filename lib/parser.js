'use strict';

var util = require('util');
var hashmerge = require('hashmerge');
var async = require('async');
var marked = require('../vendor/marked');

var lookupType = {
  checks: 'check',
  actions: 'action',
  hardware: 'hardware',
  meta: 'meta',
  settings: 'setting'
};

var lookupContainer = {
  check: 'checks',
  action: 'actions',
  hardware: 'hardware',
  meta: 'meta',
  setting: 'settings'
};

var separator = '-> @';

var ScenarioParser = function(options) {

  var self = this;

  // Set defaults
  var defaults = {
  };

  self.settings = hashmerge(defaults, options);

};

util.inherits(ScenarioParser, Object);

module.exports = ScenarioParser;

// Function remove single, double and backticks from params
ScenarioParser.prototype.stripValue = function(content) {
  var result = content.trimLeft();
  var quotes = [ '`' , '"' , '\'' ];
  quotes.forEach(function(quote) {
    if ((result.indexOf(quote) === 0) && result.lastIndexOf(quote) === result.length -1 ) {
      result = result.substring(1, result.length -1);
    }
  });
  return result;
};

ScenarioParser.prototype.addToRunList = function(special,scenario, parserState) {

  var nrOfTasks = scenario.tasks.length;

  if (parserState.inSolution) {
    special.solution = true;
  }
  scenario.tasks[nrOfTasks -1 ].run_list.push(special);

};


ScenarioParser.prototype.createNewTask = function(token, scenario, parserState) {
  var self = this;

  // Seems like parser removes empty headings by default
  if (token.text.trim() === '') {
    parserState.warnings.push(new Error('Empty Task Header'));
    return;
  }

  scenario.tasks.push({
    description: '',
    type: 'task',
    id: token.text,
    run_list: []
  });
};

ScenarioParser.prototype.createNewElement = function(type, token, scenario, parserState) {
  var self = this;

  if (token.text.trim() === '') {
    parserState.errors.push(new Error('Empty ' + type + ' Header'));
    return;
  }

  var container = lookupContainer[type];
  scenario[container].push({
    type: type,
    id: token.text,
    params: { }
  });
};

ScenarioParser.prototype.parseScenarioSpecial = function(text, scenario, parserState) {
    var self = this;

    var index = text.indexOf(':');
    if (index < 0) {
      parserState.warnings.push(new Error('special type badly formatted - missing colon'));
      return;
    }

    var link = text.substring(index + 1).trim();
    var type = text.substring(separator.length,index);

    if (! (type in lookupContainer)) {
      parserState.errors.push(new Error('unknown special type ' + type));
      return;
    }

    var _pattern = /\[(.*)\]\(#(.*)\)/;

    var results = link.match(_pattern);

    // If it did not match the pattern
    if (results === null) {
      parserState.errors.push(new Error('special type badly formatted link'));
      return;
    }

    if (parserState.inTaskSection) {
      var description = results[1];
      var id = results[2];

      // Add it to the runlist of the current task
      var special = {
        type: type,
        id: id,
        description: description,
        params: {}
      };

      // add it to the runlist
      self.addToRunList(special, scenario, parserState);
    }

};


ScenarioParser.prototype.parseSpecialSection = function(sectionType, token, scenario, parserState) {
  var self = this;
  // H2 inside Special Section
  if ((token.type === 'heading') && (token.depth === 2)) {

      var elementType = lookupType[sectionType.toLowerCase()];
      self.createNewElement(elementType, token, scenario, parserState);
      parserState.inTaskSection = true;

      return;
  }

  if (token.type === 'list_start') {
    parserState.insideList = true;
    return;
  }

  if (token.type === 'list_end') {
    parserState.insideList = false;
    return;
  }

  var nrOfItems = scenario[sectionType.toLowerCase()].length;

  // If we expect a codeblock & we have a code block
  // Replace the previous command of the action
  if (parserState.expectCodeBlock && (token.type === 'code')) {
    scenario[sectionType.toLowerCase()][nrOfItems -1 ].params.command = token.text;
    parserState.expectCodeBlock = false;
    return;
  }

  if ((token.type === 'text') && parserState.insideList) {
      var indexOfColon = token.text.indexOf(':');
      if (indexOfColon >= 0) {
        var key = token.text.substring(0,indexOfColon);
        var value = self.stripValue(token.text.substring(indexOfColon + 1));

        if (key.indexOf(' ') > 0) {
          parserState.warnings.push(new Error('A special key cannot contain spaces'));
        } else {
          // Add to params of special
            scenario[sectionType.toLowerCase()][nrOfItems -1 ].params[key] = value;
        }

        // Check for codeblocks and signal the parser
        if (value === '@codeblock') {
          parserState.expectCodeBlock = true;
        }
    }

  }
};

ScenarioParser.prototype.parseScenario = function(token, scenario, parserState) {
  var self = this;

  //console.log(token);
  // Look for h2. in Scenario Section
  if ((token.type === 'heading') && (token.depth === 2)) {
      self.createNewTask(token, scenario, parserState);
      parserState.inTaskSection = true;
      parserState.inSolution = false;
      return;
  }

  // Look for h3. Solution
  if ((token.type === 'heading') && (token.depth === 3)) {
    if (token.text === 'Solution') {
      parserState.inSolution = true;
    } else {
      parserState.inSolution = false;
    }
    // We continue to add the heading parts to the text Blocks
    //return;
  }

  // Special blocks begin with separator
  if ((token.type === 'paragraph') && (token.text.substring(0,separator.length) === separator)) {
      // Multiple specials in a paragraph are separated by a newline
      var allSpecials = token.text.split(/\n/);

      allSpecials.forEach(function(text) {
        // We ignore other stuff in the special block
        if (text.indexOf(separator) === 0) {
          self.parseScenarioSpecial(text, scenario, parserState);
        }
      });

    return;
  }

  // We only get here if it's not a special thing above
  if (token.markdown !== undefined) {
    //console.log(token);

    var tasks = scenario.tasks;
    var nrOfTasks = tasks.length;

    // There is always a task as we're in a heading
    var lastTask = tasks[nrOfTasks - 1];
    var runList = lastTask.run_list;
    var nrOfRunListItems = runList.length;

    var info = {
      type: 'text',
      lang: 'markdown',
      content: token.markdown
    };

    // If no RunListItems yet, add a new one
    if (nrOfRunListItems === 0) {
      self.addToRunList(info, scenario, parserState);
    } else {
      var lastItem = runList[runList.length - 1];
      // If last run_list is a TextBlock add the text
      if ((lastItem.type === 'text') && (token.type !== 'heading')){
        lastItem.content += token.markdown;
      } else {
        self.addToRunList(info, scenario, parserState);
      }
    }

  }

};

ScenarioParser.prototype.parse = function(content,callback) {

  var self = this;

  // Initialize structure for scenario
  var scenario = {
    actions: [],
    hardware: [],
    checks: [],
    meta: [],
    tasks: [],
    settings: [],
    run_list: []
  };

  // Structure to keep the parser state
  var parserState = {
    lastSpecial: {
      expectCodeBlock: false,
      type: null,
      id: null
    },
    warnings: [],
    errors: [],
    currentSection: null
  };


  async.series([function(callback) {
    self.parseFirstPass(content, scenario, parserState, callback);
  },function(callback) {
    self.parseSecondPass(scenario, parserState, callback);
  }], function(err, results) {
    return callback(err, scenario, {
      warnings: parserState.warnings,
      errors: parserState.errors
    });
  });


};

ScenarioParser.prototype.parseFirstPass = function(content, scenario, parserState ,callback) {

  var self = this;

  // Initialize a lexer for markdown
  var lexerOptions = {gfm: true};
  var lexer = new marked.Lexer(lexerOptions);

  // Get the tokens from the content
  var tokens = lexer.lex(content);

  // Iterate over all tokens
  async.eachSeries(tokens, function(token, callback) {

    // H1 - sets section and resets Tasks
    if ((token.type === 'heading') && (token.depth === 1)) {
      parserState.inTaskSection = false;
      parserState.currentSection = token.text;
      return callback(null);
    }

    if (parserState.currentSection === 'Scenario') {
      self.parseScenario(token, scenario, parserState);
      return callback(null);
    }

    var validSections = ['Actions', 'Checks', 'Hardware', 'Meta', 'Settings'];
    if (validSections.indexOf(parserState.currentSection) >= 0) {
      self.parseSpecialSection(parserState.currentSection, token, scenario, parserState);
    }

    return callback(null);
  }, function(err) {
    return callback(err);
  });
};

ScenarioParser.prototype.parseSecondPass = function(scenario, parserState ,callback) {

  var keys = {};
  // Find all ids of each Special Type
  var types = (Object.keys(lookupType));
  types.forEach(function(type) {
    keys[type] = {};
    scenario[type].forEach(function(item) {
      keys[type][item.id] = '';
      //console.log(item.id);
    });
  });

  // Now for each tasks
  scenario.tasks.forEach(function(task) {
    var runList = task.run_list;
    // for each item in the run_list
    runList.forEach(function(item) {
      if (item.type in lookupContainer) {
        // Verify if special item references to an existing item
        if (item.id in keys[lookupContainer[item.type]]) {
          // All good
        } else {
          parserState.errors.push(new Error('Referenced non-defined '+ item.type + '#'+item.id));
        }
      }
    });

  });

  return callback(null);
};
