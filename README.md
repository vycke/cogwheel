# Cogwheel - simple JavaScript state machines

![](https://github.com/crinklesio/cogwheel/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/cogwheel.svg?style=flat)](https://www.npmjs.com/package/cogwheel)
[![NPM Downloads](https://img.shields.io/npm/dm/cogwheel.svg?style=flat)](https://www.npmjs.com/package/cogwheel)
[![Minified size](https://img.shields.io/bundlephobia/min/cogwheel?label=minified)](https://www.npmjs.com/package/cogwheel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **NOTE**: this package is still in development. Its API changes and might break with NPM updates.

Simple finite state machines that can be used for state/process management.

## Principles

Cogwheel is build around the following principles around state machines, and the library should be used as such:

- State transitions are synchronous & fire & forget by design;
- State transisions should not have side-effects, except for debugging purposes (e.g. console-log;
- The context should be serializable;
- All state & context mutations should be owned by the machine and its actions. This means as much (business) logic as possible should be included in the machine and its actions.

## [Getting started](./docs/getting-started.md)

## [Guards](./docs/guards.md)

## [Actions](./docs/actions.md)

## [Parallel states](./docs/parallel-states.md)

## [Front-end framework implementation](./docs/front-end-frameworks.md)

## [State machine examples](./docs/examples.md)
