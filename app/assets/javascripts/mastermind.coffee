turn = 0
piecesList = undefined
secretColorCode = []

@allowDrop = (ev) ->
  ev.preventDefault()
  return

@drag = (ev) ->
  ev.dataTransfer.setData("text", ev.target.className)
  return

@drop = (ev) ->
  ev.preventDefault()
  ev.target.className = ev.dataTransfer.getData("text")
  ev.target.className = ev.target.className.replace("col-xs-6", "col-xs-3")
  return

@checkGuess = ->
  row = turn * 4
  correctPositionGuesses = 0
  correctGuesses = 0
  secondCol = row + 1
  thirdCol = row + 2
  fourthCol = row + 3
  if piecesList[row].classList.item(3) != null && piecesList[secondCol].classList.item(3) != null &&
  piecesList[thirdCol].classList.item(3) != null && piecesList[fourthCol].classList.item(3) != null
    i = 0
    secretColorsLeft = secretColorCode
    piecesColorsLeft = [piecesList[row].classList.item(3),piecesList[secondCol].classList.item(3),piecesList[thirdCol].classList.item(3),piecesList[fourthCol].classList.item(3)]
    while i < 4
      j = 0
      while j < 4
        console.log("Piece: " + piecesColorsLeft[row + j] + ", SecretColor: " + secretColorCode[i] + "\n" + "i: " + i + " ,j: " + j)
        if piecesColorsLeft[row + j] == secretColorCode[i]
          #if one of the pieces match the secretColorCode
          if piecesColorsLeft[row + i] == secretColorCode[i]
            #if the piece position is at the same position as the secretColorCode position
            correctPositionGuesses++
            console.log("correct pos: " + correctPositionGuesses)
          else
            correctGuesses++
            piecesColorsLeft[row + j] = ""
            console.log("wrong pos: " + correctGuesses)
            j = 0
          i++
          continue
        j++
      i++

    console.log(correctPositionGuesses + ", " + correctGuesses)

    guessIndicatorSymbols = document.querySelectorAll('.guess-indicator')
    count = 0
    while count < 4
      if correctPositionGuesses > 0
        guessIndicatorSymbols[count].innerHTML = "\u263b"
        guessIndicatorSymbols[count].classList.add("green")
        correctPositionGuesses--
      else if correctGuesses > 0
        guessIndicatorSymbols[count].innerHTML = "\u263b"
        guessIndicatorSymbols[count].classList.add("red")
        correctGuesses--
      else
        guessIndicatorSymbols[count].innerHTML = "\u2639"
      count++


    if turn != -1 || turn == 11
      piecesList[row].setAttribute("ondrop", "")
      piecesList[secondCol].setAttribute("ondrop", "")
      piecesList[thirdCol].setAttribute("ondrop", "")
      piecesList[fourthCol].setAttribute("ondrop", "")
    if turn != 11
      turn += 1
      row = turn * 4
      piecesList[row].setAttribute("ondrop", "drop(event)")
      piecesList[row + 1].setAttribute("ondrop", "drop(event)")
      piecesList[row + 2].setAttribute("ondrop", "drop(event)")
      piecesList[row + 3].setAttribute("ondrop", "drop(event)")
      document.getElementById("turnNumber").innerHTML = 'Turn: ' + (turn + 1)
    else
      document.getElementById('checkButton').style.visibility = 'hidden'
      document.getElementById("turnNumber").innerHTML = 'You lose!'
  return


$(document).ready ->
  colors = ["red", "green", "blue", "yellow", "magenta", "cyan"]
  i = 0
  while i < 4
    secretColorCode.push colors[Math.floor(Math.random() * 6)]
    i++
  #secretColorCode = ["blue", "blue", "blue", "blue"]
  console.log(secretColorCode)
  piecesList = document.querySelectorAll('#board .piece')
  piecesList[0].setAttribute("ondrop", "drop(event)")
  piecesList[1].setAttribute("ondrop", "drop(event)")
  piecesList[2].setAttribute("ondrop", "drop(event)")
  piecesList[3].setAttribute("ondrop", "drop(event)")
  boardStyle = document.querySelector('#board')
  allPieces = document.querySelectorAll('.piece')
  boardPieces = document.querySelectorAll('#board .piece')
  colorPieces = document.querySelectorAll('#colors .piece')
  colorsDiv = document.querySelector('#colors')


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
