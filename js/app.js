var loraserialhostApp = angular.module("loraserialhostApp", []);

loraserialhostApp.controller("MainCtrl", function($scope) {
	$scope.title = "LoRa Serial Host";
	$scope.log = "";
	$scope.disconnectStyle = {
		"display": "none"
	};
	var decoder = new TextDecoder();
	var logArea = document.getElementById("log-area");

	$scope.closeApp = function() {
		window.close();
	};

	$scope.refreshPorts = function() {
		chrome.serial.getDevices(function(devices) {
			$scope.$apply(function() {
				$scope.ports = [];
				for (var i = 0; i < devices.length; i++) {
					$scope.ports.push(devices[i].path);
				}
			});
		});
	};
	$scope.refreshPorts();

	var readPort = function(info) {
		$scope.$apply(function() {
			$scope.log += decoder.decode(info.data);
			logArea.scrollTop = logArea.scrollHeight;
		});
	};

	$scope.connect = function(port) {
		chrome.serial.onReceive.removeListener(readPort);
		$scope.usePort = port;
		chrome.serial.connect(port, {
			bitrate: 9600,
			receiveTimeout: 5000,
			sendTimeout: 1000
		}, function(info) {
			$scope.$apply(function() {
				$scope.connectionId = info.connectionId;
			});
		});
		$scope.log = "Connected to " + $scope.usePort + "\n\n";
		$scope.disconnectStyle = {
			"display": "block"
		};

		chrome.serial.onReceive.addListener(readPort);
	};

	$scope.disconnect = function() {
		chrome.serial.disconnect($scope.connectionId, function(result) {
			$scope.$apply(function() {
				if (result === true) {
					$scope.log += "\nDisconnected";
					$scope.disconnectStyle = {
						"display": "none"
					};
				} else {
					$scope.log += "Error disconnecting";
				}
			});
		});
	};
});
