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
};

var lookupContainer = {
  check: 'checks',
  action: 'actions',
  hardware: 'hardware',
  meta: 'meta',
};

var ScenarioParser = function(options) {

  var self = this;

  // Set defaults
  var defaults = {
    timeout: 500000
  };

  self.settings = hashmerge(defaults, options);

  //EventEmitter2.call(this);

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

  scenario.tasks[nrOfTasks -1 ].run_list.push(special);

};


ScenarioParser.prototype.createNewTask = function(token, scenario, parserState) {
  var self = this;

  if (token.text.trim() === '') {
    parserState.warnings.push(new Error('Empty Task Header'));
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
    parserState.warnings.push(new Error('Empty ' + type + ' Header'));
  }

  var container = lookupContainer[type];
  scenario[container].push({
    type: type,
    id: token.text,
    params: { }
  });
};

ScenarioParser.prototype.updateLastTaskDescription = function(extraDescription, scenario, parserState) {
  var nrOfTasks = scenario.tasks.length;

  scenario.tasks[nrOfTasks -1 ].description += extraDescription;
};

ScenarioParser.prototype.isHeader = function(token) {
  return token.type === 'heading';
};

ScenarioParser.prototype.parseScenarioSpecial = function(token, scenario, parserState) {
    var self = this;

    var index = token.text.indexOf(':');
    if (index < 0) {
      parserState.warnings.push(new Error('special type badly formatted - missing colon'));
      return;
    }

    var link = token.text.substring(index + 1).trim();
    var type = token.text.substring(1,index);

    var _pattern = /\[(.*)\]\(#(.*)\)/;

    var results = link.match(_pattern);

    // If it did not match the pattern
    if (results === null) {
      parserState.warnings.push(new Error('special type badly formatted link'));
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

  if ((token.type === 'text') && parserState.insideList) {
      var indexOfColon = token.text.indexOf(':');
      if (indexOfColon >= 0) {
        var key = token.text.substring(0,indexOfColon);
        var value = self.stripValue(token.text.substring(indexOfColon + 1));

        if (key.indexOf(' ') > 0) {
          parserState.warnings.push(new Error('A special key cannot contain spaces'));
        } else {
          // Add to params of special
            var nrOfItems = scenario[sectionType.toLowerCase()].length;
            scenario[sectionType.toLowerCase()][nrOfItems -1 ].params[key] = value;
        }
    }

  }
};

ScenarioParser.prototype.parseScenario = function(token, scenario, parserState) {
  var self = this;

  // H2 inside Scenario = new Task
  if ((token.type === 'heading') && (token.depth === 2)) {
      self.createNewTask(token, scenario, parserState);
      parserState.inTaskSection = true;
      parserState.inList = false;
      return;
  }

  // Detect if we are entering a special list
  if ((token.type === 'list_start') && (token.markdown.substring(0,3) === '- @')) {
    parserState.inList = true;
    //console.log('@----');
     return;
  }

  // On leaving a list, reset the state
  if (token.type === 'list_end') {
    parserState.inList = false;
    return;
  }

  // Inlist means we are in a special ListItem
  if (parserState.inList) {
    if ((token.type === 'text') && (token.text[0] === '@')) {
      //console.log(token);
      self.parseScenarioSpecial(token, scenario, parserState);
    }
    return;
  }

  //console.log(token);

};

ScenarioParser.prototype.parse = function(content,callback) {

  var self = this;

  // Initialize structure for scenario
  var scenario = {
    actions: [],
    hardware: [],
    checks: [],
    tasks: [],
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

  // Initialize a lexer for markdown
  var lexerOptions = {gfm: true};
  var lexer = new marked.Lexer(lexerOptions);

  // Get the tokens from the content
  var tokens = lexer.lex(content);

  // Helper function to see if it's a specialPara
  var isSpecialPara = function(token) {
    return (token.type === 'paragraph') && (token.text[0] === '@');
  };

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

    var validSections = ['Actions', 'Checks', 'Hardware', 'Meta'];
    if (validSections.indexOf(parserState.currentSection) >= 0) {
      self.parseSpecialSection(parserState.currentSection, token, scenario, parserState);
    }

    return callback(null);
  }, function(err) {

    if (err) {
      // These are execution errors
      console.log(err);
    } else {
      // parserState.warnings & parserState.errors
    }
    return callback(err, scenario, {
      warnings: parserState.warnings,
      errors: parserState.errors
    });
  });

};
