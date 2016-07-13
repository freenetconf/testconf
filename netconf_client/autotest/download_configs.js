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
var fs = require('fs')
var libxmljs = require("libxmljs");
var config = require('../../core/config')
config.show_logs = false

function download_configs(folder, target){
	var netconf_client = require('../netconf_client')
	var request = '' +
       	'<get-config>' +
	'<source><' + target + '/></source>' +
	'</get-config>'

	netconf_client.create(config).then(function(client) {
		client.send(request).thenDefault(function(reply) {
			client.send_close().then(function (resolve,request) {
				xmlDoc = libxmljs.parseXml(reply)
				configs = xmlDoc.root().childNodes()[0].childNodes()

				return Promise.all(configs.map(function (config) {
					// get xmlns and grep by ':' and '/' and add folder + name + '.xml'
					namespace = config.namespace().href().split(/[:,\/]+/).pop()

					// create file location
					file = folder + namespace + '.xml'

					// save to folder
					fs.writeFileSync(file, config.toString());
				}))

			})
			.then(function (resolve, reject) {
				process.exit()
			})
			.catch(function (err) {
				console.error('ERROR: ', err);
			});
		})
	})
}

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		folder = process.argv[index]
	else if (index == 3)
		target = process.argv[index]
})

if (folder && target) download_configs(folder, target)
