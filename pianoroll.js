export function generateGradientTable(startColor, endColor, steps) {
  const gradientTable = []
  for (let i = 0; i < steps; i++) {
    const r = startColor.r + ((endColor.r - startColor.r) * i) / (steps - 1)
    const g = startColor.g + ((endColor.g - startColor.g) * i) / (steps - 1)
    const b = startColor.b + ((endColor.b - startColor.b) * i) / (steps - 1)
    gradientTable.push(
      `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    )
  }
  return gradientTable
}

class SelectionTool {
  constructor(pianoRoll) {
    this.pianoRoll = pianoRoll
    this.selection = null
    this.selectionRectangle = null
    this.isSelecting = false
    this.isTouch = false

    this.selectedColor = "rgba(0, 0, 255, 0.2"

    this.pianoRoll.svgElement.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    )
    this.pianoRoll.svgElement.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    )
    this.pianoRoll.svgElement.addEventListener(
      "mouseup",
      this.handleMouseUp.bind(this)
    )

    // Touch event listeners
    this.pianoRoll.svgElement.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this)
    )
    this.pianoRoll.svgElement.addEventListener(
      "touchmove",
      this.handleTouchMove.bind(this)
    )
    this.pianoRoll.svgElement.addEventListener(
      "touchend",
      this.handleTouchEnd.bind(this)
    )
  }

  handleMouseDown(event) {
    if (!this.isSelecting) {
      this.isSelecting = true
      const x =
        event.clientX - this.pianoRoll.svgElement.getBoundingClientRect().left
      this.selection = {
        start: this.pianoRoll.timeToX(x),
        end: this.pianoRoll.timeToX(x),
      }

      this.createSelectionRectangle()
      console.log(this.selection)
    }
  }

  handleMouseMove(event) {
    if (this.isSelecting) {
      const x =
        event.clientX - this.pianoRoll.svgElement.getBoundingClientRect().left
      this.selection.end = this.pianoRoll.timeToX(x)
      this.updateSelectionRectangle()
    }
  }

  handleMouseUp() {
    if (this.isSelecting) {
      this.isSelecting = false
      this.updateSelectionRectangle()
      this.captureSelectionData()
    }
  }

  handleTouchStart(event) {
    this.isTouch = true
    this.handleMouseDown(event.touches[0])
  }

  handleTouchMove(event) {
    if (this.isTouch) {
      this.handleMouseMove(event.touches[0])
    }
  }

  handleTouchEnd(event) {
    if (this.isTouch) {
      this.isTouch = false
      this.handleMouseUp()
    }
  }

  createSelectionRectangle() {
    this.selectionRectangle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    )
    this.selectionRectangle.setAttribute("fill", this.selectedColor)
    this.selectionRectangle.setAttribute("stroke", "blue")
    this.selectionRectangle.setAttribute("stroke-width", "2")
    this.pianoRoll.svgElement.appendChild(this.selectionRectangle)
    console.log("Create Selection Rectangle")
  }

  updateSelectionRectangle() {
    if (this.selectionRectangle) {
      const x1 = Math.min(this.selection.start, this.selection.end)
      const x2 = Math.max(this.selection.start, this.selection.end)
      const width = x2 - x1

      this.selectionRectangle.setAttribute("x", x1.toString())
      this.selectionRectangle.setAttribute("y", "0")
      this.selectionRectangle.setAttribute("width", width.toString())
      this.selectionRectangle.setAttribute("height", "1")
      console.log("Update Selection Rectangle")
    }
  }

  captureSelectionData() {
    if (this.selectionRectangle) {
      this.selectionRectangle.setAttribute("fill", this.selectedColor)
    }
    console.log("Capture Selection Data")
    console.log("Selection Start: " + this.selection.start)
    console.log("Selection End: " + this.selection.end)
    // You can add code here to count the number of notes within the selection.
  }
}

export default class PianoRoll {
  constructor(svgElement, sequence) {
    this.svgElement = svgElement
    this.end = null

    this.selectionTool = new SelectionTool(this)

    // PianoRoll brand #5DB5D5

    const backgroundStartColor = { r: 93, g: 181, b: 213 }
    // #154151
    const backgroundEndColor = { r: 21, g: 65, b: 81 }
    this.backgroundColormap = generateGradientTable(
      backgroundStartColor,
      backgroundEndColor,
      128
    )

    const noteStartColor = { r: 66, g: 166, b: 161 }
    const noteEndColor = { r: 28, g: 28, b: 26 }
    this.noteColormap = generateGradientTable(noteStartColor, noteEndColor, 128)

    this.svgElement.setAttribute("viewBox", "0 0 1 1")
    this.svgElement.setAttribute("preserveAspectRatio", "none")
    this.drawPianoRoll(sequence)
  }

  timeToX(time) {
    return time / this.end
  }

  drawPianoRoll(sequence) {
    this.start = sequence[0].start
    this.end = sequence[sequence.length - 1].end - this.start
    // Extract just the pitches to prepare the SVG parameters
    const pitches = sequence.map((note) => {
      return note.pitch
    })

    // Make it at lest 2 octaves (2 * 12)
    let pitch_min = Math.min(...pitches)
    let pitch_max = Math.max(...pitches)
    let pitch_span = pitch_max - pitch_min

    // If the span is too low, we have to extend it equally on both sides
    if (pitch_span < 24) {
      const diff = 24 - pitch_span
      const low = Math.ceil(diff / 2)
      const high = Math.floor(diff / 2)
      pitch_min -= low
      pitch_max += high
    }
    // And margin up and down
    pitch_min -= 3
    pitch_max += 3
    pitch_span = pitch_max - pitch_min
    this.note_height = 1 / pitch_span
    this.drawEmptyPianoRoll(pitch_min, pitch_max)

    sequence.forEach((note) => {
      const note_rectangle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      )

      // Position and width are based on time
      const x = this.timeToX(note.start - this.start)
      const w = this.timeToX(note.end - note.start)

      note_rectangle.setAttribute("x", `${x}`)
      note_rectangle.setAttribute("width", `${w}`)

      // Computers draw upside down
      const y = 1 - (note.pitch - pitch_min) / pitch_span

      note_rectangle.setAttribute("y", `${y}`)
      note_rectangle.setAttribute("height", `${this.note_height}`)

      // Colorcoding velocity
      const color = this.noteColormap[note.velocity]
      note_rectangle.setAttribute("fill", color)

      note_rectangle.classList.add("note-rectangle")

      // Draw it
      this.svgElement.appendChild(note_rectangle)
    })
  }

  drawEmptyPianoRoll(pitch_min, pitch_max) {
    const pitch_span = pitch_max - pitch_min
    for (let it = pitch_min; it <= pitch_max + 1; it++) {
      // Black keys
      if ([1, 3, 6, 8, 10].includes(it % 12)) {
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        )
        const y = 1 - (it - pitch_min) / pitch_span
        const x = 0
        const h = 1 / pitch_span
        const w = 1

        rect.setAttribute("fill", this.backgroundColormap[12])
        rect.setAttribute("fill-opacity", "0.666")
        rect.setAttribute("x", `${x}`)
        rect.setAttribute("y", `${y}`)
        rect.setAttribute("width", `${w}`)
        rect.setAttribute("height", `${h}`)
        this.svgElement.appendChild(rect)
      }

      // Key separation
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line")
      const y = 1 - (it - pitch_min) / pitch_span + 1 / pitch_span
      line.setAttribute("x1", "0")
      line.setAttribute("y1", `${y}`)
      line.setAttribute("x2", "2")
      line.setAttribute("y2", `${y}`)
      let line_width

      // Every octave, line is bolder
      if (it % 12 === 0) {
        line_width = 0.003
      } else {
        line_width = 0.001
      }
      line.setAttribute("stroke-width", `${line_width}`)
      line.setAttribute("stroke", "black")
      this.svgElement.appendChild(line)
    }
  }
}
