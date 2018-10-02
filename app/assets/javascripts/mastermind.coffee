colors = ["red", "green", "blue", "yellow", "magenta", "cyan"]
turn = 0
piecesList = undefined
turnSpans = undefined
secretColorCode = []

@newGame = ->
  turnSpans[turn].style.color = "white"
  turnSpans[turn].style.backgroundColor = "transparent"
  turnSpans[0].style.color = "black"
  turnSpans[0].style.backgroundColor = "white"
  guessIndicatorSymbols = document.querySelectorAll('.guess-indicator')
  i = 0
  secretColorCode = []
  while i < 4 #new secret color code
    secretColorCode.push colors[Math.floor(Math.random() * 6)]
    i++

  #console.log(secretColorCode)
  secretColors = document.querySelectorAll('#correct-colors .piece')

  while turn >= 0
    row = turn * 4
    secondCol = row + 1
    thirdCol = row + 2
    fourthCol = row + 3
    count = 0

    while count < 6 #check for each color in each piece in the row
      if piecesList[row].classList.contains(colors[count])
        piecesList[row].classList.remove(colors[count])
      if piecesList[secondCol].classList.contains(colors[count])
        piecesList[secondCol].classList.remove(colors[count])
      if piecesList[thirdCol].classList.contains(colors[count])
        piecesList[thirdCol].classList.remove(colors[count])
      if piecesList[fourthCol].classList.contains(colors[count])
        piecesList[fourthCol].classList.remove(colors[count])

      if row == 0
        if secretColors[row].classList.contains(colors[count])
          secretColors[row].classList.remove(colors[count])
        if secretColors[secondCol].classList.contains(colors[count])
          secretColors[secondCol].classList.remove(colors[count])
        if secretColors[thirdCol].classList.contains(colors[count])
          secretColors[thirdCol].classList.remove(colors[count])
        if secretColors[fourthCol].classList.contains(colors[count])
          secretColors[fourthCol].classList.remove(colors[count])

      if count < 4
        guessIndicatorSymbols[row + count].innerHTML = ""
        guessIndicatorSymbols[row + count].classList.remove(colors[0])
        guessIndicatorSymbols[row + count].classList.remove(colors[1])
        guessIndicatorSymbols[row + count].classList.remove("white-text")

      count++

    piecesList[row].setAttribute("ondrop", "")
    piecesList[secondCol].setAttribute("ondrop", "")
    piecesList[thirdCol].setAttribute("ondrop", "")
    piecesList[fourthCol].setAttribute("ondrop", "")

    turn--

  piecesList[0].setAttribute("ondrop", "drop(event)")
  piecesList[1].setAttribute("ondrop", "drop(event)")
  piecesList[2].setAttribute("ondrop", "drop(event)")
  piecesList[3].setAttribute("ondrop", "drop(event)")

  secretColors[0].classList.add(secretColorCode[0])
  secretColors[1].classList.add(secretColorCode[1])
  secretColors[2].classList.add(secretColorCode[2])
  secretColors[3].classList.add(secretColorCode[3])

  turn = 0
  document.getElementById("turn-number").innerHTML = 'Turn: 1'
  document.getElementById('checkButton').style.visibility = 'visible'
  document.getElementById('correct-colors').style.visibility = 'hidden'

@allowDrop = (ev) ->
  ev.preventDefault()
  return

@drag = (ev) ->
  ev.dataTransfer.setData("text", ev.target.className)
  return

@drop = (ev) ->
  ev.preventDefault()
  ev.target.className = ev.dataTransfer.getData("text")
  ev.target.className = ev.target.className.replace("col-6", "col-xs-3")
  return

@checkGuess = ->
  piecesList = document.querySelectorAll('#board .piece')
  row = turn * 4
  correctPositionGuesses = 0
  correctGuesses = 0
  secondCol = row + 1
  thirdCol = row + 2
  fourthCol = row + 3
  if piecesList[row].classList.item(3) != null && piecesList[secondCol].classList.item(3) != null &&
  piecesList[thirdCol].classList.item(3) != null && piecesList[fourthCol].classList.item(3) != null
    i = 0
    piecesColorsLeft = [piecesList[row].classList.item(3),piecesList[secondCol].classList.item(3),piecesList[thirdCol].classList.item(3),piecesList[fourthCol].classList.item(3)]
    while i < 4
      j = 0
      while j < 4
        #console.log("Piece: " + piecesColorsLeft[j] + ", SecretColor: " + secretColorCode[i] + "\n" + "i: " + i + " ,j: " + j + " , row: " + row)
        if piecesColorsLeft[j] == secretColorCode[i]
          #if one of the pieces match the secretColorCode
          if piecesColorsLeft[j] == secretColorCode[j]
            #if the piece position is at the same position as the secretColorCode position
            correctPositionGuesses++
            piecesColorsLeft[j] = ""
            #console.log("correct pos: " + correctPositionGuesses)
          else if piecesColorsLeft[i] == secretColorCode[i]
            correctPositionGuesses++
            piecesColorsLeft[i] = ""
            #console.log("correct pos: " + correctPositionGuesses)
          else
            correctGuesses++
            #console.log("wrong pos: " + correctGuesses)
            piecesColorsLeft[j] = ""
          #console.log("Colors Left:" + piecesColorsLeft)
          j = 0
          i++
          continue
        j++
      i++

    #console.log(correctPositionGuesses + ", " + correctGuesses)
    winner = false
    if correctPositionGuesses == 4
      winner = true

    guessIndicatorSymbols = document.querySelectorAll('.guess-indicator')
    count = 0
    while count < 4
      pos = row + count
      if correctPositionGuesses > 0
        guessIndicatorSymbols[pos].innerHTML = "\u263b"
        guessIndicatorSymbols[pos].classList.add("green")
        correctPositionGuesses--
      else if correctGuesses > 0
        guessIndicatorSymbols[pos].innerHTML = "\u263b"
        guessIndicatorSymbols[pos].classList.add("red")
        correctGuesses--
      else
        guessIndicatorSymbols[pos].innerHTML = "\u2639"
        guessIndicatorSymbols[pos].classList.add("white-text")
      count++

    piecesList[row].setAttribute("ondrop", "")
    piecesList[secondCol].setAttribute("ondrop", "")
    piecesList[thirdCol].setAttribute("ondrop", "")
    piecesList[fourthCol].setAttribute("ondrop", "")
    if turn != 11
      turnSpans[turn].style.color = "white"
      turnSpans[turn].style.backgroundColor = "transparent"
      turn += 1
      turnSpans[turn].style.color = "black"
      turnSpans[turn].style.backgroundColor = "white"
      row = turn * 4

      piecesList[row].setAttribute("ondrop", "drop(event)")
      piecesList[row + 1].setAttribute("ondrop", "drop(event)")
      piecesList[row + 2].setAttribute("ondrop", "drop(event)")
      piecesList[row + 3].setAttribute("ondrop", "drop(event)")
      if winner
        document.getElementById('checkButton').style.visibility = 'hidden'
        document.getElementById("turn-number").innerHTML = 'You win!'
      else
        document.getElementById("turn-number").innerHTML = 'Turn: ' + (turn + 1)
    else
      document.getElementById('checkButton').style.visibility = 'hidden'
      document.getElementById("turn-number").innerHTML = 'You lose!'
      document.getElementById('correct-colors').style.visibility = 'visible'
  return


@handleInstructClick = ->
  text = document.getElementById('how-to-play-text').innerHTML
  if text[text.length-2] == '+'
    document.getElementById('how-to-play-text').innerHTML = "How to play [-]"
  else
    document.getElementById('how-to-play-text').innerHTML = "How to play [+]"

$(document).ready ->
  turnSpans = document.querySelectorAll('#turn-span')
  turnSpans[0].style.color = "black"
  turnSpans[0].style.backgroundColor = "white"
  i = 0
  while i < 4
    secretColorCode.push colors[Math.floor(Math.random() * 6)]
    i++

  secretColors = document.querySelectorAll('#correct-colors .piece')
  secretColors[0].classList.add(secretColorCode[0])
  secretColors[1].classList.add(secretColorCode[1])
  secretColors[2].classList.add(secretColorCode[2])
  secretColors[3].classList.add(secretColorCode[3])

  #secretColorCode = ["red", "yellow", "red", "green"]
  #console.log(secretColorCode)
  piecesList = document.querySelectorAll('#board .piece')
  piecesList[0].setAttribute("ondrop", "drop(event)")
  piecesList[1].setAttribute("ondrop", "drop(event)")
  piecesList[2].setAttribute("ondrop", "drop(event)")
  piecesList[3].setAttribute("ondrop", "drop(event)")
  boardStyle = document.querySelector('#board')
  allPieces = document.querySelectorAll('.piece')
  colorPieces = document.querySelectorAll('#colors .piece')
  colorsDiv = document.querySelector('#colors')
  examplePieces = document.querySelectorAll('.example')

  colorPieces[0].style.borderRadius = "20px 0px 0px 0px"
  colorPieces[1].style.borderRadius = "0px 20px 0px 0px"
  colorPieces[4].style.borderRadius = "0px 0px 0px 20px"
  colorPieces[5].style.borderRadius = "0px 0px 20px 0px"

  piecesList[0].style.borderRadius = "20px 0px 0px 0px"
  piecesList[3].style.borderRadius = "0px 20px 0px 0px"
  piecesList[44].style.borderRadius = "0px 0px 0px 20px"
  piecesList[47].style.borderRadius = "0px 0px 20px 0px"

  j = 0
  while j < 2
    group = j * 4
    examplePieces[group + 0].style.borderRadius = "20px 0px 0px 20px"
    examplePieces[group + 3].style.borderRadius = "0px 20px 20px 0px"
    j++


  allPieces.forEach (piece) ->
    piece.style.height = String(boardStyle.offsetHeight/12).concat('px')
    return

  colorsDiv.style.width = String(boardStyle.offsetWidth/3).concat('px')
  colorsDiv.style.height = String(boardStyle.offsetHeight/4).concat('px')

  colorPieces[0].classList.add('red')
  colorPieces[1].classList.add('green')
  colorPieces[2].classList.add('blue')
  colorPieces[3].classList.add('yellow')
  colorPieces[4].classList.add('magenta')
  colorPieces[5].classList.add('cyan')
