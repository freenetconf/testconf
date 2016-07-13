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

var netconf_client = require('../netconf_client')
var util = require('util')
var libxmljs = require("libxmljs");
var pd = require('pretty-data').pd;
var config = require('../../core/config')
var yang = require("libyang")

var nodeid = '/'
var xml_xpath = ''

config.show_logs = false


process.argv.forEach(function (val, index, array) {
	if (index == 2)
		xpath = process.argv[index]
});

//TODO running hard coded
var left_xml = '<get-config><source><running/></source><filter>'
var right_xml = '</filter></get-config>'

// get namespace

var ctx = yang.ly_ctx_new(config.remote_yang_dir)
var fs = require('fs');
var files = fs.readdirSync(config.remote_yang_dir);

for (var i in files) {
	mod = yang.lys_parse_path(ctx, config.remote_yang_dir + files[i], yang.LYS_IN_YANG);
}

nodes = xpath.split("\/")

nodes.forEach(function(element) {
	if (element == '') return
	keys = element.split(/[\[,\]]+/)
	if (keys.length == 1) {
		nodeid += element
		node = element.split(":")
		if (node.length > 1) {
			result = yang.ly_ctx_get_node(ctx, null, nodeid)
			left_xml = left_xml + '<' + node[1]  + ' xmlns="' + result.module.ns + '">'
			right_xml = '</' + node[1] + '>' + right_xml
			xml_xpath += node[1]
		} else {
			left_xml = left_xml + '<' + element + '>'
			right_xml = '</' + element + '>' + right_xml
			xml_xpath += element
		}
		nodeid += '/'
		xml_xpath += '/'
	} else if (keys.length > 1 ) {
		left_xml = left_xml + '<' + keys[0] + '>'
		key = keys[1].split(/[=,\']+/)
		left_xml = left_xml + '<' + key[0] + '>' + key[1] + '</' + key[0] + '>'
		right_xml = '</' + keys[0] + '>' + right_xml
		nodeid += keys[0] + '/'
		xml_xpath += keys[0] + '/'
	}
})

xml = left_xml + right_xml

netconf_client.create().then(function(client)
{
	client.send(xml).thenDefault(function(reply)
	{
		client.send_close().then(function (resolve, reject) {

		// remove xmlns, TODO parse with xmlns
		xml = reply.replace(/\sxmlns[^"]+"[^"]+"/g, '')

		var xmlDoc = libxmljs.parseXml(xml);

                xml_xpath = "/rpc-reply/data/" + xml_xpath
		xml_xpath = xml_xpath.substring(0, (xml_xpath.length - 1))

		var gchild = xmlDoc.get(xml_xpath)

                xml_pp = pd.xml(gchild.childNodes().toString());
		process.stdout.write(xml_pp)

		}).then(function (resolve, reject) {
			process.exit(0)
		}).catch(function (err) {
			console.error('ERROR: ', err);
		})
	})
})
