/*
    responsible for running the game (e.g. deciding when the game has ended)
    and for visualizing the current status of the universe
 */

(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// ---------------------------------------------------------------------------------------------------------------------------------

// TODO add ranking
// TODO create canvas ids here
PlanetWarsGame: function PlanetWarsGame(neutralPlanetCount, width, height, backgroundCanvasId, foregroundCanvasId, textCanvasId) {
    this.simulator = new Worker("simulator.js");

    this.simulator.onmessage = function(oEvent) {
        var action = oEvent.data.action;
        var status = oEvent.data.status;
        var message = oEvent.data.message;

        if (status === "error") {
            console.log(message);
        } else {
            if (action === "getState") {
                this.nextState = message;
                this.lastStepped = new Date().getTime();
            }

            if (action === "start") {
                this.nextState = message;
                this.currentState = this.nextState;
                this.drawGame();
            }
        }
    }.bind(this);

    this.simulator.postMessage(
        {
            "action": "start",
            "neutralPlanetCount": neutralPlanetCount,
            "width": width,
            "height": height
        }
    );

    this.round = 0;
    this.simulator.postMessage({"action": "getState"});

    this.lastStepped = 0;
    this.lastStepFinished = true;

    this.foregroundCanvasId = foregroundCanvasId;
    this.foregroundCanvas = document.getElementById(this.foregroundCanvasId);
    this.backgroundCanvasId = backgroundCanvasId;
    this.backgroundCanvas = document.getElementById(this.backgroundCanvasId);
    this.textCanvasId = textCanvasId;
    this.textCanvas = document.getElementById(this.textCanvasId);

    this.width = width;
    this.height = height;
    $("#" + foregroundCanvasId).attr("width", this.width);
    $("#" + foregroundCanvasId).attr("height", this.height);
    $("#" + backgroundCanvasId).attr("width", this.width);
    $("#" + backgroundCanvasId).attr("height", this.height);
    $("#" + textCanvasId).attr("width", this.width);
    $("#" + textCanvasId).attr("height", this.height);

    var textContext = this.textCanvas.getContext("2d");
    textContext.fillStyle = "white";
    textContext.strokeStyle = "black";
    textContext.font = "10pt sans-serif";
    textContext.textBaseline = "middle";
    textContext.lineWidth = 2;

    var context = this.backgroundCanvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, this.width, this.height);
};

// TODO add ranking refresh
// TODO visualize winner
PlanetWarsGame.prototype.drawGame = function drawGame() {
    var exportedFleets = this.currentState.fleets;
    var exportedPlanets = this.currentState.planets;

    /* I'd like to keep the planets on the background and draw over them when the owner changes
     * instead of clearing and redrawing, but it doesn't seem possible with antialiasing, which cannot be deactivated
     */
    var foregroundContext = this.foregroundCanvas.getContext("2d");
    // fastest according to jsperf test
    // for Firefox 24.0 on Ubuntu and Chrome 28.0.1500.71 on Ubuntu Chromium
    foregroundContext.clearRect(0, 0, this.foregroundCanvas.width, this.foregroundCanvas.height);

    // to avoid canvas state changes, loop by color, i.e. by player
    for (var color in exportedPlanets) {
        var planets = exportedPlanets[color];
        foregroundContext.fillStyle = color;

        for (var j = 0; j < planets.length; j++) {
            var planet = planets[j];
            var centerX = planet.x;
            var centerY = planet.y;
            var radius = planet.radius;

            foregroundContext.beginPath();
            foregroundContext.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            foregroundContext.fill();
        }
    }

    for (var color in exportedFleets) {
        var fleets = exportedFleets[color];
        foregroundContext.strokeStyle = color;

        for (var j = 0; j < fleets.length; j++) {
            var fleet = fleets[j];
            var currentX = fleet.x;
            var currentY = fleet.y;

            var backRightX = fleet.backRightX;
            var backRightY = fleet.backRightY;

            var backLeftX = fleet.backLeftX;
            var backLeftY = fleet.backLeftY;

            foregroundContext.beginPath();
            foregroundContext.moveTo(currentX, currentY);
            foregroundContext.lineTo(backLeftX, backLeftY);
            foregroundContext.lineTo(backRightX, backRightY);
            foregroundContext.lineTo(currentX, currentY);
            // without this repetition there would be sth. missing from one tip of the triangle, it wouldn't be pointy
            foregroundContext.lineTo(backLeftX, backLeftY);
            foregroundContext.stroke();
        }
    }

    var textContext = this.textCanvas.getContext("2d");
    textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);

    for (var color in exportedPlanets) {
        var planets = exportedPlanets[color];
        for (var i = 0; i < planets.length; i++) {
            var planet = planets[i];
            textContext.strokeText("" + planet.forces, planet.x, planet.y);
            textContext.fillText("" + planet.forces, planet.x, planet.y);
        }
    }
};

PlanetWarsGame.prototype.stepInterval = 40;
PlanetWarsGame.prototype.running = false;
PlanetWarsGame.prototype.maxRounds = 2000;

PlanetWarsGame.prototype.step = function step(timestamp) {

    var activePlayersCount = this.currentState.activePlayersCount;
    if (activePlayersCount > 1 && this.round < this.maxRounds) {

        if (this.currentState !== this.nextState) {
            this.currentState = this.nextState;
            this.round += 1;
            this.drawGame();
        }

        var now = new Date().getTime();
        if (now - this.lastStepped > this.stepInterval) {
            this.simulator.postMessage({"action": "getState"});
        }
        requestAnimationFrame(this.step.bind(this));

    } else {

        this.drawGame();
        this.running = false;

    }
};

PlanetWarsGame.prototype.play = function play() {
    this.round = 0;
    this.running = true;
    window.requestAnimationFrame(this.step.bind(this));
};