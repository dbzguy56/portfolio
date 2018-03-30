@allowDrop = (ev) ->
  ev.preventDefault()
  return

@drag = (ev) ->
  ev.dataTransfer.setData("text", ev.target.className)
  #e.dataTransfer.items.add(e.target.id, "text/html")
  return

@drop = (ev) ->
  ev.preventDefault()
  ev.target.className = ev.dataTransfer.getData("text")
  ev.target.className = ev.target.className.replace("col-xs-6", "col-xs-3")
  return

$(document).ready ->
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
    #x.style.width = String(boardStyle.offsetWidth/4).concat('px')
    return

  colorsDiv.style.width = String(boardStyle.offsetWidth/3).concat('px')
  colorsDiv.style.height = String(boardStyle.offsetHeight/4).concat('px')

  colorPieces[0].classList.add('red')
  colorPieces[1].classList.add('green')
  colorPieces[2].classList.add('blue')
  colorPieces[3].classList.add('yellow')
  colorPieces[4].classList.add('magenta')
  colorPieces[5].classList.add('cyan')
