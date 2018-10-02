textToBeTyped = "Hello, my name is Deepak and I am a self-taught developer :)"
i = 0
typingSpeed = 80
collapsed = true

@copyEmail = ->
  copyEmail = document.getElementById("my-email")
  copyEmail.select()
  document.execCommand("Copy")


###
#@addBgColor = ->

  if (collapsed)
    $('.navbar').removeClass 'header-bg-clear'
    $('.navbar').addClass 'header-bg-unclear'
  else
    $('.navbar').addClass 'header-bg-clear'
    $('.navbar').removeClass 'header-bg-unclear'
  collapsed = !collapsed

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
###

$(document).ready ->
  #typeWriter()

###
  $('.navbar').addClass 'header-bg-clear'
  $(window).on 'scroll', ->
    headerTransparency()

  $('#collapsable-btn').on 'hide.bs.collapse', (e) ->
    console.log("oo")
    return
###
