// var argv = require('optimist').argv;
var optimist = require('optimist');

exports.desc = desc;
exports.namespace = namespace;
exports.param = param;
exports.params = params;
exports.define = define;
exports.run = run;


var tasks = {};
var outputs = {};


function desc(message) {
  desc.current = message;

  return exports;
}

function namespace(name, callback) {
  var previousNamespace = namespace.current;

  if (namespace.current) {
    namespace.current += ':' + name;
  } else {
    namespace.current = name;
  }

  callback();

  namespace.current = previousNamespace;

  return exports;
}

function param(opts) {
  if (!param.params) {
    param.params = [];
  }

  param.params.push(opts);

  return exports;
}

function params(/* ... */) {
  for (var i = 0; i < arguments.length; i++) {
    param(arguments[i]);
  }

  return exports;
}

function output(name, callback) {
  outputs[name] = callback;
}

function define(name, deps, callback) {
  if (typeof deps === 'function') {
    _define(name, [], deps);
  } else {
    _define(name, deps, callback);
  }

  return exports;
}

function run() {
  var argv = optimist.argv,
      name = argv._[0];

  // console.log(tasks);

  if (!name) {
    _echoTasks();
    return;
  }

  var task = tasks[name];

  if (!task) throw new Error('Task not found with name: ' + name);

  var tasksToRun = _flattenAndReverseNames(_gatherTaskNames(task));

  var params = _gatherRequiredParams(tasksToRun);

  exports.opts = _setupOptimist(params).argv;

  _runTasks(tasksToRun);
}


// ----------------- //
// ---- Private ---- //
// ----------------- //

function _clearDesc() {
  delete desc.current;
}

function _clearParams() {
  delete param.params;
}

function _currentNamespace() {
  if (namespace.current) {
    return namespace.current + ':';
  } else {
    return '';
  }
}

function _define(name, deps, callback) {
  tasks[_currentNamespace() + name] = {
    name: _currentNamespace() + name,
    deps: deps,
    callback: callback,
    async: callback.length === 1,
    description: desc.current,
    params: param.params
  };

  _clearDesc();
  _clearParams();
}

function _gatherRequiredParams(taskNames) {
  var params = {};

  taskNames.forEach(function (name) {
    var task = tasks[name];

    if (!task) throw new Error('Task not found with name: ' + name);

    if (task.params) {
      task.params.forEach(function (param) {
        params[param.long] = param;
      });
    }
  });

  return params;
}

function _setupOptimist(params) {
  var opts = optimist
              .usage('Usage: $0 [task name] [args...]');
              // .describe('output', 'The output type.')
              // .default('output', 'stdout');

  for (var name in params) {
    var param = params[name];

    opts = 
    opts
      .demand(param.short)
      .alias(param.short, param.long)
      .describe(param.short, param.desc)
      .default(param.short, param.default || null);
  }

  return opts;
}

function _gatherTaskNames(task, taskNames) {
  taskNames = taskNames || [];

  taskNames.push(task.name);

  if (task.deps.length > 0) {
    var mapped = [];

    task.deps.forEach(function (name) {
      _gatherTaskNames(tasks[name], mapped);
    });

    taskNames.push(mapped);
  }

  return taskNames;
}

function _flattenAndReverseNames(taskNames, arr) {
  arr = arr || [];

  var i = taskNames.length;

  while (i--) {
    var name = taskNames[i];

    if (Array.isArray(name)) {
      _flattenAndReverseNames(name, arr);
    } else {
      arr.push(name);
    }
  }

  return arr;
}

function _runTasks(taskNames) {
  (function next(i) {
    var name = taskNames[i];

    if (!name) return;

    var task = tasks[name];

    if (!task) throw new Error('Task not found with name: ' + name);

    if (task.async) {
      task.callback(next.bind(undefined, ++i));
    } else {
      task.callback();
      next(++i);
    }

  }(0));
}

function _echoTasks() {
  console.log("");

  // console.log("Options:")
  // console.log("  --output  The output type.  [required]  [default: stdout]\n");

  console.log('All Task:\n');

  for (var name in tasks) {
    var task = tasks[name];

    console.log('  ' + task.name + ' - ' + task.description);
  }

  console.log("");
}
