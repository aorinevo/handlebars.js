const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const chai = require('chai');
chai.use(require('chai-diff'));
const expect = chai.expect;

const testCases = [
  {
    binInputParameters: ['-a', 'spec/artifacts/empty.handlebars'],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/empty.amd.js'
  },
  {
    binInputParameters: [
      '-a',
      '-f',
      'TEST_OUTPUT',
      'spec/artifacts/empty.handlebars'
    ],
    outputLocation: 'TEST_OUTPUT',
    expectedOutputSpec: './spec/expected/empty.amd.js'
  },
  {
    binInputParameters: [
      '-a',
      '-n',
      'CustomNamespace.templates',
      'spec/artifacts/empty.handlebars'
    ],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/empty.amd.namespace.js'
  },
  {
    binInputParameters: [
      '-a',
      '--namespace',
      'CustomNamespace.templates',
      'spec/artifacts/empty.handlebars'
    ],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/empty.amd.namespace.js'
  },
  {
    binInputParameters: ['-a', '-s', 'spec/artifacts/empty.handlebars'],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/empty.amd.simple.js'
  },
  {
    binInputParameters: ['-a', '-m', 'spec/artifacts/empty.handlebars'],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/empty.amd.min.js'
  },
  {
    binInputParameters: [
      'spec/artifacts/known.helpers.handlebars',
      '-a',
      '-k',
      'someHelper',
      '-k',
      'anotherHelper',
      '-o'
    ],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/non.empty.amd.known.helper.js'
  },
  {
    binInputParameters: ['--help'],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/help.menu.txt'
  },
  {
    binInputParameters: ['-v'],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/version.txt'
  },
  {
    binInputParameters: ['-i', '<div>Test String</div>'],
    outputLocation: 'stdout',
    expectedOutputSpec: './spec/expected/compiled.string.txt'
  }
];

module.exports = function(grunt) {
  grunt.registerTask('test:bin', function() {
    testCases.forEach(
      ({ binInputParameters, outputLocation, expectedOutputSpec }) => {
        const stdout = executeBinHandlebars(...binInputParameters);

        const expectedOutput = fs.readFileSync(expectedOutputSpec, 'utf-8');

        const useStdout = outputLocation === 'stdout';
        const normalizedOutput = normalizeCrlf(
          useStdout ? stdout : fs.readFileSync(outputLocation, 'utf-8')
        );
        const normalizedExpectedOutput = normalizeCrlf(expectedOutput);

        if (!useStdout) {
          fs.unlinkSync(outputLocation);
        }

        expect(normalizedOutput).not.to.be.differentFrom(
          normalizedExpectedOutput,
          {
            relaxedSpace: true
          }
        );
      }
    );
  });
};

// helper functions

function executeBinHandlebars(...args) {
  if (os.platform() === 'win32') {
    // On Windows, the executable handlebars.js file cannot be run directly
    const nodeJs = process.argv[0];
    return execFilesSyncUtf8(nodeJs, ['./bin/handlebars'].concat(args));
  }
  return execFilesSyncUtf8('./bin/handlebars', args);
}

function execFilesSyncUtf8(command, args) {
  const env = process.env;
  env.PATH = addPathToNodeJs(env.PATH);
  return childProcess.execFileSync(command, args, { encoding: 'utf-8', env });
}

function addPathToNodeJs(pathEnvironment) {
  return path.dirname(process.argv0) + path.delimiter + pathEnvironment;
}

function normalizeCrlf(string) {
  if (typeof string === 'string') {
    return string.replace(/\r\n/g, '\n');
  }
  return string;
}
