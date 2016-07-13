/*
 * Copyright (C) 2016 Deutsche Telekom AG.
 *
 * Author: Mislav Novakovic <mislav.novakovic@sartura.hr>
 * Author: Luka Perkov <luka.perkov@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var Q = require("q");
var Promise = require('promise');
var util = require('util')
var libxmljs = require("libxmljs");
var pd = require('pretty-data').pd;
var fs = require('fs')
var exec = require('child-process-promise').exec;
var config = require('../../core/config')
config.show_logs = false

let yng = []
var i = 0

function dfs(path) {
	console.log(path)
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var cur_path = path + "/" + file;
			if(fs.lstatSync(cur_path).isDirectory()) dfs(cur_path);
			else fs.unlinkSync(cur_path);
		});
		fs.rmdirSync(path);
	}
};

function download_server_schemas() {
	return exec('node ./download_schemas.js')
	.then(function (result) {
	})
	.catch(function (err) {
		console.error('ERROR: ', err);
	});

}

function check_schemas(path) {
	var p = Q()
	p = p.then(function() { return fs.open(path,'r',function(err,fd){
		if (err && err.code=='ENOENT') {
			fs.mkdirSync(path);
			return download_server_schemas()
		} else {
			dfs(path)
			fs.mkdirSync(path);
			return download_server_schemas()
		}
	});
	});
}

function r_int(low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}

function r_string(length) {
	var result = ''
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
	return result;
}

var get_default = function(y) {
	//console.log('node ./get_xpath.js "' + y.leaf[0].xpath + '"')
	return exec('node ./get_xpath.js "' + y.leaf[0].xpath + '"')
	.then(function (result) {
		y.leaf.push({default:result.stdout.replace(/\n$/, '')})
	})
	.catch(function (err) {
		console.error('ERROR: ', err);
	});
};

var get_defaults = function(yangs) {
	var p = Q()

	yangs.forEach(function(yang){ p = p.then(function(){ return get_default(yang); }); });

	return p;
};

var generate_data = function(y) {
	// generate random data

	if (y.leaf[1].type == 'string') {
		y.leaf.push({valid:[r_string(1), r_string(1), r_string(1)]})
	} else if (y.leaf[1].type == 'int16') {
		y.leaf.push({valid:[0,
			r_int(-Math.pow(2,8),Math.pow(2,8)-1),
			r_int(Math.pow(2,8), Math.pow(2,8)-1)]})
	} else if (y.leaf[1].type == 'uint16') {
		y.leaf.push({valid:[4,
			r_int(4, Math.pow(2,16)-1),
			r_int(4, Math.pow(2,16)-1)]})
		y.leaf.push({invalid:[-1,
			- r_int(0,Math.pow(2,16)-1),
			Math.pow(2,16) + r_int(0, Math.pow(2,16)-1)]})
	} else if (y.leaf[1].type == 'bool') {
		y.leaf.push({valid:['true','false']})
		y.leaf.push({invalid:[r_string(r_int(1,100)), r_string(r_int(1,100)), r_string(r_int(1,100)) ]})
	}
}

var run_valid_test = function(xpath, value, default_val, type) {
	process.stdout.write(type + ' test on "' + xpath + '" for value: ' + value + " => ")
	//console.log('node ./set_xpath.js "' + xpath + '" ' + value)
	return exec('node ./set_xpath.js "' + xpath + '" ' + value)
	.then(function (result) {
		if (result.stdout == '<ok/>' ) {
			if (type == 'INVALID')
				process.stdout.write("ERROR \n")
		} else {
			xmlDoc = libxmljs.parseXml(result.stdout)
			process.stdout.write("ERROR \n ERROR MESSAGE => ")
			process.stdout.write(xmlDoc.get('//error-message').toString() + '\n\n')
		}
	})
	.then(function (result) {
		// check if value is written
		return exec('node ./get_xpath.js "' + xpath + '"')
		.then(function (result) {
			if (result.stdout == value.toString()) {
				process.stdout.write("SUCCESS \n")
			}
		})
	})
	.then(function (result) {
		// restore value
		return exec('node ./set_xpath.js "' + xpath + '" ' + default_val)
		.then(function (result) {
			if (result.stdout == '<ok/>' ) {
				//sucess
			} else {
				xmlDoc = libxmljs.parseXml(result.stdout)
				process.stdout.write("ERROR \n")
				process.stdout.write(xmlDoc.get('//error-message').toString() + '\n\n')
			}
		})
	})
	.catch(function (err) {
		console.error('SYSTEM ERROR: ', err);
	});

}

var run_valid_tests = function(y) {
	var p = Q()

	if (y.leaf[3]) y.leaf[3].valid.forEach(function(value) {p = p.then(function(){ return run_valid_test(y.leaf[0].xpath, value, y.leaf[2].default, 'VALID'); }); });

	return p;
}

var run_invalid_tests = function(y) {
	var p = Q()

	if (y.leaf[4]) y.leaf[4].invalid.forEach(function(value) {p = p.then(function(){ return run_valid_test(y.leaf[0].xpath, value, y.leaf[2].default, 'INVALID'); }); });

	return p;
}

var run_tests = function(yng) {
	var p = Q()

	if (yng) yng.forEach(function(y) { p = p.then(function(){ return run_valid_tests(y); });});
	if (yng) yng.forEach(function(y) { p = p.then(function(){ return run_invalid_tests(y); }); });

	return p;
}

var start = function() {
	var p = Q()
	p = p.then(function () {return check_schemas(config.remote_yang_dir)});
	p = p.then(function (result) {
		return exec('node ./list_leafs.js')
		.then(function (result) {
			var output = result.stdout.split(/[, ]+/).pop();
			xpaths = result.stdout.split('\n')
			return Promise.all(xpaths.map(function (xpath) {
				if (xpath === '') return Promise.resolve();

				let type = xpath.split(/[, ]+/).pop()
				xpath = xpath.slice(0,xpath.length - (1 + type.length))

				// skip undefined yang type
				if (type === 'undefined') return Promise.resolve();
				else if (xpath === '') return Promise.resolve();

				yng.push({leaf:[{xpath:xpath},{type:type}]})
			}))
			.then(function (resolve, reject) {
				// get default values
				return get_defaults(yng)
			})
			.then(function (resolve, reject) {
				// generate random data
				return Promise.all(yng.map(function (y) {
					return generate_data(y)
				}))
			})
			.then(function (resolve, reject) {
				return run_tests(yng)
			})
			.then(function (resolve, reject) {
				console.log("DONE \n")
			})
		})
		.catch(function (err) {
			console.error('ERROR: ', err);
		});
	})
	return p;
}

start()
