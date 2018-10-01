textToBeTyped = "Hello, my name is Deepak and I am a self-taught developer :)"
i = 0
typingSpeed = 80

@copyEmail = ->
  copyEmail = document.getElementById("my-email")
  copyEmail.select()
  document.execCommand("Copy")

###
#@removeBgColor = ->
  a = document.querySelectorAll('.dropdown .unclear-bg-color')
  if (a.length != 0)
    $('.dropdown').removeClass 'unclear-bg-color'
    $('.dropdown').addClass 'clear-bg-color'
  else
    $('.dropdown').removeClass 'clear-bg-color'
    $('.dropdown').addClass 'unclear-bg-color'
###
typeWriter = ->
  if (i < textToBeTyped.length)
    document.getElementById('intro-text').innerHTML += textToBeTyped.charAt(i)
    i++
    setTimeout(typeWriter, typingSpeed)

headerTransparency =->
  if $(window).scrollTop() > 100
    $('.navbar').removeClass 'header-bg-clear'
    $('.navbar').addClass 'header-bg-unclear'
  else
    $('.navbar').addClass 'header-bg-clear'
    $('.navbar').removeClass 'header-bg-unclear'

$(document).ready ->
  typeWriter()


  $('.navbar').addClass 'header-bg-clear'
  $(window).on 'scroll', ->
    headerTransparency()
