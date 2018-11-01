import TapeItem from './TapeItem'

export default class Recorder {
  public tape: TapeItem[]
  public lastFrame: number

  constructor(public joystick, public game) {
    this.tape = []
    this.lastFrame = Infinity
  }

  public stop() {
    this.joystick.setCallback('anyKey', undefined)
    this.joystick.setCallback('Escape', undefined)
  }

  public start() {
    this.joystick.setCallback('anyKey', (key) => {
      this.tape.push(new TapeItem(key, this.game.frameCount))
    })

    this.joystick.setCallback('Escape', () => {
      this.joystick.stop()
      this.lastFrame = this.game.frameCount
      stop()
      this.tape.pop()
      this.play()
      this.game.restart()
      this.game.setRandomSeed(+(new Date()))
    })
  }

  public play = () => {
    this.game.onProceed = () => {
      if (this.game.frameCount !== this.lastFrame) {
        this.game.drawReplay()

        if (this.tape.length && this.game.frameCount === this.tape[0].frame) {
          this.joystick.keyQueue.push(this.tape.shift().key)
        }
      } else {
        this.game.onProceed = undefined
        this.joystick.start()
        this.start()
        this.game.restart()
      }
    }
  }
}
