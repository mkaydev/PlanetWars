Planet: function Planet(planetState, universe) {
    this._universe = universe;
    this._setState(planetState);
};

Planet.prototype._setState = function _setState(planetState) {
    this._state = planetState;
};

Planet.prototype.getOwner = function getOwner() {
    return this._universe._getPlayer(this._state[_STATE_KEYS["ownerId"]]);
};

Planet.prototype.getX = function getX() {
    return this._state[_STATE_KEYS["x"]];
};

Planet.prototype.getY = function getY() {
    return this._state[_STATE_KEYS["y"]];
};

Planet.prototype.getId = function getId() {
    return this._state[_STATE_KEYS["id"]];
};

Planet.prototype.getForces = function getForces() {
    return this._state[_STATE_KEYS["forces"]];
};

Planet.prototype.getRecruitingPerStep = function getRecruitingPerStep() {
    return this._state[_STATE_KEYS["recruitingPerStep"]];
};

Planet.prototype._setForces = function _setForces(forces) {
    this._state[_STATE_KEYS["forces"]] = forces;
};

Planet.prototype.equals = function equals(otherPlanet) {
    return this.getId() === otherPlanet.getId();
};

Planet.prototype.ownerEquals = function ownerEquals(player) {
    return this.getOwner().equals(player);
};

Planet.prototype.distanceTo = function distanceTo(otherPlanet) {
    return this.distanceToCoords(otherPlanet.getX(), otherPlanet.getY());
};

Planet.prototype.distanceToCoords = function distanceToCoords(x, y) {
    var yDiff,
        xDiff,
        distance,
        planetX = this.getX(),
        planetY = this.getY();

    if (y > planetY) {
        yDiff = y - planetY;
    } else {
        yDiff = planetY - y;
    }

    if (x > planetX) {
        xDiff = x - planetX;
    } else {
        xDiff = planetX - x;
    }

    distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return distance;
};

Planet.prototype.fleetStepsTo = function fleetStepsTo(otherPlanet) {
    var distance = this.distanceTo(otherPlanet);
    return Math.floor(distance / this._universe.fleetMovementPerStep) + 1;
};

Planet.prototype.getTargetingFleets = function getTargetingFleets() {
    var i,
        fl,
        fleets =  this._universe.getAllFleets(),
        targetingFleets = [];

    for (i = 0; fl = fleets[i]; ++i) {
        if (fl.getDestination().equals(this)) targetingFleets.push(fl);
    }
    return targetingFleets;
};

Planet.prototype.getAttackingFleets = function getAttackingFleets() {
    var i,
        fl,
        enemyFleets =  this._universe.getEnemyFleets(this.getOwner()),
        attackingFleets = [];

    for (i = 0; fl = enemyFleets[i]; ++i) {
        if (fl.getDestination().equals(this)) attackingFleets.push(fl);
    }
    return attackingFleets;
};

Planet.prototype.getDefendingFleets = function getDefendingFleets() {
    var i,
        fl,
        myFleets = this._universe.getFleets(this.getOwner()),
        defendingFleets = [];

    for (i = 0; fl = myFleets[i]; ++i) {
        if (fl.getDestination().equals(this)) defendingFleets.push(fl);
    }
    return defendingFleets;
};

Planet.prototype.isNeutral = function isNeutral() {
    return this.getOwner().isNeutral;
};

Planet.prototype.sendFleet = function sendFleet(destination, forces) {
    var planetForces = this.getForces();
    forces = Math.floor(forces);

    if (forces > planetForces) forces = planetForces;
    if (forces <= 0) return;

    this._setForces(planetForces - forces);
    this._universe.registerFleet(this.getId(), destination.getId(), forces);
    return forces;
};