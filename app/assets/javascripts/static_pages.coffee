textToBeTyped = "Hello, my name is Deepak and I am a self-taught developer:)"
i = 0
typingSpeed = 60

typeWriter = ->
  if (i < textToBeTyped.length)
    document.getElementById('intro-text').innerHTML += textToBeTyped.charAt(i)
    i++
    setTimeout(typeWriter, typingSpeed)

$(document).ready ->
  typeWriter()
