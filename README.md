# skillstester-parser 
[![Build Status](https://secure.travis-ci.org/skillstester/skillstester-parser.png?branch=master)](http://travis-ci.org/skillstester/skillstester-parser)

> Parser for skillstester (markdown) challenges

## Jump to Section

* [Introduction](#introduction)
* [Language](#language)

## Introduction
[[Back To Top]](#jump-to-section)

This project contains a parser for the scenario language used on <http://skillstester.org>

Sample scenarios can be found at <https://github.com/skillstester/skillstester-sample-scenarios>


## Language
[[Back To Top]](#jump-to-section)

A skillstester scenario is defined in Markdown.

This skilltester-parser will convert the Markdown in a machine usable Json Scenario.

A scenario file consists of multiple Sections. Each Section is specified as level h1.

- h1. `Scenario` contains the tasks & extra information
- h1. `Actions` contains the actions
- h1. `Checks` contains the checks
- h1. `Hardware` contains the hardware
- h1. `Settings` contains the settings


## Linking elements inside a scenario
To reference an element inside the scenario you can use the following syntax
`-> @<special-type>: [a description](#<reference-to-special-definition>)`

Known special-types are:
- action: this will contain a block that will execute something
- check: a check that will be executed
- setting: a setting that can be loaded

A <reference-to-special-definition> can contain any characters.
But if you avoid spaces or '.', github will create autolink to your subsection elements.

Example:
```
-> @check: [A simple check](#simple-check-element)
-> @action: [A simple check](#simple-action-element)
```

## Defining a special element
A h2. level element will define the `id` of the element you can refer to

Any list-item element of the form `key`: `value` will result in parameter

## Codeblocks
if you specify a `@codeblock` inside a value, if will load the next code element as a parameter

## Parametrized content/elements
In values or text blocks, you can use the [mustache] syntax {{{ }}}.

Any settings you define in your settings block can be referenced with prefix:
- `scenario.`.

Other available prefixes are:
- `player.` 
- `hardware.<id>.ip_address`

## Solution block
Any action defined in a h3. block `Solution` will only be executed on request or in test-mode.

## Json format
```json
{
  actions: [],
  checks: [],
  hardware: [],
  scenario: []
}
```


## Action types
Known action types are:

- Exec: ssh execs on a machine
  - command:
  - username:

- Http: performs an http request

## Check types:
Checks extend action types with criteria to check if success full or not

- Exec:
  - exitcode:
  - content:

## Todo:
- Explain combo types
- Figure out merging of attributes
- aliasing elements


