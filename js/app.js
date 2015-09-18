var loraserialhostApp = angular.module("loraserialhostApp", []);

loraserialhostApp.controller("MainCtrl", function ($scope) {
	$scope.title = "LoRa Serial Host";
	$scope.log = "";
	$scope.disconnectStyle = {
		"display": "none"
	};

	$scope.closeApp = function() {
		window.close();
	};

	$scope.refreshPorts = function() {
		chrome.serial.getDevices(function (devices) {
			$scope.ports = [];
			for (var i = 0; i < devices.length; i++) {
				$scope.ports.push(devices[i].path);
			}
		});
	};
	$scope.refreshPorts();

	$scope.connect = function(port) {
		$scope.usePort = port;
		chrome.serial.connect(port, {
			bitrate: 9600,
			receiveTimeout: 5000,
			sendTimeout: 1000
		}, function(info) {
			$scope.connectionId = info.connectionId;
		});
		$scope.log = "Connected to " + $scope.usePort + "\n";
		$scope.disconnectStyle = {
			"display": "block"
		};

		chrome.serial.onReceive.addListener(function (info) {
			var decoder = new TextDecoder();
			$scope.log += decoder.decode(info.data);
		});
	};

	$scope.disconnect = function() {
		chrome.serial.disconnect($scope.connectionId, function(result) {
			if (result === true) {
				$scope.log += "Disconnected";
			}
		});
		$scope.disconnectStyle = {
			"display": "none"
		};
	};
});
