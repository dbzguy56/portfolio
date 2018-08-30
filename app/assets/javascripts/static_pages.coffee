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

headerTransparency =->
  if $(window).scrollTop() > 100
    $('.navbar-inverse').removeClass 'header-bg-clear'
    $('.navbar-inverse').addClass 'header-bg-unclear'
  else
    $('.navbar-inverse').addClass 'header-bg-clear'
    $('.navbar-inverse').removeClass 'header-bg-unclear'

$(document).ready ->
  typeWriter()
  $('.navbar-inverse').addClass 'header-bg-clear'
  $(window).on 'scroll', ->
    headerTransparency()
