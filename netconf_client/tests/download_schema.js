/*
 * Copyright (C) 2016 Cisco Systems, Inc.
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

function download_schema(folder, xml){
	var xmlDoc = libxmljs.parseXml(xml);
	var format = xmlDoc.get('/schema/format').childNodes()
	if (format == 'yang') {
		var netconf_client = require('../netconf_client')
		var request = '' +
		'<get-schema xmlns="urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring">' +
		'<identifier>' + xmlDoc.get('/schema/identifier').childNodes().toString() + '</identifier>' +
		'<version>' + xmlDoc.get('/schema/version').childNodes().toString() + '</version>' +
		'<format>' + xmlDoc.get('/schema/format').childNodes().toString() + '</format>' +
		'</get-schema>'
		netconf_client.create(config).then(function(client) {
			client.send(request).thenDefault(function(reply) {
				client.send_close().then(function (resolve,request) {
					var file = folder +
					'/' +
					xmlDoc.get('/schema/identifier').childNodes().toString() +
					'@' +
					xmlDoc.get('/schema/version').childNodes().toString() +
					'.yang'
					reply = reply.replace(/\n<!\[CDATA\[\n/, '')
					reply = reply.replace(/\n\]\]>\n/, '')
					fs.writeFileSync(file, reply);
					process.exit()
				}).catch(function (err) {
					console.error('ERROR: ', err);
				});
			})
		})
	} else {
		process.exit(0)
	}
}

var folder
var xml

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		folder = process.argv[index]
	else if (index == 3)
		xml = process.argv[index]
})

if (folder && xml) download_schema(folder, xml)
