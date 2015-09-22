var loraserialhostApp = angular.module("loraserialhostApp", []);

loraserialhostApp.controller("MainCtrl", function($scope) {
	$scope.title = "LoRa Serial Host";
	$scope.data = "";
	$scope.log = "";
	$scope.isConnected = false;
	var decoder = new TextDecoder();
	var logArea = document.getElementById("log-area");

	// Automatic scrolling in log area
	$scope.$watch("log", function() {
		logArea.scrollTop = logArea.scrollHeight;
	});

	$scope.closeApp = function() {
		window.close();
	};

	$scope.refreshPorts = function() {
		chrome.serial.getDevices(function(devices) {
			$scope.$apply(function() {
				$scope.ports = [];
				for (var i = 0; i < devices.length; i++) {
					$scope.ports.push({
						id: i,
						name: devices[i].path,
						active: false,
						hidden: false
					});
				}
			});
		});
	};
	$scope.refreshPorts();

	var hideConnectBtns = function() {
		$scope.ports.forEach(function(item, index) {
			$scope.ports[index].hidden = true;
		});
	};

	var showConnectBtns = function() {
		$scope.ports.forEach(function(item, index) {
			$scope.ports[index].hidden = false;
		});
	};

	$scope.connect = function(port) {
		$scope.portName = port.name;
		chrome.serial.connect($scope.portName, {
			bitrate: 9600,
			receiveTimeout: 5000,
			sendTimeout: 1000
		}, function(info) {
			$scope.$apply(function() {
				if (info === undefined) {
					$scope.log = "Error connecting";
					return;
				}
				$scope.connectionId = info.connectionId;
				$scope.log = "Connected to " + $scope.portName + "\n\n";
				port.active = true;
				$scope.isConnected = true;
				hideConnectBtns();
			});
		});
	};

	var readPort = function(info) {
		$scope.$apply(function() {
			$scope.log += decoder.decode(info.data);
		});
	};

	$scope.readContinuous = function() {
		chrome.serial.onReceive.removeListener(readPort);
		if ($scope.isConnected === true) {
			chrome.serial.onReceive.addListener(readPort);
		}
	};

	var readPortLines = function(info) {
		$scope.$apply(function() {
			$scope.data += decoder.decode(info.data);
			if ($scope.data.split("\n").length >= $scope.nlines) {
				chrome.serial.onReceive.removeListener(readPortLines);
				$scope.log += $scope.data;
			}
		});
	};

	$scope.readLines = function(nlines) {
		$scope.nlines = nlines;
		$scope.data = "";
		chrome.serial.onReceive.removeListener(readPortLines);
		if ($scope.isConnected === true) {
			chrome.serial.onReceive.addListener(readPortLines);
		}
	};

	$scope.readStop = function() {
		chrome.serial.onReceive.removeListener(readPort);
	};

	$scope.disconnect = function(port) {
		chrome.serial.disconnect($scope.connectionId, function(result) {
			$scope.$apply(function() {
				if (result === true) {
					$scope.log += "\nDisconnected";
					port.active = false;
					$scope.isConnected = false;
					showConnectBtns();
				} else {
					$scope.log += "Error disconnecting";
				}
			});
		});
	};
});
