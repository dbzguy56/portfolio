turn = -1
piecesList = undefined

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
  if turn != -1 || turn == 11
    row = turn * 4
    piecesList[row].setAttribute("ondrop", "")
    piecesList[row + 1].setAttribute("ondrop", "")
    piecesList[row + 2].setAttribute("ondrop", "")
    piecesList[row + 3].setAttribute("ondrop", "")
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
  piecesList = document.querySelectorAll('#board .piece')
  checkGuess()
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
