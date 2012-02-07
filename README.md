# Tasker

Tasker is inspired by rake, jake, make, and-many-other-ake's

## Goals

  - Simple to use
  - Doesn't polute the global namespace
  - Node like (ex: supports async tasks)
  - Use standard option flags
  - Use like any other node module, not a binary

## Example Tasker Script

    var tasker = require('tasker');

    // Namespaces:
    tasker.namespace('example', function () {
      
      tasker
        .desc('Test Description')
        .params(
          {default: null, short: 'n', long: 'name', desc: 'Your name.'},
          {default: null, short: 'a', long: 'age', desc: 'Your age.'}
        )
        .define('foo', ['bar'], function () {
          var opts = tasker.opts;

          console.log('Ran Foo', opts.name, opts.age)
        });

    });


    // By including the next param you are indicating that this is an async
    // task. You must call next() at some point or processing will cease.
    tasker
      .desc('Something else')
      .define('bar', ['qux'], function (next) {
        console.log('Ran Bar');
        next();
      });

    tasker
      .desc('Something else')
      .define('qux', function () {
        console.log('Ran Qux');
      });


    // This is required to start tasker after everything is defined
    tasker.run();


    // Usage: node ./examples/demo.js example:foo -n Ray -a 24
    // Output:
    //   Ran Qux
    //   Ran Bar
    //   Ran Foo Ray 24

    // Usage: node ./examples/demo.js bar
    // Output:
    //   Ran Qux
    //   Ran Bar

    // Usage: node ./examples/demo.js qux
    // Output:
    //   Ran Qux


Tasker exports 6 functions. Other than that everything is pure, normal Node.js.
For example, you can use `require` to pull in tasks from other files. Just make
sure that you call `tasker.run()` last.

