import {
  BOSS_CONF,
  GET_BOSS_ATTACK_PREP_SPRITE,
  GET_BOSS_ATTACK_SPRITE,
  GET_BOSS_DIE_SPRITE,
  GET_BOSS_GHOST_SPRITE,
  GET_BOSS_IDLE_SPRITE,
  GET_BOSS_JUMP_SPRITE,
  GET_BOSS_LAND_SPRITE,
  GET_BOSS_STUN_SPRITE,
} from "../facade/file.js";
import { isInTheLeft } from "../facade/helper.js";
import { GAME } from "../game.js";
import { Character } from "../parent/character.js";
import { Enemy } from "../parent/enemies.js";
import { Object } from "../parent/object.js";
import { Setting } from "../setting.js";
import { Ghost } from "./ghost.js";

export class Boss extends Enemy {
  static IDLE = 1;
  static ATTACK_PREP = 2;
  static ATTACK = 3;
  static JUMP = 4;
  static LAND = 5;
  static DEATH = 6;
  static STUN = 7;

  constructor(x, y, w, h) {
    const sprite = GET_BOSS_IDLE_SPRITE();
    const config = BOSS_CONF.idle;
    super(x, y, w, h, sprite, config);
    super.maxSpeed = Setting.BOSS_MAX_SPEED;
    this.attackTimes = 0;
    this.attacked = false;
    this.armor = Setting.BOSS_ARMOR;
    this.state = Boss.IDLE;
    this.health = Setting.BOSS_HEALTH;

    // Debugging Purpose
    window.addEventListener("keypress", (e) => {
      if (e.key == "r") {
        this.attack();
      }
      if (e.key == "t") {
        this.jump();
      }
      if (e.key == "y") {
        this.die();
      }
    });
    this.jumping = false;
  }

  landing() {
    this.jumping = false;
    this.changeState(Boss.LAND);
    this.game.shakeScene(1);
  }

  checkLanding() {
    if (this.jumping) {
      // Check already landing
      if (this.vy == 0) {
        // Already Landing
        this.landing();
      }
    }
  }

  checkOffset() {
    if (!this.backward) {
      super.offsetX = 210;
      super.offsetY = 100;
      super.offsetW = -300;
      super.offsetH = -130;
    } else {
      super.offsetX = 50;
      super.offsetY = 100;
      super.offsetW = -300;
      super.offsetH = -130;
    }
  }

  getTempNode() {
    const temp = this.tempNode;
    this.tempNode = null;
    return temp;
  }

  setTemp(x, y, w, h) {
    this.tempNode = { x, y, w, h };
  }

  setCurrentTemp() {
    this.setTemp(this.x, this.y, this.w, this.h);
  }

  setPosToNode(node) {
    this.x = node.x;
    this.y = node.y;
    this.w = node.w;
    this.h = node.h;
  }

  ghostDie() {
    this.lookAtPlayer();
    Ghost.Generate(this.backward, this.x, this.y, this.w);
  }

  setDefaultSize() {
    const node = this.getTempNode();
    if (node) {
      this.setPosToNode(node);
    } else {
      this.w = Setting.BOSS_WIDTH;
      this.h = Setting.BOSS_HEIGHT;
      this.y = Setting.BOSS_INITIAL_Y;
    }
  }

  checkBound() {
    if (this.x <= 0) {
      this.x = 0;
    } else if (this.x + this.w >= this.game.width) {
      this.x = this.game.width - this.w;
    }
  }

  improvePos(offsetX) {
    const node = this.getTempNode();
    if (node) {
      this.setPosToNode(node);
    } else {
      this.w = Setting.BOSS_WIDTH;
      this.h = Setting.BOSS_HEIGHT;
      this.y = Setting.BOSS_INITIAL_Y;
    }

    if (this.backward) {
      this.x += offsetX;
    } else {
      this.x -= offsetX;
    }
  }

  improveSize(offsetX, offsetY) {
    this.setCurrentTemp();
    this.offset = offsetX;
    console.log("backward : ", this.backward);
    if (this.backward) {
      this.x += -offsetX - 70;
    } else {
      this.x += offsetX + 70;
    }
    this.y -= offsetY;
    this.w = Setting.BOSS_WIDTH + offsetX;
    this.h = Setting.BOSS_HEIGHT + offsetY;
  }

  changeState(state) {
    if (this.state) this.spriteIdx = 0;
    switch (state) {
      case Boss.IDLE:
        this.sprite = GET_BOSS_IDLE_SPRITE();
        this.config = BOSS_CONF.idle;
        this.setDefaultSize();
        break;
      case Boss.ATTACK_PREP:
        this.sprite = GET_BOSS_ATTACK_PREP_SPRITE();
        this.config = BOSS_CONF.attack_prep;
        this.improvePos(130);
        break;
      case Boss.ATTACK:
        this.sprite = GET_BOSS_ATTACK_SPRITE();
        this.config = BOSS_CONF.attack;
        this.improveSize(50, 100);
        break;
      case Boss.JUMP:
        this.sprite = GET_BOSS_JUMP_SPRITE();
        this.config = BOSS_CONF.jump;
        this.setDefaultSize();
        break;
      case Boss.LAND:
        this.sprite = GET_BOSS_LAND_SPRITE();
        this.config = BOSS_CONF.land;
        this.setDefaultSize();
        break;
      case Boss.DEATH:
        this.sprite = GET_BOSS_DIE_SPRITE();
        this.config = BOSS_CONF.die;
        // this.improveSize(50, 100);
        break;
      case Boss.STUN:
        this.sprite = GET_BOSS_STUN_SPRITE();
        this.config = BOSS_CONF.stun;
        this.improveSize(50, 100);
        break;
    }
    this.state = state;
  }

  checkAttack() {
    if (this.state == Boss.ATTACK && this.spriteIdx == 2) {
      this.game.shakeScene(2);
    }
    if (this.state == Boss.ATTACK && this.spriteIdx >= this.config.max - 1) {
      this.spriteIdx = 0;
      this.attackTimes += 1;
      if (this.attackTimes >= Setting.BOSS_ATTACK_TIMES) {
        this.attackTimes = 0;
        this.changeState(Boss.IDLE);
      }
    }
  }

  jump() {
    this.lookAtPlayer();
    this.changeState(Boss.JUMP);
    this.vy -= Setting.BOSS_JUMP_FORCE;
    this.jumping = true;
  }

  attack() {
    this.lookAtPlayer();
    this.changeState(Boss.ATTACK_PREP);
    setTimeout(() => {
      this.changeState(Boss.ATTACK);
    }, Setting.BOSS_ATTACK_PREP_TIME * 1000);
  }

  incrementInvert(n) {
    this.invert += n;
    if (this.invert >= 1) {
      this.invert = 1;
    }
  }

  decrementInvert(n) {
    this.invert -= n;
    if (this.invert <= 0) {
      this.invert = 0;
    }
  }
  checkIncrementInvert() {
    if (this.attacked) {
      const inc = Setting.BOSS_INVERT_MULTIPLIES * this.game.delta;
      this.incrementInvert(inc);
    } else {
      const dec = Setting.BOSS_INVERT_MULTIPLIES * this.game.delta;
      this.decrementInvert(dec);
    }
    if (this.invert >= 1) {
      this.attacked = false;
    }
  }

  checkJumpState() {
    if (this.jumping) {
      if (this.backward) {
        this.vx += -Setting.BOSS_JUMP_SPEED * this.game.delta;
      } else {
        this.vx += Setting.BOSS_JUMP_SPEED * this.game.delta;
      }
      if (this.spriteIdx >= this.config.max - 1) {
        this.spriteIdx = this.config.max - 1;
      }
    }
  }

  checkLandState() {
    if (this.state == Boss.LAND) {
      this.vx = 0;
      if (this.spriteIdx >= this.config.max - 1) {
        this.changeState(Boss.IDLE);
      }
    }
  }

  checkDeathState() {
    if (this.state == Boss.DEATH) {
      this.vx = 0;
      this.spriteIdx = 1;
    }
  }
  checkStunState() {
    if (this.state == Boss.STUN) {
      // console.log(this.backward);
      if (this.spriteIdx >= this.config.max - 1) {
        this.vx = 0;
        this.spriteIdx = this.config.max - 1;
        this.canCollide = true;
      }
    }
  }

  randomState() {
    if (this.state == Boss.IDLE) {
      // this.state = "";
      // setTimeout(() => {
      //   const attack = Math.random() < 0.5;
      //   if (attack) {
      //     this.attack();
      //   } else {
      //     this.jump();
      //   }
      // }, 1000);
    }
  }

  parentMethod() {
    // this.game.debug(
    //   this.x + this.offsetX,
    //   this.y + this.offsetY,
    //   this.w + this.offsetW,
    //   this.h + this.offsetH
    // );
    this.checkJumpState();
    this.checkOffset();
    this.checkIncrementInvert();
    this.checkAttack();
    this.checkLanding();
    this.checkLandState();
    this.checkDeathState();
    this.checkStunState();
    this.checkBound();
    this.randomState();
  }

  die() {
    this.death = true;
    this.ghostDie();
    this.canCollide = false;
    this.lookAtPlayer();
    if (this.backward) {
      this.vx += Setting.BOSS_DEATH_SPEED * this.game.delta;
    } else {
      this.vx += -Setting.BOSS_DEATH_SPEED * this.game.delta;
    }
    this.maxSpeed = Setting.BOSS_DEATH_SPEED;
    this.changeState(Boss.DEATH);
  }

  decrementHealth() {
    if (this.state == Boss.STUN) {
      this.health -= 1;
      if (this.health <= 0) {
        this.die();
      }
    } else {
      this.armor -= 1;
      if (this.armor <= 0) {
        this.stun();
      }
    }
  }

  stun() {
    this.canCollide = false;
    this.lookAtPlayer();
    if (this.backward) {
      this.vx += Setting.BOSS_DEATH_SPEED * this.game.delta;
    } else {
      this.vx += -Setting.BOSS_DEATH_SPEED * this.game.delta;
    }
    this.maxSpeed = Setting.BOSS_DEATH_SPEED;
    this.changeState(Boss.STUN);
    setTimeout(() => {
      if (!this.death) {
        this.maxSpeed = Setting.BOX_MAX_SPEED;
        this.changeState(Boss.IDLE);
        this.armor = Setting.BOSS_ARMOR;
        const offsetX = 550;
        if (this.backward) {
          this.x += offsetX;
        } else {
          this.x += -offsetX;
        }
      }
    }, Setting.BOSS_STUN_TIME);
  }

  hit() {
    this.decrementHealth();
    this.attacked = true;
    console.log(this.health);
  }
}