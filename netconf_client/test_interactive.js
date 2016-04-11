/*
 * Copyright (C) 2015 Deutsche Telekom AG.
 *
 * Author: Mak Krnic <mak.krnic@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var readline = require('readline')
require('es6-shim')
var fs = require('fs');
var debug = require('../core/debug')
var config = require('../core/config')
var spawn = require('child_process').spawn

var commands = ['run', 'help'];

var completer = function(line) {
	var completions;

	if (line.startsWith('run ')) {
		var params = line.substring(4).trim();
		var subdir = params.match(/(.*\/)/);
		subdir = subdir ? subdir[0] : '';

		var files;
		var cwd = __dirname + '/tests/' + subdir;
		try {
			files = fs.readdirSync(cwd);
			files = files.map(function(f) {
				if (f.endsWith('.js')) {
					return subdir + f;
				}

				var stat = fs.statSync(cwd + f);
				if (stat.isDirectory()) {
					return subdir + f + '/';
				}

				return null;
			})
			.filter(function(element) {
				return element;
			})
		}
		catch (e) {
			console.log(e);
		}

		completions = files.map(function(f) { return 'run ' + f });
	}
	else {
		completions = commands.map(function(c){return c + ' '})
	}

	completions = completions.filter(function(c)
	{
		return c.startsWith(line);
	})

	return [completions, line]
}

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	completer: completer,
})

rl.setPrompt('> ')
rl.prompt()

rl.on('line', function (line)
{
	line = line.trim();

	if (line.startsWith('run')) {
		var params = line.substring(4).trim();
		if (!params.length) {
			console.log("What to run?");
		}
		else {
			console.log("Running: " + params);
			var child = spawn('node', ['./tests/' + params]);

			child.stdout.on('data', function(data)
			{
				process.stdout.write(params + ': ' + data)
			})

			child.stderr.on('data', function(data)
			{
				process.stderr.write(params + ': ' + data)
			})
				//require('./tests/' + params)
				//
			child.on('close', function(code)
			{
				console.log('')
				console.log('`' + params + '` exited with code ' + code)
				rl.prompt()
			})

			return
		}
	}
	else if (line.startsWith('help')) {
		console.log("Available commands:\n");
		console.log(commands.join("\n"));
		console.log("\nUse <TAB> to see available options.");
	}
	else {
		console.log('not found');
	}

	rl.prompt()
})
.on('close', function()
{
	console.log("Bye!");
	process.exit(0);
})
