/*
 * Copyright (C) 2014 Cisco Systems, Inc.
 *
 * Author: Petar Koretic <petar.koretic@sartura.hr>
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

var config = {}
module.exports = config

config.yang_dir = __dirname + "/../yang/"
config.keys_dir = __dirname + "/../keys/"
config.server_methods_dir = __dirname + "/../netconf_server/methods/"

config.netconf = {}
config.netconf.host = '127.0.0.1'
config.netconf.port = 1830
config.netconf.user = 'admin'
config.netconf.pass = 'admin'

config.default_log_file = "/tmp/testconf.log"

config.server = {}
config.server.log_name = __dirname + "/../logs/server.log"

config.client = {}
config.client.log_name = __dirname + "/../logs/client.log"
