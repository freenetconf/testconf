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

var netconf_client = require('../netconf_client')
var util = require('util')
var libxmljs = require("libxmljs");
var pd = require('pretty-data').pd;
var config = require('../../core/config')
var yang = require("libyang")

yang_dir = __dirname + "/../../server_yang/"
config.show_logs = false

var yang_import_path = "../../ietf-yangs"
var yang_module_name

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		xpath = process.argv[index]
	else if (index == 3)
		value = process.argv[index]
});

//TODO running hard coded
var left_xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
                "<target><running/></target>" +
		"<config>"
var right_xml = '</config>' +
		'</edit-config>'

// remove yang namespace
xpath = xpath.split(":")
namespace = xpath[0].slice(1)
xpath = xpath.pop()

// get namespace

var ctx = yang.ly_ctx_new(yang_dir)
var fs = require('fs');
var files = fs.readdirSync(yang_dir);

for (var i in files) {
	mod = yang.lys_parse_path(ctx, yang_dir + files[i], yang.LYS_IN_YANG);
	if (namespace == mod.name)
		namespace = mod.ns
}

nodes = xpath.split("\/")

var i = 0

nodes.forEach(function(element) {
	i++
	keys = element.split(/[\[,\]]+/)
	if (keys.length == 1) {
		left_xml = left_xml + '<' + element + ' xmlns="' + namespace + '">'
		if (i < nodes.length)
			right_xml = '</' + element + '>' + right_xml
		else
			right_xml = value + '</' + element + '>' + right_xml
	} else if (keys.length > 1 ) {
		left_xml = left_xml + '<' + keys[0] + '>'
		key = keys[1].split(/[=,\']+/)
		left_xml = left_xml + '<' + key[0] + '>' + key[1] + '</' + key[0] + '>'
		right_xml = '</' + keys[0] + '>' + right_xml

	}
})

xml = left_xml + right_xml

netconf_client.create().then(function(client)
{
	client.send(xml).thenDefault(function(reply)
	{
		client.send_close().then(function (resolve, reject) {

		}).then(function (resolve, reject) {
			process.exit(0)
		}).catch(function (err) {
			console.error('ERROR: ', err);
		})
	})
})
