import SeededRandom from "./SeededRandom";
import Board from "./Board";
import KeyMap from "./KeyMap";
import Joystick from "./Joystick";
import Recorder from "./Recorder";
import FallCommand from './shape/commands/FallCommand';

export default class Game {
  private randomSeed: any
  private fallCommand = new FallCommand();
  private random: any;
  playerScore: any;
  private frameCount: number;
  private onProceed: any;
  turboMode: boolean;
  private difficulty: number;
  private config: any;
  private board: Board;
  private joystick: any;
  private recorder: any;
  private context: any;

  constructor(config) {
    this.context = config.context;
    this.config = config

    const keyMaps = [
    // @ts-ignore
      new KeyMap('ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'),
    // @ts-ignore
      new KeyMap('KeyA', 'KeyD', 'KeyW', 'KeyS'), // W-A-S-D
    // @ts-ignore
      new KeyMap('KeyH', 'KeyL', 'KeyK', 'KeyJ')  // VIM
    ];
    const keyMap = Object.assign.apply(this, keyMaps);

    // todo: custom controls would go somewhere here...

    // @ts-ignore
    this.joystick = new Joystick(keyMap);
    // @ts-ignore
    this.recorder = new Recorder(this.joystick, this);

    this.joystick.start();
    this.recorder.start();

    this.randomSeed = +(new Date());
    this.random = new SeededRandom(this.randomSeed);

    this.playerScore = (() => {
      let _playerScore = 0;
      const scoreThresholds = [149, 49, 39, 9, 0];

      return {
        get() {
          return _playerScore;
        },
        set(newScore) {
          _playerScore = newScore;

          scoreThresholds.some((threshold, index) => {
            if (newScore >= threshold) {
              this.difficulty = 5 - index;

              return true;
            }

            return false
          });
        },
        add(extraScore) {
          this.set(_playerScore + extraScore);
        }
      };
    })();

    this.board = new Board(
      this,
      config.board.boardWidth,
      config.board.boardHeight,
      config.board.brickSize,
      this.random
    );
    this.frameCount = 0;
    this.onProceed = undefined;
    this.difficulty = 1;
    this.turboMode = false;

    this.mainLoop()
  }


  private gravityIsActive() {
    const gameSpeeds = [null, 27, 24, 16, 12, 8];

    return this.turboMode || this.frameCount % gameSpeeds[this.difficulty] === 0;
  };

  drawReplay() {
    this.board.drawReplay(this.context);
  };

  restart() {
    this.random = new SeededRandom(this.randomSeed);
    this.playerScore.set(0);
    this.frameCount = 0;
    this.difficulty = 1;
    this.turboMode = false;
    this.board = new Board(this, this.config.board.boardWidth, this.config.board.boardHeight, this.config.board.brickSize, this.random);
  };

  setRandomSeed(newSeed) {
    this.randomSeed = newSeed;
  };

  private readCommand() {
    const nextKey = this.joystick.keyQueue.shift();
    const command = this.joystick.keyMap[nextKey]

    if (command) {
      command.execute.call(this.board.activeShape, this.board)
    }
  };

  proceed() {
    this.frameCount++;
    this.board.drawBackground(this.context);

    if (this.onProceed !== undefined) {
      this.onProceed();
    }

    this.readCommand();

    this.board.checkCollisions((collisions) => {
      this.board.activeShape.isFrozen = collisions.bottom;
    });

    if (this.board.activeShape.isFrozen) {
      for (let i = 0; i < 4; ++i) {
        this.board.staticBricks.push(this.board.activeShape.bricks.pop());
      }

      this.board.checkFilledRegions();
      this.turboMode = false;
      this.board.activeShape = this.board.spawnShape();

      if (this.board.isFull()) {
        this.restart();
      }
    } else {
      if (this.gravityIsActive()) {
        this.fallCommand.execute.call(this.board.activeShape, this.board)
      }

      this.board.activeShape.draw(this.context);
    }

    this.board.drawStaticBricks(this.context);
    this.board.drawScore(this.context);
  };

  private mainLoop() {
    this.proceed();
    requestAnimationFrame(this.mainLoop.bind(this));
  };
}