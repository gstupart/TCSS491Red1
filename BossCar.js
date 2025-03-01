class BossCar extends AICar {

    /**
     * Create a player entity.
     * 
     * @param {GameEngine} game The game engine.
     * @param {number} x The x-coordinate of the upper-left corner of the player.
     * @param {number} y The y-coordinate of the upper-left corner of the player.
     * @param {WaypointArray} waypoints The array of the waypoints for this AI.
     */
    constructor(game, x, y, waypoints, enemies) {
        super(game, x, y, "Final Boss", waypoints);
        // Asset management
        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/boss-sheet.png");
        if (!this.spritesheet) throw new Error("Missing boss sprite sheet");
        
        // Phase configuration
        this.PHASE_CONFIG = {
            THRESHOLDS: [0.7, 0.4, 0.1],
            WEAPONS: {
                1: MissileType.MAVERICK,
                2: MissileType.STORM_SHADOW,
                3: MissileType.TORPEDO
            },
            STAT_MODIFIERS: {
                2: { fireRate: 1.5, speed: 1.2, damageMultiplier: 1.2 },
                3: { fireRate: 2.0, speed: 1.5, damageMultiplier: 1.5 }
            }
        };

        // Animation setup
        this.animations = this.createAnimations();
        this.currentAnimation = this.animations.phase1;
        this.scale = 1.5;
        this.stillAnimation = this.animations.phase1;

        // Combat stats
        this.maxHealth = 1000;
        this.health = this.maxHealth;
        this.currentPhase = 1;
        
        // Systems
        this.ai = new BossAI(this);
        this.weapons = this.createPhaseWeapons();
        this.equipWeapon(1);

        // Bounding Box Setup
        /** Expected width of the player. */
        this.width = 80;

        /** Expected height of the player. */
        this.height = 105;
    }

    createAnimations() {
        return {
            //phase1: new Animator(ASSET_MANAGER.getAsset("./sprites/boss-phase1.png"), startX, startY, frameWidth, frameHeight, frameCount, frameDuration, padding, true, false),
            // phase1: new Animator(this.spritesheet, 20, 1020, 435, 435, 2, 0.45, 20, false, true),
            // phase2: new Animator(this.spritesheet, 20, 1020, 435, 435, 2, 0.45, 20, false, true),
            // phase3: new Animator(this.spritesheet, 20, 1020, 435, 435, 2, 0.45, 20, false, true)
            phase1: new Animator(this.spritesheet, 18, 18, 52, 88, 1, 0.45, 20, false, true),
            phase2: new Animator(this.spritesheet, 72, 11, 52, 88, 1, 0.45, 20, false, true),
            phase3: new Animator(this.spritesheet, 133, 17, 75, 88, 1, 0.45, 20, false, true)
        };
    }

    createPhaseWeapons() {
        return {
            1: new MissileWeapon(this.game, this, this.PHASE_CONFIG.WEAPONS[1]),
            2: new MissileWeapon(this.game, this, this.PHASE_CONFIG.WEAPONS[2]),
            3: new MissileWeapon(this.game, this, {
                ...this.PHASE_CONFIG.WEAPONS[3],
                damage: this.PHASE_CONFIG.WEAPONS[3].damage * 
                        this.PHASE_CONFIG.STAT_MODIFIERS[3].damageMultiplier
            })
        };
    }

    equipWeapon(phase) {
        this.primaryWeapon = this.weapons[phase];
        console.log(this.primaryWeapon);
        this.primaryWeapon.fireRate *= this.PHASE_CONFIG.STAT_MODIFIERS[phase]?.fireRate || 1;
        this.game.addEntity(this.primaryWeapon);
    }

    update() {
        if (this.health <= 0) {     // Check if the player is dead
            this.running = false;
        }
        if (this.running) {
            this.updateVelocity();
            this.updateSpeedLevel();
            this.updateState();
            this.updateDegree();
            this.updatePosition();
            super.updateBB();
            if (this.enemies.length !== 0) {
                this.updateFiringSolution();
                this.updateWeaponDegree();
            }
        }
        this.ai.update(this.centerX, this.centerY, this.targetX, this.targetY);
        this.currentAnimation = this.animations[`phase${this.currentPhase}`];
        this.stillAnimation = this.currentAnimation;
        
        //New. if the boss's bounding box collides with the finish line, end the game by killing the player.
        if (this.game.finishLine && this.BB.collide(this.game.finishLine.BB)) {
            this.game.player.health = 0;
            this.game.player.running = false;
            this.game.player.xVelocity = 0;
            this.game.player.yVelocity = 0;
            this.game.camera.sceneType = 3;
        }
        
        if (this.finished) {
            this.game.camera.sceneType = 3;
        }
    }

    draw(ctx) {
        // draws the boss car animation
        if (this.running && this.power != 0) {
            this.currentAnimation.drawFrame(
                this.game.clockTick,
                ctx,
                this.x - this.game.camera.x,
                this.y - this.game.camera.y,
                this.scale,
                this.degree,
                this.label
            );
        } else {
            this.stillAnimation.drawFrame(
                this.game.clockTick,
                ctx,
                this.x - this.game.camera.x,
                this.y - this.game.camera.y,
                this.scale,
                this.degree,
                this.label
            );
        }
    
        // draws the health bar centered above the boss car
        const barWidth = 120;
        const barHeight = 8;
        //const barX = this.x - 60 - this.game.camera.x;
        //const barY = this.y - 80 - this.game.camera.y;

        // centers the bar horizontally relative to the boss car
        const barX = this.x + (this.width - barWidth) / 2 - this.game.camera.x;
        // positions the bar 5 pixels above the boss car
        const barY = this.y - barHeight - 5 - this.game.camera.y;

        ctx.fillStyle = 'rgba(255,0,0,0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = 'rgba(0,255,0,0.7)';
        ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
    }
    
}