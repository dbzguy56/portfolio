textToBeTyped = "Hello, my name is Deepak and I am a self-taught developer :)"
i = 0
typingSpeed = 80

@copyEmail = ->
  copyEmail = document.getElementById("my-email")
  copyEmail.select()
  document.execCommand("Copy")

typeWriter = ->
  if (i < textToBeTyped.length)
    document.getElementById('intro-text').innerHTML += textToBeTyped.charAt(i)
    i++
    setTimeout(typeWriter, typingSpeed)

$(document).ready ->
  typeWriter()
