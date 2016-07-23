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

var util = require('util')
var libxmljs = require("libxmljs");
var pd = require('pretty-data').pd;
var fs = require('fs')
var exec = require('child-process-promise').exec;
var config = require('../../core/config')
config.show_logs = false

function download_schema(folder, xml) {
	exec('node ./get_schemas.js')
	.then(function (result) {
		var stdout = result.stdout
		var stderr = result.stderr

		//console.log(stdout)
		xmlDoc = libxmljs.parseXml(stdout)
		Schemas = xmlDoc.childNodes()
		return Promise.all(Schemas.map(function (element) {
			var xml = element.toString()
			//console.log('node ./download_schema.js ' + config.remote_yang_dir + ' \'' + xml + '\'')
			return exec('node ./download_schema.js ' + config.remote_yang_dir + ' \'' + xml + '\'')
			.then(function (result) {
			})
			.catch(function (err) {
				console.error('ERROR: ', err);
			})
		}))
	})
	.catch(function (err) {
		console.error('ERROR: ', err);
	});
}

var folder

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		folder = process.argv[index]
})

if (folder) config.remote_yang_dir = folder

download_schema()

