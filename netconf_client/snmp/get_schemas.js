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

var yang_list = '' +
'<get>' +
	'<filter type="subtree">' +
		'<netconf-state xmlns="urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring">' +
			'<schemas/>' +
		'</netconf-state>' +
	'</filter>' +
'</get>'


function get_schema_list(){
	var netconf_client = require('../netconf_client')
	netconf_client.create(config).then(function(client) {
		client.send(yang_list).thenDefault(function(reply) {
			// remove xmlns, TODO parse with xmlns
			xml = reply.replace(/\sxmlns[^"]+"[^"]+"/g, '')
			var xmlDoc = libxmljs.parseXml(reply)

			Schemas = xmlDoc.childNodes()[0].childNodes()[0].childNodes()

			client.send_close().then(function (resolve,request) {
				console.log(Schemas.toString())
				process.exit()
			})
		})
	})
}

get_schema_list()
