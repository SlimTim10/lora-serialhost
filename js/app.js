var loraserialhostApp = angular.module("loraserialhostApp", []);

loraserialhostApp.controller("MainCtrl", function($scope) {
	var decoder = new TextDecoder();
	var encoder = new TextEncoder();
	var logArea = document.getElementById("log-area");

	var init = function() {
		$scope.title = "LoRa Serial Host";
		$scope.data = "";
		$scope.log = "";
		$scope.isConnected = false;

		$scope.readBtn = {
			text: "Read",
			styleClass: "btn-default",
			func: $scope.readContinuous
		};

		$scope.options = {
			baud: "9600",
			receiveTimeout: "5000",
			sendTimeout: "1000"
		};
	};

	// Automatic scrolling in log area
	$scope.$watch("log", function() {
		logArea.scrollTop = logArea.scrollHeight;
	});

	$scope.closeApp = function() {
		// Disconnect all open connections before closing
		chrome.serial.getConnections(function(infoArray) {
			$scope.$apply(function() {
				$scope.log = "";
				var safeExit = true;
				for (var i = 0; i < infoArray.length; i++) {
					chrome.serial.disconnect(infoArray[i].connectionId, function(result) {
						$scope.$apply(function() {
							if (result === false) {
								$scope.log += "Error disconnecting from ID " + info.connectionId;
								safeExit = false;
							}
						});
					});
				}
				if (safeExit === true) {
					window.close();
				}
			});
		});
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
			bitrate: parseInt($scope.options.baud, 10),
			receiveTimeout: parseInt($scope.options.receiveTimeout, 10),
			sendTimeout: parseInt($scope.options.sendTimeout, 10),
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

	var portReadContinuous = function(info) {
		$scope.$apply(function() {
			$scope.log += decoder.decode(info.data);
		});
	};

	$scope.readContinuous = function() {
		chrome.serial.onReceive.removeListener(portReadContinuous);
		if ($scope.isConnected === true) {
			chrome.serial.onReceive.addListener(portReadContinuous);
			$scope.readBtn.text = "Stop";
			$scope.readBtn.styleClass = "btn-danger";
			$scope.readBtn.func = $scope.readStop;
		}
	};

	var portReadLines = function(info) {
		$scope.$apply(function() {
			$scope.data += decoder.decode(info.data);
			if ($scope.data.split("\n").length >= $scope.nlines) {
				chrome.serial.onReceive.removeListener(portReadLines);
				$scope.log += $scope.data;
			}
		});
	};

	$scope.readLines = function(nlines) {
		$scope.nlines = nlines;
		$scope.data = "";
		chrome.serial.onReceive.removeListener(portReadLines);
		if ($scope.isConnected === true) {
			chrome.serial.onReceive.addListener(portReadLines);
		}
	};

	$scope.readStop = function() {
		chrome.serial.onReceive.removeListener(portReadContinuous);
		$scope.readBtn.text = "Read";
		$scope.readBtn.styleClass = "btn-default";
		$scope.readBtn.func = $scope.readContinuous;
	};

	$scope.sendMsg = function(msg) {
		if ($scope.isConnected === true) {
			msg += "\n";
			var data = encoder.encode(msg).buffer;
			chrome.serial.send($scope.connectionId, data, function(info) {
				$scope.$apply(function() {
					$scope.log += info.bytesSent + " bytes sent\n";
				});
			});
		}
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

	init();
});
