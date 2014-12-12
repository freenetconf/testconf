#
# Copyright (C) 2014 Cisco Systems, Inc.
#
# Author: Luka Perkov <luka.perkov@sartura.hr>
# Author: Petar Koretic <petar.koretic@sartura.hr>
#
# testconf is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
#
# You should have received a copy of the GNU General Public License
# along with testconf. If not, see <http://www.gnu.org/licenses/>.
#

all: test-all

test-all: \
	test-generic \
	test-syslog \
	test-opencpe

test-generic:
	node generic_hello.js
	node generic_rpc_get.js

test-syslog:
	node syslog_rpc_edit_config.js
	node syslog_rpc_get.js

test-opencpe:
	node opencpe_firmware_download.js

test-freenetconfd-plugins-example: \
	test-freenetconfd-plugins-example-black_book \
	test-freenetconfd-plugins-example-house_lockdown \
	test-freenetconfd-plugins-example-sandwich \
	test-freenetconfd-plugins-example-shopping_list

test-freenetconfd-plugins-example-black_book:
	node freenetconfd-plugins/examples/black_book_edit_config_delete.js
	node freenetconfd-plugins/examples/black_book_edit_config.js
	node freenetconfd-plugins/examples/black_book_get.js

test-freenetconfd-plugins-example-house_lockdown:
	node freenetconfd-plugins/examples/house_lockdown_rpc.js

test-freenetconfd-plugins-example-sandwich:
	node freenetconfd-plugins/examples/sandwich_edit_config_delete.js
	node freenetconfd-plugins/examples/sandwich_edit_config.js
	node freenetconfd-plugins/examples/sandwich_get.js

test-freenetconfd-plugins-example-shopping_list:
	node freenetconfd-plugins/examples/shopping_list_edit_config.js
	node freenetconfd-plugins/examples/shopping_list_get.js
