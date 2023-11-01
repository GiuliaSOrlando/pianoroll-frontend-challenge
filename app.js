import PianoRoll from "./pianoroll.js"

document.addEventListener("DOMContentLoaded", () => {
  const gridContainer = document.querySelector(".grid-container")
  const mainView = document.querySelector(".main-view")
  const listContainer = document.querySelector(".list-container")
  let startIndex = 0
  let currentMainView = null

  class PianoRollDisplay {
    constructor() {
      this.data = null
    }

    async loadPianoRollData() {
      try {
        const response = await fetch("https://pianoroll.ai/random_notes")
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        this.data = await response.json()
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    preparePianoRollCard(rollId) {
      const cardDiv = document.createElement("div")
      cardDiv.classList.add("piano-roll-card")

      const descriptionDiv = document.createElement("div")
      descriptionDiv.classList.add("description")
      descriptionDiv.textContent = `This is a piano roll number ${rollId + 1}`
      cardDiv.appendChild(descriptionDiv)

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      svg.classList.add("piano-roll-svg")
      svg.setAttribute("width", "80%")
      svg.setAttribute("height", "150")

      svg.addEventListener("click", () => {
        if (currentMainView) {
          listContainer.appendChild(currentMainView)
        }
        this.movePianoRollToMainView(cardDiv)
        this.movePianoRollsToSide()
      })

      cardDiv.appendChild(svg)
      return { cardDiv, svg }
    }

    movePianoRollToMainView(cardDiv, svg) {
      gridContainer.classList.add("grid-hidden")
      mainView.classList.add("main-expanded")
      listContainer.classList.add("list-expanded")
      if (currentMainView) {
        listContainer.appendChild(currentMainView)
      }

      mainView.innerHTML = ""
      mainView.appendChild(cardDiv)
      currentMainView = cardDiv
    }

    movePianoRollsToSide() {
      const gridChildren = Array.from(gridContainer.children)
      gridChildren.forEach((child) => {
        if (child !== currentMainView) {
          listContainer.appendChild(child)
        }
      })
    }

    async generatePianoRolls(startIndex) {
      if (!this.data) {
        console.log("Loading data...")
        await this.loadPianoRollData()
      }

      if (!this.data) {
        console.error("No data available.")
        return
      }

      const numPianoRollsToGenerate = 36
      for (
        let it = startIndex;
        it < startIndex + numPianoRollsToGenerate;
        it++
      ) {
        if (it >= this.data.length) {
          console.error(
            `Insufficient data for roll ${it}. Stopping data loading.`
          )
          return
        }

        const start = startIndex + it * 10
        const end = start + 10

        console.log("Start:", start, "End:", end)

        // Check if there's enough data for this roll
        if (start < this.data.length && end <= this.data.length) {
          const partData = this.data.slice(start, end)
          const { cardDiv, svg } = this.preparePianoRollCard(it)
          gridContainer.appendChild(cardDiv)
          const roll = new PianoRoll(svg, partData)
        } else {
          console.error(`Display no more data =).`)
        }
      }
    }
  }

  const csvToSVG = new PianoRollDisplay()

  const loadButton = document.querySelector("#loadDataButton")
  loadButton.addEventListener("click", async () => {
    startIndex += 36
    const csvToSVG = new PianoRollDisplay()
    await csvToSVG.generatePianoRolls(startIndex)
  })

  csvToSVG.generatePianoRolls(startIndex)
})
